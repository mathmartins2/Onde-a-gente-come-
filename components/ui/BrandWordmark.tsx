type BrandWordmarkProps = {
  isStacked?: boolean
}

export const BrandWordmark = ({ isStacked = false }: BrandWordmarkProps) => (
  <>
    Onde a gente{isStacked ? <br /> : ' '}
    <span className="highlighter-stroke">come</span>
    <span className="text-[var(--herb)]">?</span>
  </>
)
