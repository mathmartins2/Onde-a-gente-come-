import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

const privateAddressRanges = new BlockList()

const privateIpv4Subnets: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 3],
]

const privateIpv6Subnets: Array<[string, number]> = [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
]

privateIpv4Subnets.forEach(([network, prefix]) => privateAddressRanges.addSubnet(network, prefix, 'ipv4'))
privateIpv6Subnets.forEach(([network, prefix]) => privateAddressRanges.addSubnet(network, prefix, 'ipv6'))

const ipv4MappedPrefix = '::ffff:'

export const isPublicAddress = (address: string): boolean => {
  const normalizedAddress = address.toLowerCase()
  if (normalizedAddress.startsWith(ipv4MappedPrefix) && isIP(normalizedAddress.slice(ipv4MappedPrefix.length)) === 4) {
    return isPublicAddress(normalizedAddress.slice(ipv4MappedPrefix.length))
  }

  const family = isIP(normalizedAddress)
  if (family === 0) return false
  return !privateAddressRanges.check(normalizedAddress, family === 4 ? 'ipv4' : 'ipv6')
}

const allowedProtocols = new Set(['http:', 'https:'])

export class BlockedAddressError extends Error {}

const stripIpv6Brackets = (hostname: string) => hostname.replace(/^\[|\]$/g, '')

export const assertPublicUrl = async (
  url: URL,
  resolveHost: (hostname: string) => Promise<string[]> = async (hostname) =>
    (await lookup(hostname, { all: true })).map((entry) => entry.address),
) => {
  if (!allowedProtocols.has(url.protocol)) throw new BlockedAddressError(`Protocol not allowed: ${url.protocol}`)
  if (url.username || url.password) throw new BlockedAddressError('Credentials in URL are not allowed')

  const hostname = stripIpv6Brackets(url.hostname)
  const addresses = isIP(hostname) ? [hostname] : await resolveHost(hostname)
  if (addresses.length === 0) throw new BlockedAddressError(`Host did not resolve: ${hostname}`)
  if (!addresses.every(isPublicAddress)) throw new BlockedAddressError(`Host is not public: ${hostname}`)
}
