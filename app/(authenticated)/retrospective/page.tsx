import { SubTabs, historyTabs } from '@/components/layout/SubTabs'
import { YearInReviewScreen } from '@/components/yearInReview/YearInReviewScreen'

const RetrospectivePage = () => (
  <>
    <SubTabs tabs={historyTabs} />
    <YearInReviewScreen />
  </>
)

export default RetrospectivePage
