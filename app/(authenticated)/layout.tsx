import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/lib/auth/currentMember'
import { AppShell } from '@/components/layout/AppShell'

const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const member = await getCurrentMember()
  if (!member) redirect('/login')

  return <AppShell displayName={member.displayName}>{children}</AppShell>
}

export default AuthenticatedLayout
