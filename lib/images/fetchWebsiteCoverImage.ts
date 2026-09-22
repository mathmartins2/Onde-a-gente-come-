import { assertPublicUrl } from './publicAddressGuard'
import { extractCoverImageUrl } from './extractCoverImageUrl'

const requestTimeoutInMilliseconds = 5000
const maximumRedirectCount = 3
const maximumHtmlByteSize = 1024 * 1024
const maximumImageByteSize = 5 * 1024 * 1024
const redirectStatusCodes = new Set([301, 302, 303, 307, 308])

const requestHeaders = {
  'user-agent': 'Mozilla/5.0 (compatible; OndeAGenteCome/1.0; +cover-image)',
  accept: 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.5',
}

class ResponseTooLargeError extends Error {}

const fetchFollowingPublicRedirects = async (url: URL, remainingRedirects: number): Promise<Response> => {
  await assertPublicUrl(url)

  const response = await fetch(url, {
    headers: requestHeaders,
    redirect: 'manual',
    signal: AbortSignal.timeout(requestTimeoutInMilliseconds),
  })

  if (!redirectStatusCodes.has(response.status)) return response

  const location = response.headers.get('location')
  if (!location || remainingRedirects === 0) throw new Error('Too many redirects')

  return fetchFollowingPublicRedirects(new URL(location, url), remainingRedirects - 1)
}

const collectChunks = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  maximumByteSize: number,
  collectedChunks: Uint8Array[],
  collectedByteSize: number,
): Promise<Buffer> => {
  const { done, value } = await reader.read()
  if (done) return Buffer.concat(collectedChunks)

  const nextByteSize = collectedByteSize + value.byteLength
  if (nextByteSize > maximumByteSize) {
    await reader.cancel()
    throw new ResponseTooLargeError()
  }

  return collectChunks(reader, maximumByteSize, [...collectedChunks, value], nextByteSize)
}

const readBodyWithLimit = async (response: Response, maximumByteSize: number) => {
  const declaredLength = Number(response.headers.get('content-length') ?? 0)
  if (declaredLength > maximumByteSize) throw new ResponseTooLargeError()
  if (!response.body) return Buffer.alloc(0)
  return collectChunks(response.body.getReader(), maximumByteSize, [], 0)
}

export const fetchWebsiteCoverImage = async (websiteUrl: string) => {
  try {
    const pageUrl = new URL(websiteUrl.includes('://') ? websiteUrl : `https://${websiteUrl}`)
    const pageResponse = await fetchFollowingPublicRedirects(pageUrl, maximumRedirectCount)
    if (!pageResponse.ok) return null

    const html = (await readBodyWithLimit(pageResponse, maximumHtmlByteSize)).toString('utf8')
    const coverImageUrl = extractCoverImageUrl(html, new URL(pageResponse.url || pageUrl))
    if (!coverImageUrl) return null

    const imageResponse = await fetchFollowingPublicRedirects(coverImageUrl, maximumRedirectCount)
    if (!imageResponse.ok) return null

    return await readBodyWithLimit(imageResponse, maximumImageByteSize)
  } catch {
    return null
  }
}
