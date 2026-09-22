'use client'

import { useEffect, useState } from 'react'
import { SplitFlapBoard } from '@/components/ui/SplitFlapBoard'
import { toBoardRows } from '@/lib/utilities/splitFlapRows'

const cravingIntervalInMilliseconds = 2400

const pickAnotherIndex = (currentIndex: number, total: number) => {
  if (total < 2) return currentIndex
  const offset = 1 + Math.floor(Math.random() * (total - 1))
  return (currentIndex + offset) % total
}

type CravingBoardProps = {
  cravings: string[]
}

export const CravingBoard = ({ cravings }: CravingBoardProps) => {
  const [cravingIndex, setCravingIndex] = useState(0)
  const boardWidth = Math.max(...cravings.map((craving) => craving.length))

  useEffect(() => {
    const ticker = setInterval(
      () => setCravingIndex((currentIndex) => pickAnotherIndex(currentIndex, cravings.length)),
      cravingIntervalInMilliseconds,
    )
    return () => clearInterval(ticker)
  }, [cravings.length])

  return (
    <div aria-hidden className="w-full overflow-hidden">
      <SplitFlapBoard
        rows={toBoardRows(cravings[cravingIndex], boardWidth)}
        isSettled
        size="large"
        className="lg:items-start"
      />
    </div>
  )
}
