import { RulesScreen } from '@/components/rules/RulesScreen'
import { SubTabs, profileTabs } from '@/components/layout/SubTabs'

const RulesPage = () => (
  <>
    <SubTabs tabs={profileTabs} />
    <RulesScreen />
  </>
)

export default RulesPage
