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
