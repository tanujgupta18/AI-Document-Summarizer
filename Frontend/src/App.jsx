import { useState } from "react";
import SummarizeForm from "./Components/SummarizeForm";
import SummaryCard from "./Components/SummaryCard";

export default function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-6">AI Document Summarizer</h1>
      <SummarizeForm onResult={setResult} />
      {result && (
        <SummaryCard summary={result.summary} metrics={result.metrics} />
      )}
    </div>
  );
}
