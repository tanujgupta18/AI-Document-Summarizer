# AI Document Summarizer

Summarize **text** or **files (PDF/DOCX/TXT)** with a clean dark UI. Copy or download the summary as **.txt** with a smart filename.

## Features

- Text or File upload (PDF/DOCX/TXT, ≤ 20MB)
- Styles: Concise / Detailed / Bullets
- Languages: English / Hindi / French
- Download TXT, Copy to clipboard

## Quick Start

### Backend

```bash
cd Backend
npm install
```

Create `.env`:

```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
# optional:
# MODEL=gemini-2.5-flash
# MAX_CHUNK_TOKENS=2500
```

Run:

```bash
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Open the shown URL (e.g. `http://localhost:5173`).

## Notes

- Supported files: `.pdf`, `.docx`, `.txt` (≤ 20MB)
- Output download: `summary-<source-title>-YYYY-MM-DD-HH-MM.txt`
- If PDF parsing issues: use `pdfjs-dist/legacy/build/pdf.js` and pass a **Uint8Array** to `getDocument`.
