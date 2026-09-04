import { NextResponse } from 'next/server'
import { resolveMapsLink } from '@/lib/places/resolveMapsLink'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { placeLinkSchema } from '@/lib/validation/schemas'

export const POST = async (request: Request) =>
  withMember(async () => {
    const body = await request.json().catch(() => null)
    const parsed = placeLinkSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'Link inválido')
    }

    const candidate = await resolveMapsLink(parsed.data.link)
    if (!candidate) {
      return NextResponse.json(
        { error: 'Só aceito link do Google Maps, e não consegui ler esse' },
        { status: 422 },
      )
    }

    return NextResponse.json({ candidate })
  })
