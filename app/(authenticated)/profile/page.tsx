import { getCurrentMember } from '@/lib/auth/currentMember'
import { ProfileScreen } from '@/components/profile/ProfileScreen'
import { SubTabs, profileTabs } from '@/components/layout/SubTabs'

const ProfilePage = async () => {
  const member = await getCurrentMember()
  if (!member) return null

  return (
    <>
      <SubTabs tabs={profileTabs} />
      <ProfileScreen displayName={member.displayName} hasRatingPin={member.hasRatingPin} />
    </>
  )
}

export default ProfilePage
