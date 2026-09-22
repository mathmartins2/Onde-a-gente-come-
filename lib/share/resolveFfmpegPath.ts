import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const pnpmStoreDirectory = join(process.cwd(), 'node_modules', '.pnpm')
const packageDirectoryPrefix = 'ffmpeg-static@'

export const resolveFfmpegPath = () => {
  if (!existsSync(pnpmStoreDirectory)) return null
  const packageDirectory = readdirSync(pnpmStoreDirectory).find((entry) => entry.startsWith(packageDirectoryPrefix))
  if (!packageDirectory) return null
  const binaryPath = join(pnpmStoreDirectory, packageDirectory, 'node_modules', 'ffmpeg-static', 'ffmpeg')
  return existsSync(binaryPath) ? binaryPath : null
}
