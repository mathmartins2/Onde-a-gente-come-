import { NextResponse } from 'next/server'
import { withMember, validationErrorResponse } from '@/lib/http/routeHelpers'
import { lookupPostalCode } from '@/lib/places/lookupPostalCode'
import { postalCodeLookupSchema } from '@/lib/validation/schemas'

export const GET = async (request: Request) =>
  withMember(async () => {
    const postalCode = new URL(request.url).searchParams.get('code')
    const parsed = postalCodeLookupSchema.safeParse({ postalCode })
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues.at(0)?.message ?? 'CEP inválido')
    }

    const address = await lookupPostalCode(parsed.data.postalCode)
    if (!address) return NextResponse.json({ error: 'Não achei esse CEP' }, { status: 404 })
    return NextResponse.json({ address })
  })
