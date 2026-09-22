import { NextResponse } from 'next/server'
import { withMember } from '@/lib/http/routeHelpers'
import {
  missingImageResponse,
  readUploadedImage,
  respondToImageReplacement,
} from '@/lib/http/imageUploadResponses'
import { replaceMemberAvatar } from '@/lib/services/imageService'

export const runtime = 'nodejs'

export const PUT = async (request: Request) =>
  withMember(async (member) => {
    const uploadedImage = await readUploadedImage(request)
    if (!uploadedImage) return missingImageResponse()

    return respondToImageReplacement(async () =>
      NextResponse.json({ avatarUrl: await replaceMemberAvatar(member.id, uploadedImage) }),
    )
  })

export const DELETE = async () =>
  withMember(async (member) => {
    await replaceMemberAvatar(member.id, null)
    return NextResponse.json({ avatarUrl: null })
  })
