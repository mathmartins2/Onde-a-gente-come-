import { describe, expect, it } from 'vitest'
import { assertPublicUrl, BlockedAddressError, isPublicAddress } from '@/lib/images/publicAddressGuard'

const resolvingTo = (...addresses: string[]) => async () => addresses

describe('public address guard', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.20.0.5', '192.168.0.10', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1'])(
    'treats %s as a private address',
    (address) => {
      expect(isPublicAddress(address)).toBe(false)
    },
  )

  it.each(['8.8.8.8', '151.101.1.69', '2606:4700::6810:85e5'])('treats %s as a public address', (address) => {
    expect(isPublicAddress(address)).toBe(true)
  })

  it('refuses a hostname that resolves to a private address', async () => {
    await expect(assertPublicUrl(new URL('https://intranet.example'), resolvingTo('10.0.0.8'))).rejects.toBeInstanceOf(
      BlockedAddressError,
    )
  })

  it('refuses a hostname when any of its addresses is private', async () => {
    await expect(
      assertPublicUrl(new URL('https://mixed.example'), resolvingTo('8.8.8.8', '127.0.0.1')),
    ).rejects.toBeInstanceOf(BlockedAddressError)
  })

  it('refuses literal private addresses without resolving them', async () => {
    await expect(assertPublicUrl(new URL('http://169.254.169.254/latest/meta-data'))).rejects.toBeInstanceOf(
      BlockedAddressError,
    )
    await expect(assertPublicUrl(new URL('http://[::1]:3000/'))).rejects.toBeInstanceOf(BlockedAddressError)
  })

  it('refuses protocols other than http and https', async () => {
    await expect(assertPublicUrl(new URL('file:///etc/passwd'))).rejects.toBeInstanceOf(BlockedAddressError)
  })

  it('accepts a hostname that only resolves to public addresses', async () => {
    await expect(assertPublicUrl(new URL('https://restaurant.example'), resolvingTo('151.101.1.69'))).resolves.toBeUndefined()
  })
})
