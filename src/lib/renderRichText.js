import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import DOMPurify from 'dompurify'

const EMPTY_DOC = { type: 'doc', content: [] }

export function renderRichTextToHtml(doc) {
  if (!doc) return ''
  return DOMPurify.sanitize(generateHTML(doc, [StarterKit]))
}

// A Tiptap doc with no nodes, or only empty paragraphs, has no real content
// even though the object itself is always truthy.
export function isJsonDocEmpty(doc) {
  if (!doc?.content?.length) return true
  return !nodeHasText(doc)
}

function nodeHasText(node) {
  if (node.text) return true
  return (node.content ?? []).some(nodeHasText)
}

export { EMPTY_DOC }
