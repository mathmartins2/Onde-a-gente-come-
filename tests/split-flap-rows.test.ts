import { describe, expect, it } from 'vitest'
import { maximumBoardColumns, toBoardRows } from '@/lib/utilities/splitFlapRows'

const readRows = (rows: string[][]) => rows.map((row) => row.join('').trim())

describe('toBoardRows', () => {
  it('keeps a name that fits on a single row', () => {
    expect(readRows(toBoardRows('Zen'))).toEqual(['ZEN'])
  })

  it('pads short names to the minimum board width', () => {
    expect(toBoardRows('Zen')[0]).toHaveLength(6)
  })

  it('wraps long names by word instead of cutting letters off', () => {
    expect(readRows(toBoardRows('Cantina da Esquina Nordestina'))).toEqual(['CANTINA DA', 'ESQUINA', 'NORDESTINA'])
  })

  it('shows every letter of a name longer than one row', () => {
    const name = 'Yokocho Izakaya e Sushi Bar'
    expect(readRows(toBoardRows(name)).join(' ')).toBe(name.toUpperCase())
  })

  it('never leaves blank cells trailing after a shorter row', () => {
    const lastRow = toBoardRows('Yokocho Izakaya e Sushi Bar').at(-1) ?? []
    expect(lastRow.join('')).toBe('E SUSHI BAR')
  })

  it('centers a short name inside the minimum board width', () => {
    expect(toBoardRows('Zen')[0].join('')).toBe(' ZEN  ')
  })

  it('splits a single word longer than a row across rows', () => {
    const rows = toBoardRows('A'.repeat(maximumBoardColumns + 4))
    expect(readRows(rows)).toEqual(['A'.repeat(maximumBoardColumns), 'AAAA'])
  })
})
