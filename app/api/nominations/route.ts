import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { nominationSchema } from '@/lib/validation/schemas'

export const GET = async () =>
  withMember(async (member) => {
    const rows = await database
      .select({
        id: schema.nominations.id,
        restaurantId: schema.restaurants.id,
        restaurantName: schema.restaurants.name,
        neighborhood: schema.restaurants.neighborhood,
        cuisines: schema.restaurants.cuisines,
        createdAt: schema.nominations.createdAt,
      })
      .from(schema.nominations)
      .innerJoin(schema.restaurants, eq(schema.restaurants.id, schema.nominations.restaurantId))
      .where(and(eq(schema.nominations.memberId, member.id), isNull(schema.nominations.consumedAt)))

    return NextResponse.json({ nominations: rows })
  })

export const POST = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = nominationSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const existing = await database
      .select({ id: schema.nominations.id })
      .from(schema.nominations)
      .where(
        and(
          eq(schema.nominations.memberId, member.id),
          eq(schema.nominations.restaurantId, parsed.data.restaurantId),
          isNull(schema.nominations.consumedAt),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      return validationErrorResponse('Você já indicou esse restaurante nesta rodada')
    }

    const [nomination] = await database
      .insert(schema.nominations)
      .values({ memberId: member.id, restaurantId: parsed.data.restaurantId })
      .returning()

    return NextResponse.json({ nomination })
  })
