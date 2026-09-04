import { NextResponse } from 'next/server'
import { desc, eq, isNull, sql } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember } from '@/lib/http/routeHelpers'

export const GET = async () =>
  withMember(async (member) => {
    const rows = await database
      .select({
        visitId: schema.visits.id,
        restaurantName: schema.restaurants.name,
        visitedAt: schema.visits.visitedAt,
        recommendedByName: schema.members.displayName,
        ratingCount: sql<number>`(
          select count(*)::int from ${schema.ratings} where ${schema.ratings.visitId} = ${schema.visits.id}
        )`,
        hasMyRating: sql<boolean>`exists (
          select 1 from ${schema.ratings}
          where ${schema.ratings.visitId} = ${schema.visits.id}
            and ${schema.ratings.memberId} = ${member.id}
        )`,
      })
      .from(schema.visits)
      .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.visits.restaurantId))
      .leftJoin(schema.members, eq(schema.members.id, schema.visits.recommendedByMemberId))
      .where(isNull(schema.visits.revealedAt))
      .orderBy(desc(schema.visits.visitedAt))

    return NextResponse.json({ visits: rows })
  })
