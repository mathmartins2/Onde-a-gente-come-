import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import { loadBoardState, loadRestaurantVisitContext } from '@/lib/services/boardService'
import { findDrawCooldown, runDraw } from '@/lib/services/drawService'

export const GET = async () =>
  withMember(async () => {
    const board = await loadBoardState()
    return NextResponse.json(board)
  })

export const POST = async () =>
  withMember(async () => {
    const cooldown = await findDrawCooldown()
    if (cooldown) {
      return NextResponse.json(
        { error: `Sorteio feito agora há pouco. Espere ${cooldown.retryAfterSeconds}s` },
        { status: 429 },
      )
    }

    const result = await runDraw()
    if (!result) {
      return NextResponse.json(
        { error: 'Ninguém indicou restaurante nesta rodada' },
        { status: 422 },
      )
    }

    const context = await loadRestaurantVisitContext(result.draw.restaurantId, result.visit.id)

    return NextResponse.json({
      drawId: result.draw.id,
      visitId: result.visit.id,
      roundNumber: result.draw.roundNumber,
      winnerMemberId: result.draw.winnerMemberId,
      restaurantId: result.draw.restaurantId,
      snapshot: result.selection.snapshot,
      previousVisits: {
        visitCount: context.visitCount,
        lastVisitedAt: context.lastVisitedAt,
        lastScore: context.lastScore,
      },
    })
  })
