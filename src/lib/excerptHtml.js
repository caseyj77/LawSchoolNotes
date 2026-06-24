function formatSource(source) {
  if (!source?.filename) return ''
  return source.page ? `${source.filename}, p. ${source.page}` : source.filename
}

// Only build a link back to the source document when the capture flow had
// enough context to address it (a saved document, not an ad-hoc upload) —
// courseId/documentId are populated by DocumentReaderView, not by the
// PdfViewer/DocxViewer capture event itself.
function buildCitationHref(source) {
  if (!source?.courseId || !source?.documentId) return null
  const query = source.page
    ? `docId=${source.documentId}&page=${source.page}`
    : `docId=${source.documentId}`
  return `/course/${source.courseId}/reader?${query}`
}

export function buildExcerptNode(text, source) {
  const citation = formatSource(source)
  const href = buildCitationHref(source)

  const content = [
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    },
  ]

  if (citation) {
    const marks = [{ type: 'italic' }]
    if (href) marks.push({ type: 'link', attrs: { href } })
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', marks, text: `— ${citation}` }],
    })
  }

  return content
}

export function appendExcerpt(editor, text, source) {
  if (!editor || !text) return
  editor.commands.insertContentAt(editor.state.doc.content.size, buildExcerptNode(text, source))
}
