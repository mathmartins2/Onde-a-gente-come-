import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { restaurantSchema } from '@/lib/validation/schemas'
import { regionConfiguration } from '@/lib/scoring/configuration'

export const GET = async () =>
  withMember(async () => {
    const rows = await database
      .select()
      .from(schema.restaurants)
      .orderBy(asc(schema.restaurants.name))

    return NextResponse.json({ restaurants: rows })
  })

const emptyToNull = (value: string | undefined) => {
  if (!value || value.trim().length === 0) return null
  return value.trim()
}

export const POST = async (request: Request) =>
  withMember(async (member) => {
    const body = await request.json().catch(() => null)
    const parsed = restaurantSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const input = parsed.data
    const city = emptyToNull(input.city)
    const isOutsideRegion = Boolean(
      city && !regionConfiguration.allowedCities.some((allowed) => allowed.toLowerCase() === city.toLowerCase()),
    )

    const [restaurant] = await database
      .insert(schema.restaurants)
      .values({
        name: input.name,
        address: emptyToNull(input.address),
        neighborhood: emptyToNull(input.neighborhood),
        city,
        postalCode: emptyToNull(input.postalCode),
        cuisines: input.cuisines,
        phone: emptyToNull(input.phone),
        website: emptyToNull(input.website),
        latitude: input.latitude === null || input.latitude === undefined ? null : String(input.latitude),
        longitude: input.longitude === null || input.longitude === undefined ? null : String(input.longitude),
        placeSource: emptyToNull(input.placeSource),
        placeReference: emptyToNull(input.placeReference),
        createdBy: member.id,
      })
      .returning()

    return NextResponse.json({ restaurant, isOutsideRegion })
  })
