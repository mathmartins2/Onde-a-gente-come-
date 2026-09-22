import { describe, expect, it } from 'vitest'
import { extractCoverImageUrl } from '@/lib/images/extractCoverImageUrl'

const pageUrl = new URL('https://restaurant.example/menu/')

describe('cover image extraction', () => {
  it('reads the open graph image', () => {
    const html = '<head><meta property="og:image" content="https://cdn.example/cover.jpg"></head>'

    expect(extractCoverImageUrl(html, pageUrl)?.href).toBe('https://cdn.example/cover.jpg')
  })

  it('accepts attributes in any order and single quotes', () => {
    const html = "<meta content='https://cdn.example/front.png' property='og:image' />"

    expect(extractCoverImageUrl(html, pageUrl)?.href).toBe('https://cdn.example/front.png')
  })

  it('prefers the open graph image over the twitter image', () => {
    const html = [
      '<meta name="twitter:image" content="https://cdn.example/twitter.jpg">',
      '<meta property="og:image" content="https://cdn.example/open-graph.jpg">',
    ].join('')

    expect(extractCoverImageUrl(html, pageUrl)?.href).toBe('https://cdn.example/open-graph.jpg')
  })

  it('falls back to the twitter image', () => {
    const html = '<meta name="twitter:image" content="https://cdn.example/twitter.jpg">'

    expect(extractCoverImageUrl(html, pageUrl)?.href).toBe('https://cdn.example/twitter.jpg')
  })

  it('resolves relative paths against the page and decodes entities', () => {
    const html = '<meta property="og:image" content="/images/cover.jpg?size=large&amp;format=jpg">'

    expect(extractCoverImageUrl(html, pageUrl)?.href).toBe(
      'https://restaurant.example/images/cover.jpg?size=large&format=jpg',
    )
  })

  it('ignores non http image addresses', () => {
    const html = '<meta property="og:image" content="javascript:alert(1)">'

    expect(extractCoverImageUrl(html, pageUrl)).toBeNull()
  })

  it('returns null when the page declares no cover image', () => {
    expect(extractCoverImageUrl('<title>Restaurant</title>', pageUrl)).toBeNull()
  })
})
