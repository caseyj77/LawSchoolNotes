import { isJsonDocEmpty, renderRichTextToHtml } from '@/lib/renderRichText'

// We export a Word-compatible HTML document (saved with a .doc extension)
// rather than true OOXML. Microsoft Word and Google Docs both open it natively,
// and it lets us reuse renderRichTextToHtml so rich formatting (headings, bold,
// lists, blockquotes) carries over without a heavyweight docx dependency.

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Plain-text (textarea) fields keep their line breaks as paragraphs.
function plainTextToHtml(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

const DOCUMENT_STYLES = `
  body { font-family: 'Calibri', 'Segoe UI', sans-serif; font-size: 12pt; color: #1f2041; line-height: 1.5; }
  h1 { font-size: 20pt; margin: 0 0 4pt; }
  .citation { font-size: 12pt; color: #5b577e; margin: 0 0 18pt; }
  h2 { font-size: 13pt; margin: 16pt 0 4pt; }
  p { margin: 0 0 8pt; }
  blockquote { margin: 6pt 0; padding-left: 12pt; border-left: 3px solid #d0ceba; color: #4b3f72; }
  ul, ol { margin: 0 0 8pt 18pt; }
`

// Builds the full Word-openable HTML string. Kept separate from the download so
// it can be unit-tested without touching the DOM/Blob APIs.
export function buildBriefWordHtml(brief, templateSections) {
  const caseName = brief.caseName?.trim() || 'Untitled case brief'

  const sectionsHtml = templateSections
    .map((section) => {
      const content = brief.sections?.[section.key]
      const body = isJsonDocEmpty(content) ? '' : renderRichTextToHtml(content)
      return `<h2>${escapeHtml(section.label)}</h2>${body}`
    })
    .join('')

  const notesHtml = plainTextToHtml(brief.studentNotes)
  const studentNotesBlock = notesHtml ? `<h2>Student Notes</h2>${notesHtml}` : ''
  const citationBlock = brief.citation?.trim()
    ? `<p class="citation">${escapeHtml(brief.citation.trim())}</p>`
    : ''

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(caseName)}</title>
  <style>${DOCUMENT_STYLES}</style>
</head>
<body>
  <h1>${escapeHtml(caseName)}</h1>
  ${citationBlock}
  ${sectionsHtml}
  ${studentNotesBlock}
</body>
</html>`
}

function safeFileName(caseName) {
  const base = (caseName?.trim() || 'Case brief').replace(/[\\/:*?"<>|]+/g, '').trim()
  return `${base || 'Case brief'}.doc`
}

// Triggers a browser download of the brief as a Word document.
export function downloadBriefAsWord(brief, templateSections) {
  const html = buildBriefWordHtml(brief, templateSections)
  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = safeFileName(brief.caseName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
