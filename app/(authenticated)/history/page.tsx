import { HistoryScreen } from '@/components/history/HistoryScreen'
import { SubTabs, historyTabs } from '@/components/layout/SubTabs'

const HistoryPage = () => (
  <>
    <SubTabs tabs={historyTabs} />
    <HistoryScreen />
  </>
)

export default HistoryPage
