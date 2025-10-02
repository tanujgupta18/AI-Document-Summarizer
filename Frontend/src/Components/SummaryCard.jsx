export default function SummaryCard({ summary }) {
  if (!summary) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    alert("Copied!");
  };

  const download = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <h2 className="font-semibold mb-2">Summary</h2>
      <p className="whitespace-pre-wrap">{summary}</p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={copy}
          className="bg-gray-800 text-white px-3 py-1 rounded"
        >
          Copy
        </button>
        <button onClick={download} className="bg-gray-200 px-3 py-1 rounded">
          Download
        </button>
      </div>
    </div>
  );
}
