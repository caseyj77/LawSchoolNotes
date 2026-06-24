import { describe, expect, it } from 'vitest'

import { buildBriefWordHtml } from '@/lib/exportBriefToWord'

const EMPTY_DOC = { type: 'doc', content: [] }

function doc(text) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

const templateSections = [
  { key: 'issue', label: 'Issue', placeholder: 'Frame the question.' },
  { key: 'facts', label: 'Facts', placeholder: 'Summarize the facts.' },
]

describe('buildBriefWordHtml', () => {
  it('puts the case name in an h1 and the citation below it', () => {
    const brief = {
      caseName: 'Palsgraf v. Long Island Railroad Co.',
      citation: '248 N.Y. 339 (1928)',
      sections: { issue: EMPTY_DOC, facts: EMPTY_DOC },
    }
    const html = buildBriefWordHtml(brief, templateSections)

    expect(html).toContain('<h1>Palsgraf v. Long Island Railroad Co.</h1>')
    expect(html).toContain('248 N.Y. 339 (1928)')
  })

  it('renders each section label as an h2 in template order', () => {
    const brief = { caseName: 'X', citation: '', sections: { issue: EMPTY_DOC, facts: EMPTY_DOC } }
    const html = buildBriefWordHtml(brief, templateSections)

    expect(html).toContain('<h2>Issue</h2>')
    expect(html).toContain('<h2>Facts</h2>')
    expect(html.indexOf('<h2>Issue</h2>')).toBeLessThan(html.indexOf('<h2>Facts</h2>'))
  })

  it('includes section content for filled sections', () => {
    const brief = {
      caseName: 'X',
      citation: '',
      sections: { issue: doc('Did the duty extend to Mrs. Palsgraf?'), facts: EMPTY_DOC },
    }
    const html = buildBriefWordHtml(brief, templateSections)

    expect(html).toContain('Did the duty extend to Mrs. Palsgraf?')
  })

  it('escapes HTML in the case name and citation', () => {
    const brief = { caseName: 'A & B <Co>', citation: '1 <U.S.> 2', sections: {} }
    const html = buildBriefWordHtml(brief, templateSections)

    expect(html).toContain('A &amp; B &lt;Co&gt;')
    expect(html).not.toContain('<Co>')
  })

  it('falls back to a placeholder title when the case name is blank', () => {
    const brief = { caseName: '', citation: '', sections: {} }
    const html = buildBriefWordHtml(brief, templateSections)

    expect(html).toContain('<h1>Untitled case brief</h1>')
  })

  it('adds a Student Notes section only when notes are present', () => {
    const withNotes = buildBriefWordHtml(
      { caseName: 'X', citation: '', studentNotes: 'Review for exam.', sections: {} },
      templateSections,
    )
    const withoutNotes = buildBriefWordHtml(
      { caseName: 'X', citation: '', studentNotes: '', sections: {} },
      templateSections,
    )

    expect(withNotes).toContain('<h2>Student Notes</h2>')
    expect(withNotes).toContain('Review for exam.')
    expect(withoutNotes).not.toContain('Student Notes')
  })
})
