export default function SummaryCard({ summary, originalName, textUsed }) {
  if (!summary) return null;

  const stripExt = (name) => name?.replace(/\.[^/.]+$/, "") || "";
  const slugify = (s, max = 60) =>
    (s || "")
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\s/g, "-")
      .replace(/-+/g, "-")
      .slice(0, max) || "summary";
  const firstLine = (s) => (s || "").split(/\r?\n/).find((l) => l.trim()) || "";
  const baseName = () =>
    originalName
      ? slugify(stripExt(originalName)) // file mode
      : slugify(
          firstLine(textUsed) || summary.split(/\s+/).slice(0, 8).join(" ")
        ); // text mode / fallback
  const fileName = () => {
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    return `summary-${baseName()}-${ts}.txt`;
  };

  const copy = async () => await navigator.clipboard.writeText(summary);

  const download = () => {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 md:mt-6 mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur">
      <h2 className="mb-3 text-lg font-semibold text-white">Summary</h2>
      <p className="whitespace-pre-wrap leading-7 md:leading-8 text-zinc-200">
        {summary}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={copy}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-900 hover:bg-white"
        >
          Copy
        </button>
        <button
          onClick={download}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Download TXT
        </button>
      </div>
    </div>
  );
}
