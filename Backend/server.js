// server.js
import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs/promises";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "2mb" }));

// ensure uploads dir exists
await fs.mkdir("uploads", { recursive: true }).catch(() => {});

// file uploads (max 20MB)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ----------------- helpers -----------------
function cleanText(s = "") {
  return s.replace(/\s+/g, " ").trim();
}
function roughTokens(txt = "") {
  if (!txt) return 0;
  const words = txt.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}
function splitIntoChunks(text, maxTokens = 2500, overlapWords = 120) {
  const words = text.split(/\s+/);
  const approxWordsPerChunk = Math.floor(maxTokens / 1.3);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const end = Math.min(words.length, i + approxWordsPerChunk);
    chunks.push(words.slice(i, end).join(" "));
    i = end - overlapWords;
    if (i < 0) i = 0;
    if (i >= words.length) break;
  }
  return chunks;
}
function buildPrompt(style = "concise", language = "English") {
  let form = "Write a short 3-5 sentence summary.";
  if (style === "detailed")
    form = "Write a clear summary in 2-4 short paragraphs.";
  if (style === "bullets")
    form = "Write 5-8 bullet points. Each bullet must be crisp and factual.";
  return `You summarize documents for busy readers.
Output language: ${language}
Form: ${form}
Rules:
- Keep important facts, names, numbers, and dates.
- Be neutral and precise.
- Return only the summary.`;
}

// ----------------- extractors -----------------
async function readFromPDF(filePath) {
  const buf = await fs.readFile(filePath);
  const data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    fullText += content.items.map((it) => it.str || "").join(" ") + "\n";
  }
  return fullText.trim();
}

async function readFromDOCX(filePath) {
  const { value } = await mammoth.extractRawText({ path: filePath });
  return value || "";
}
async function readFromTXT(filePath) {
  return await fs.readFile(filePath, "utf8");
}

// ----------------- Gemini -----------------
const MODEL_CANDIDATES = [
  process.env.MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-pro-latest",
].filter(Boolean);

async function runWithFallback(prompt) {
  let lastErr;
  for (const name of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text && text.trim()) {
        console.log("Using Gemini model:", name);
        return text.trim();
      }
      lastErr = new Error(`Empty response from ${name}`);
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("No compatible Gemini model for this API key.");
}

async function summarizeChunkWithGemini(textChunk, style, language) {
  const prompt = `${buildPrompt(style, language)}\n\nTEXT:\n${textChunk}`;
  return await runWithFallback(prompt);
}
async function mergeSummariesWithGemini(summaries, style, language) {
  if (summaries.length === 1) return summaries[0];
  const joined = summaries.map((s, i) => `Part ${i + 1}:\n${s}`).join("\n\n");
  const prompt = `${buildPrompt(
    style,
    language
  )}\n\nCombine these parts into ONE clear summary:\n\n${joined}`;
  return await runWithFallback(prompt);
}

// ----------------- routes -----------------
app.get("/", (_req, res) => {
  res.send("Document Summarizer Backend is running...");
});

app.post("/api/summarize", upload.single("file"), async (req, res) => {
  try {
    const sourceType = (req.body.sourceType || "text").toLowerCase(); // text | file
    const style = ["concise", "detailed", "bullets"].includes(req.body.style)
      ? req.body.style
      : "concise";
    const language = req.body.language || "English";

    let rawText = "";

    if (sourceType === "text") {
      rawText = req.body.text || "";
    } else if (sourceType === "file") {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const name = (req.file.originalname || "").toLowerCase();
      try {
        if (name.endsWith(".pdf")) rawText = await readFromPDF(req.file.path);
        else if (name.endsWith(".docx"))
          rawText = await readFromDOCX(req.file.path);
        else if (name.endsWith(".txt"))
          rawText = await readFromTXT(req.file.path);
        else
          return res
            .status(400)
            .json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." });
      } finally {
        fs.unlink(req.file.path).catch(() => {});
      }
    } else {
      return res
        .status(400)
        .json({ error: "Invalid sourceType. Use: text | file" });
    }

    rawText = cleanText(rawText);
    if (!rawText || rawText.length < 30) {
      return res
        .status(400)
        .json({ error: "Document is empty or too short to summarize" });
    }

    const totalTokens = roughTokens(rawText);
    const maxChunkTokens = Number(process.env.MAX_CHUNK_TOKENS || 2500);
    const chunks =
      totalTokens > maxChunkTokens
        ? splitIntoChunks(rawText, maxChunkTokens)
        : [rawText];

    const partialSummaries = [];
    for (const c of chunks) {
      partialSummaries.push(await summarizeChunkWithGemini(c, style, language));
    }
    const finalSummary = await mergeSummariesWithGemini(
      partialSummaries,
      style,
      language
    );

    const summaryTokens = roughTokens(finalSummary);
    const reductionRatio = Math.max(0, 1 - summaryTokens / totalTokens);

    return res.json({
      summary: finalSummary,
      metrics: {
        originalTokens: totalTokens,
        summaryTokens,
        reductionRatio: Number(reductionRatio.toFixed(2)),
      },
    });
  } catch (err) {
    console.error("Summarize failed:", err);
    return res
      .status(500)
      .json({ error: err.message || "Summarization failed" });
  }
});

// ----------------- start -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
