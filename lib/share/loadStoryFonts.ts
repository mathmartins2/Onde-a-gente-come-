import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { storyFontFamilies } from './storyTheme'

const fontDirectory = join(process.cwd(), 'lib/share/fonts')

const readFont = (fileName: string) => readFile(join(fontDirectory, fileName))

const loadFonts = async () => {
  const [displayExtraBold, bodyRegular, bodySemibold] = await Promise.all([
    readFont('bricolage-grotesque-extrabold.ttf'),
    readFont('archivo-regular.ttf'),
    readFont('archivo-semibold.ttf'),
  ])

  return [
    { name: storyFontFamilies.display, data: displayExtraBold, weight: 800 as const, style: 'normal' as const },
    { name: storyFontFamilies.body, data: bodyRegular, weight: 400 as const, style: 'normal' as const },
    { name: storyFontFamilies.body, data: bodySemibold, weight: 600 as const, style: 'normal' as const },
  ]
}

const cachedFonts = { promise: null as ReturnType<typeof loadFonts> | null }

export const loadStoryFonts = () => {
  cachedFonts.promise ??= loadFonts()
  return cachedFonts.promise
}
