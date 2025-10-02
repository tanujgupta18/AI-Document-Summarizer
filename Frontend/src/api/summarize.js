// Text input API call
export async function summarizeText({ text, style, language, maxRatio }) {
  const res = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceType: "text",
      text,
      style,
      language,
      maxRatio,
    }),
  });
  return res.json();
}

// File upload API call
export async function summarizeFile({ file, style, language, maxRatio }) {
  const form = new FormData();
  form.append("file", file);
  form.append("sourceType", "file");
  form.append("style", style);
  form.append("language", language);
  form.append("maxRatio", maxRatio);

  const res = await fetch("/api/summarize", {
    method: "POST",
    body: form,
  });
  return res.json();
}
