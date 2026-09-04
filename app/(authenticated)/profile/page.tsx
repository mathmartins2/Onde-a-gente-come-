import { getCurrentMember } from '@/lib/auth/currentMember'
import { ProfileScreen } from '@/components/profile/ProfileScreen'

const ProfilePage = async () => {
  const member = await getCurrentMember()
  if (!member) return null

  return <ProfileScreen displayName={member.displayName} hasRatingPin={member.hasRatingPin} />
}

export default ProfilePage
