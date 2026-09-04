import { getCurrentMember } from '@/lib/auth/currentMember'
import { RatingScreen } from '@/components/rating/RatingScreen'

const RatingPage = async ({ params }: { params: Promise<{ visitId: string }> }) => {
  const member = await getCurrentMember()
  if (!member) return null

  const { visitId } = await params
  return <RatingScreen visitId={visitId} currentMemberId={member.id} />
}

export default RatingPage
