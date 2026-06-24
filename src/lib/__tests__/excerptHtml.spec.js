import { describe, expect, it, vi } from 'vitest'

import { appendExcerpt, buildExcerptNode } from '../excerptHtml'

describe('buildExcerptNode', () => {
  it('includes a page number for PDF sources', () => {
    const node = buildExcerptNode('foreseeable damages', { filename: 'hadley.pdf', page: 3 })

    expect(node[0].type).toBe('blockquote')
    expect(node[0].content[0].content[0].text).toBe('foreseeable damages')
    expect(node[1].content[0].text).toBe('— hadley.pdf, p. 3')
  })

  it('omits the page number for DOCX sources', () => {
    const node = buildExcerptNode('foreseeable damages', { filename: 'hadley.docx' })

    expect(node[1].content[0].text).toBe('— hadley.docx')
  })

  it('preserves special characters as literal text content (no HTML injection risk)', () => {
    const node = buildExcerptNode('<script>alert(1)</script> & "quotes"', { filename: 'x.pdf', page: 1 })

    expect(node[0].content[0].content[0].text).toBe('<script>alert(1)</script> & "quotes"')
  })

  it('links the citation back to the source document and page when courseId/documentId are present', () => {
    const node = buildExcerptNode('foreseeable damages', {
      filename: 'hadley.pdf',
      page: 3,
      courseId: 'contracts',
      documentId: 'doc-1',
    })

    const citationMarks = node[1].content[0].marks
    expect(citationMarks).toEqual([
      { type: 'italic' },
      { type: 'link', attrs: { href: '/course/contracts/reader?docId=doc-1&page=3' } },
    ])
  })

  it('links to the document without a page for sources with no page (e.g. docx)', () => {
    const node = buildExcerptNode('foreseeable damages', {
      filename: 'hadley.docx',
      courseId: 'contracts',
      documentId: 'doc-1',
    })

    const citationMarks = node[1].content[0].marks
    expect(citationMarks).toEqual([
      { type: 'italic' },
      { type: 'link', attrs: { href: '/course/contracts/reader?docId=doc-1' } },
    ])
  })

  it('omits the link mark when courseId/documentId are not provided', () => {
    const node = buildExcerptNode('foreseeable damages', { filename: 'hadley.pdf', page: 3 })

    expect(node[1].content[0].marks).toEqual([{ type: 'italic' }])
  })
})

describe('appendExcerpt', () => {
  it('inserts at the end of the document without overwriting existing content', () => {
    const insertContentAt = vi.fn()
    const editor = {
      state: { doc: { content: { size: 42 } } },
      commands: { insertContentAt },
    }

    appendExcerpt(editor, 'captured text', { filename: 'a.pdf', page: 2 })

    expect(insertContentAt).toHaveBeenCalledWith(42, buildExcerptNode('captured text', { filename: 'a.pdf', page: 2 }))
  })

  it('does nothing when there is no editor or no text', () => {
    const insertContentAt = vi.fn()
    const editor = { state: { doc: { content: { size: 0 } } }, commands: { insertContentAt } }

    appendExcerpt(null, 'text', {})
    appendExcerpt(editor, '', {})

    expect(insertContentAt).not.toHaveBeenCalled()
  })
})
