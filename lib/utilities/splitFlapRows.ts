export const minimumBoardColumns = 6
export const maximumBoardColumns = 16

const splitOversizedWord = (word: string): string[] =>
  word.length <= maximumBoardColumns
    ? [word]
    : [word.slice(0, maximumBoardColumns), ...splitOversizedWord(word.slice(maximumBoardColumns))]

const appendWordToLines = (lines: string[], word: string) => {
  const lastLine = lines.at(-1)
  if (lastLine === undefined) return [word]
  const candidate = `${lastLine} ${word}`
  if (candidate.length > maximumBoardColumns) return [...lines, word]
  return [...lines.slice(0, -1), candidate]
}

const centerInWidth = (line: string, width: number) => {
  const leadingSpaceCount = Math.floor(Math.max(width - line.length, 0) / 2)
  return line.padStart(line.length + leadingSpaceCount, ' ').padEnd(width, ' ')
}

export const toBoardRows = (value: string, minimumWidth = minimumBoardColumns) => {
  const words = value.toUpperCase().trim().split(/\s+/).filter(Boolean).flatMap(splitOversizedWord)
  const lines = words.reduce<string[]>(appendWordToLines, [])
  const nonEmptyLines = lines.length > 0 ? lines : ['']
  return nonEmptyLines.map((line) => centerInWidth(line, Math.max(minimumWidth, line.length)).split(''))
}
