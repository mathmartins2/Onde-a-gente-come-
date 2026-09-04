import { describe, expect, it } from 'vitest'
import { checkQuorum } from '@/lib/draw/checkQuorum'

describe('quorum', () => {
  it('allows the draw when exactly half the group is present', () => {
    expect(checkQuorum(2, 4).hasQuorum).toBe(true)
  })

  it('blocks the draw when fewer than half are present', () => {
    expect(checkQuorum(1, 4).hasQuorum).toBe(false)
  })

  it('rounds the requirement up on an odd group', () => {
    const status = checkQuorum(2, 5)
    expect(status.requiredCount).toBe(3)
    expect(status.hasQuorum).toBe(false)
    expect(checkQuorum(3, 5).hasQuorum).toBe(true)
  })

  it('allows the draw when everybody is present', () => {
    expect(checkQuorum(4, 4).hasQuorum).toBe(true)
  })

  it('blocks the draw when nobody joined', () => {
    expect(checkQuorum(0, 4).hasQuorum).toBe(false)
  })

  it('never claims quorum for an empty group', () => {
    expect(checkQuorum(0, 0).hasQuorum).toBe(false)
  })

  it('reports how many people are still needed', () => {
    const status = checkQuorum(1, 6)
    expect(status.requiredCount).toBe(3)
    expect(status.presentCount).toBe(1)
  })
})
