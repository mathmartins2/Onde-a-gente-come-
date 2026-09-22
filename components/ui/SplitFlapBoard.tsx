import { classNames } from '@/lib/utilities/classNames'

const cellSizeClassNames = {
  medium: 'h-9 w-[18px] text-[15px]',
  large: 'h-10 w-[18px] text-[16px] sm:h-14 sm:w-[30px] sm:text-[26px]',
}

type SplitFlapBoardProps = {
  rows: string[][]
  isSettled: boolean
  size?: keyof typeof cellSizeClassNames
  className?: string
}

export const SplitFlapBoard = ({ rows, isSettled, size = 'medium', className }: SplitFlapBoardProps) => (
  <div className={classNames('scheme-dark flex flex-col items-center gap-[3px]', className)}>
    {rows.map((row, rowIndex) => (
      <div key={rowIndex} className="flex justify-center gap-[3px]">
        {row.map((character, columnIndex) => (
          <span
            key={`${columnIndex}-${character}`}
            className={classNames(
              'board-grain relative flex items-center justify-center rounded-[3px] border border-hairline-strong bg-surface-sunken font-mono font-bold leading-none text-accent-hover shadow-[inset_0_-6px_10px_-8px_rgba(0,0,0,0.9)]',
              cellSizeClassNames[size],
              isSettled && 'flap-cell',
            )}
            style={isSettled ? { animationDelay: `${(rowIndex * row.length + columnIndex) * 42}ms` } : undefined}
          >
            <span className="absolute inset-x-0 top-1/2 h-px bg-black/50" />
            {character === ' ' ? ' ' : character}
          </span>
        ))}
      </div>
    ))}
  </div>
)
