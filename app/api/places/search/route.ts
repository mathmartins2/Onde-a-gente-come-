import { NextResponse } from 'next/server'
import { searchPlaceCandidates } from '@/lib/places/searchPlaces'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { placeSearchSchema } from '@/lib/validation/schemas'

export const GET = async (request: Request) =>
  withMember(async () => {
    const term = new URL(request.url).searchParams.get('term')
    const parsed = placeSearchSchema.safeParse({ term })
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Busca inválida')
    }

    const candidates = await searchPlaceCandidates(parsed.data.term)
    return NextResponse.json({ candidates })
  })
