import { StatisticsScreen } from '@/components/analytics/StatisticsScreen'
import { SubTabs, historyTabs } from '@/components/layout/SubTabs'

const StatisticsPage = () => (
  <>
    <SubTabs tabs={historyTabs} />
    <StatisticsScreen />
  </>
)

export default StatisticsPage
