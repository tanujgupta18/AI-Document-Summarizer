import { useState } from "react";
import { summarizeText, summarizeFile } from "../api/summarize";
import CustomSelect from "./CustomSelect";

export default function SummarizeForm({ onResult }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const [style, setStyle] = useState("concise");
  const [language, setLanguage] = useState("English");
  const [maxRatio, setMaxRatio] = useState(0.25);

  const [loading, setLoading] = useState(false);

  // inline errors
  const [error, setError] = useState(null); // global backend/unknown error
  const [textError, setTextError] = useState(null);
  const [fileError, setFileError] = useState(null);

  function resetErrors() {
    setError(null);
    setTextError(null);
    setFileError(null);
  }

  function firstNonEmptyLine(s) {
    return (s || "").split(/\r?\n/).find((l) => l.trim()) || "";
  }

  async function handleSubmit() {
    if (loading) return;
    setLoading(true);
    resetErrors();
    onResult(null);

    // client-side validation
    if (mode === "text") {
      if (!text.trim()) {
        setTextError("Please paste some text to summarize.");
        setLoading(false);
        return;
      }
    } else if (mode === "file") {
      if (!file) {
        setFileError("Please choose a file (PDF, DOCX, or TXT).");
        setLoading(false);
        return;
      }
      const tooBig = file.size > 20 * 1024 * 1024; // 20MB
      const badExt = !/\.(pdf|docx|txt)$/i.test(file.name || "");
      if (badExt) {
        setFileError("Unsupported file type. Use PDF, DOCX, or TXT.");
        setLoading(false);
        return;
      }
      if (tooBig) {
        setFileError("Max file size is 20 MB.");
        setLoading(false);
        return;
      }
    }

    try {
      let data;
      if (mode === "text") {
        data = await summarizeText({ text, style, language, maxRatio });
      } else {
        data = await summarizeFile({ file, style, language, maxRatio });
      }

      if (data?.error) {
        setError(data.error);
      } else {
        const payload = { ...data };
        if (mode === "file" && file) {
          payload.originalName = file.name; // for download filename
        } else if (mode === "text") {
          const title =
            firstNonEmptyLine(text) || text.split(/\s+/).slice(0, 8).join(" ");
          payload.textUsed = title; // for download filename
        }
        onResult(payload);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#141416]/80 backdrop-blur-xl ring-1 ring-white/5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.65)]">
      {/* Tabs */}
      <div className="flex items-center p-2">
        <div className="relative inline-flex rounded-lg bg-zinc-800/60 p-1">
          {["text", "file"].map((t) => {
            const active = mode === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setMode(t);
                  // clear field-specific errors on switch
                  setTextError(null);
                  setFileError(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  active
                    ? "bg-zinc-900 text-white shadow"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                {t.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global error (backend/unknown) */}
      {error && (
        <div className="px-4 sm:px-6">
          <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        </div>
      )}

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        {mode === "text" && (
          <div>
            <textarea
              className={`w-full h-32 sm:h-44 rounded-xl border ${
                textError ? "border-red-500/60" : "border-zinc-800/80"
              } bg-[#0f0f11] text-zinc-100 placeholder-zinc-500 p-4 outline-none focus:ring-2 ${
                textError ? "focus:ring-red-500/30" : "focus:ring-indigo-500/30"
              }`}
              placeholder="Paste your text here..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (textError && e.target.value.trim()) setTextError(null);
              }}
            />
            {textError && (
              <p className="mt-1 text-sm text-red-400">{textError}</p>
            )}
          </div>
        )}

        {mode === "file" && (
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Upload a document (.pdf, .docx, .txt)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) setFileError(null);
              }}
              className={`block w-full cursor-pointer rounded-lg border ${
                fileError
                  ? "border-red-500/60"
                  : "border-dashed border-zinc-700"
              } bg-zinc-900 p-3 text-sm text-zinc-200 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-600 transition`}
            />
            {fileError && (
              <p className="mt-1 text-sm text-red-400">{fileError}</p>
            )}
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
              Summary type
            </label>
            <CustomSelect
              value={style}
              onChange={setStyle}
              options={[
                { value: "concise", label: "Concise" },
                { value: "detailed", label: "Detailed" },
                { value: "bullets", label: "Bullets" },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
              Language
            </label>
            <CustomSelect
              value={language}
              onChange={setLanguage}
              options={[
                { value: "English", label: "English" },
                { value: "Hindi", label: "Hindi" },
                { value: "French", label: "French" },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
              Compression: {Math.round(maxRatio * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={maxRatio}
              onChange={(e) => setMaxRatio(Number(e.target.value))}
              className="slider-dark w-full"
            />
          </div>
        </div>

        {/* Button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              (mode === "text" && !text.trim()) ||
              (mode === "file" && !file)
            }
            className="w-full sm:w-auto group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Summarizing…" : "Summarize"}
          </button>
        </div>
      </div>
    </div>
  );
}
