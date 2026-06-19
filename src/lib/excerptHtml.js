function formatSource(source) {
  if (!source?.filename) return ''
  return source.page ? `${source.filename}, p. ${source.page}` : source.filename
}

export function buildExcerptNode(text, source) {
  const citation = formatSource(source)

  const content = [
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    },
  ]

  if (citation) {
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', marks: [{ type: 'italic' }], text: `— ${citation}` }],
    })
  }

  return content
}

export function appendExcerpt(editor, text, source) {
  if (!editor || !text) return
  editor.commands.insertContentAt(editor.state.doc.content.size, buildExcerptNode(text, source))
}
