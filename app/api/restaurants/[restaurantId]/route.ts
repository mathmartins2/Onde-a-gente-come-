import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { restaurantSchema } from '@/lib/validation/schemas'
import { regionConfiguration } from '@/lib/scoring/configuration'

const emptyToNull = (value: string | undefined) => {
  if (!value || value.trim().length === 0) return null
  return value.trim()
}

export const PUT = async (
  request: Request,
  context: { params: Promise<{ restaurantId: string }> },
) =>
  withMember(async () => {
    const { restaurantId } = await context.params
    const body = await request.json().catch(() => null)
    const parsed = restaurantSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Dados inválidos')
    }

    const existing = await database
      .select({ id: schema.restaurants.id })
      .from(schema.restaurants)
      .where(eq(schema.restaurants.id, restaurantId))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    const input = parsed.data
    const city = emptyToNull(input.city)
    const isOutsideRegion = Boolean(
      city &&
        !regionConfiguration.allowedCities.some(
          (allowed) => allowed.toLowerCase() === city.toLowerCase(),
        ),
    )

    const [restaurant] = await database
      .update(schema.restaurants)
      .set({
        name: input.name,
        address: emptyToNull(input.address),
        neighborhood: emptyToNull(input.neighborhood),
        city,
        postalCode: emptyToNull(input.postalCode),
        cuisines: input.cuisines,
        phone: emptyToNull(input.phone),
        website: emptyToNull(input.website),
        latitude:
          input.latitude === null || input.latitude === undefined ? null : String(input.latitude),
        longitude:
          input.longitude === null || input.longitude === undefined
            ? null
            : String(input.longitude),
        placeSource: emptyToNull(input.placeSource),
        placeReference: emptyToNull(input.placeReference),
      })
      .where(eq(schema.restaurants.id, restaurantId))
      .returning()

    return NextResponse.json({ restaurant, isOutsideRegion })
  })
