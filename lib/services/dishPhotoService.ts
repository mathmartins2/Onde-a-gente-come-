import { and, asc, count, eq, inArray } from 'drizzle-orm'
import { database, schema } from '@/lib/database/client'
import { normalizeImage } from '@/lib/images/normalizeImage'
import { resolveImageStorage, resolveImageUrl } from '@/lib/images/resolveImageStorage'

export const maximumDishPhotosPerMember = 3

export const hasReachedDishPhotoLimit = (photoCountByMember: number) => photoCountByMember >= maximumDishPhotosPerMember

export const listDishPhotoKeysByVisit = async (visitIds: string[]) => {
  if (visitIds.length === 0) return new Map<string, string[]>()

  const rows = await database
    .select({ visitId: schema.visitDishPhotos.visitId, imageKey: schema.visitDishPhotos.imageKey })
    .from(schema.visitDishPhotos)
    .where(inArray(schema.visitDishPhotos.visitId, visitIds))
    .orderBy(asc(schema.visitDishPhotos.createdAt))

  return rows.reduce(
    (keysByVisit, row) => keysByVisit.set(row.visitId, [...(keysByVisit.get(row.visitId) ?? []), row.imageKey]),
    new Map<string, string[]>(),
  )
}

export const listFirstDishPhotoKeyByMember = async (visitId: string) => {
  const rows = await database
    .select({ memberId: schema.visitDishPhotos.addedByMemberId, imageKey: schema.visitDishPhotos.imageKey })
    .from(schema.visitDishPhotos)
    .where(eq(schema.visitDishPhotos.visitId, visitId))
    .orderBy(asc(schema.visitDishPhotos.createdAt))

  return rows.reduce(
    (keyByMember, row) => (keyByMember.has(row.memberId) ? keyByMember : keyByMember.set(row.memberId, row.imageKey)),
    new Map<string, string>(),
  )
}

export const listVisitDishPhotos = async (visitId: string) => {
  const rows = await database
    .select({
      id: schema.visitDishPhotos.id,
      imageKey: schema.visitDishPhotos.imageKey,
      addedByMemberId: schema.visitDishPhotos.addedByMemberId,
      addedByName: schema.members.displayName,
    })
    .from(schema.visitDishPhotos)
    .innerJoin(schema.members, eq(schema.members.id, schema.visitDishPhotos.addedByMemberId))
    .where(eq(schema.visitDishPhotos.visitId, visitId))
    .orderBy(asc(schema.visitDishPhotos.createdAt))

  return rows.map(({ imageKey, ...photo }) => ({ ...photo, imageUrl: resolveImageUrl(imageKey) }))
}

const countMemberDishPhotos = async (visitId: string, memberId: string) => {
  const rows = await database
    .select({ photoCount: count() })
    .from(schema.visitDishPhotos)
    .where(and(eq(schema.visitDishPhotos.visitId, visitId), eq(schema.visitDishPhotos.addedByMemberId, memberId)))
  return rows.at(0)?.photoCount ?? 0
}

const visitExists = async (visitId: string) => {
  const rows = await database.select({ id: schema.visits.id }).from(schema.visits).where(eq(schema.visits.id, visitId)).limit(1)
  return rows.length > 0
}

export const addVisitDishPhoto = async (input: { visitId: string; memberId: string; bytes: Buffer }) => {
  if (!(await visitExists(input.visitId))) return { status: 'missing' as const }
  if (hasReachedDishPhotoLimit(await countMemberDishPhotos(input.visitId, input.memberId))) {
    return { status: 'limit' as const }
  }

  const imageKey = await resolveImageStorage().saveImage(await normalizeImage(input.bytes, 'dishPhoto'))
  await database.insert(schema.visitDishPhotos).values({ visitId: input.visitId, addedByMemberId: input.memberId, imageKey })
  return { status: 'added' as const }
}

export const removeVisitDishPhoto = async (input: { visitId: string; photoId: string; memberId: string }) => {
  const rows = await database
    .delete(schema.visitDishPhotos)
    .where(
      and(
        eq(schema.visitDishPhotos.id, input.photoId),
        eq(schema.visitDishPhotos.visitId, input.visitId),
        eq(schema.visitDishPhotos.addedByMemberId, input.memberId),
      ),
    )
    .returning({ imageKey: schema.visitDishPhotos.imageKey })

  const removedPhoto = rows.at(0)
  if (!removedPhoto) return false
  await resolveImageStorage().removeImage(removedPhoto.imageKey)
  return true
}
