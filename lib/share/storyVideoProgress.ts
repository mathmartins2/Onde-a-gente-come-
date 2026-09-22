export const preparationShare = 0.15
const encodingShare = 0.83

export const parseFfmpegProgressSeconds = (progressOutput: string) => {
  const reportedTimes = [...progressOutput.matchAll(/out_time_us=(\d+)/g)]
  const latest = reportedTimes.at(-1)
  return latest ? Number(latest[1]) / 1_000_000 : null
}

export const encodingProgress = (encodedSeconds: number, totalSeconds: number) =>
  preparationShare + encodingShare * Math.min(1, Math.max(0, encodedSeconds / totalSeconds))

export const toProgressPercentage = (fraction: number) => Math.round(Math.min(1, Math.max(0, fraction)) * 100)
