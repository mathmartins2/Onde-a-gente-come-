import { classNames } from '@/lib/utilities/classNames'

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={classNames('animate-pulse rounded-md bg-surface-2', className)}
  />
)
