import { useState } from "react";
import SummarizeForm from "./Components/SummarizeForm";
import SummaryCard from "./Components/SummaryCard";

export default function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-white">
          AI Document{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Summarizer
          </span>
        </h1>

        <div className="mt-6">
          <SummarizeForm onResult={setResult} />
        </div>

        <div className="mt-4">
          {result?.summary ? (
            <SummaryCard
              summary={result.summary}
              originalName={result.originalName}
              textUsed={result.textUsed}
            />
          ) : (
            <p className="text-center text-xs text-zinc-400">
              Tip: Paste text or upload a file, choose style &amp; compression,
              then hit{" "}
              <span className="font-medium text-zinc-200">Summarize</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
