type RoundSummary = { visitId: string | null; isRevealed: boolean }

export const pickCurrentRound = <Round extends RoundSummary>(roundsNewestFirst: Round[]) => ({
  currentRound: roundsNewestFirst.find((round) => round.visitId !== null && !round.isRevealed) ?? null,
  lastRevealedRound: roundsNewestFirst.find((round) => round.isRevealed) ?? null,
})
