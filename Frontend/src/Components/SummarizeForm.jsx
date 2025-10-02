import { useState } from "react";
import { summarizeText, summarizeFile } from "../api/summarize";

export default function SummarizeForm({ onResult }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const [style, setStyle] = useState("concise");
  const [language, setLanguage] = useState("English");
  const [maxRatio, setMaxRatio] = useState(0.25);

  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    onResult(null);
    try {
      let data;
      if (mode === "text") {
        data = await summarizeText({ text, style, language, maxRatio });
      } else if (mode === "file" && file) {
        data = await summarizeFile({ file, style, language, maxRatio });
      }
      if (data?.error) {
        alert(data.error);
      } else {
        onResult(data);
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded p-4 space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 text-sm">
        {["text", "file"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMode(t)}
            className={`px-3 py-1 rounded ${
              mode === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Inputs */}
      {mode === "text" && (
        <textarea
          className="w-full h-40 border rounded p-2"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
      {mode === "file" && (
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      )}

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs mb-1">Summary type</label>
          <select
            className="w-full border rounded p-2"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="bullets">Bullets</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Language</label>
          <select
            className="w-full border rounded p-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="French">French</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">
            Compression: {Math.round(maxRatio * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.05"
            value={maxRatio}
            onChange={(e) => setMaxRatio(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>
    </div>
  );
}
