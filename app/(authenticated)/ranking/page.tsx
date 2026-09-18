import { RankingScreen } from '@/components/analytics/RankingScreen'
import { SubTabs, historyTabs } from '@/components/layout/SubTabs'

const RankingPage = () => (
  <>
    <SubTabs tabs={historyTabs} />
    <RankingScreen />
  </>
)

export default RankingPage
