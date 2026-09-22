const metaTagPattern = /<meta\b[^>]*>/gi
const attributePattern = /([a-z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi

const coverImageProperties = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']

const htmlEntities: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
}

const decodeHtmlEntities = (value: string) =>
  value.replace(/&(amp|quot|#39|apos|lt|gt);/g, (entity) => htmlEntities[entity] ?? entity)

const readAttributes = (tag: string) =>
  Object.fromEntries(
    [...tag.matchAll(attributePattern)].map((match) => [
      match[1].toLowerCase(),
      decodeHtmlEntities(match[3] ?? match[4] ?? match[5] ?? ''),
    ]),
  )

const toAbsoluteHttpUrl = (candidate: string, pageUrl: URL) => {
  try {
    const absoluteUrl = new URL(candidate.trim(), pageUrl)
    if (absoluteUrl.protocol !== 'http:' && absoluteUrl.protocol !== 'https:') return null
    return absoluteUrl
  } catch {
    return null
  }
}

export const extractCoverImageUrl = (html: string, pageUrl: URL) => {
  const metaAttributes = [...html.matchAll(metaTagPattern)].map((match) => readAttributes(match[0]))

  const contentByProperty = new Map(
    metaAttributes
      .map((attributes) => [(attributes.property ?? attributes.name ?? '').toLowerCase(), attributes.content] as const)
      .filter(([property, content]) => property.length > 0 && Boolean(content))
      .reverse(),
  )

  return (
    coverImageProperties
      .map((property) => contentByProperty.get(property))
      .filter((content): content is string => Boolean(content))
      .map((content) => toAbsoluteHttpUrl(content, pageUrl))
      .find((url): url is URL => url !== null) ?? null
  )
}
