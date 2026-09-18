import { VisitedMap } from '@/components/analytics/VisitedMap'
import { SubTabs, historyTabs } from '@/components/layout/SubTabs'

const MapPage = () => (
  <>
    <SubTabs tabs={historyTabs} />
    <VisitedMap />
  </>
)

export default MapPage
