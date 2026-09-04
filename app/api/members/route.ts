import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { withMember } from '@/lib/http/routeHelpers'

export const GET = async () =>
  withMember(async () => {
    const rows = await database
      .select({ id: schema.members.id, displayName: schema.members.displayName })
      .from(schema.members)
      .orderBy(asc(schema.members.displayName))

    return NextResponse.json({ members: rows })
  })
