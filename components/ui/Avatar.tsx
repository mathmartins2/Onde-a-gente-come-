import { classNames } from '@/lib/utilities/classNames'

const avatarSizeClasses = {
  small: 'h-7 w-7 text-[0.6875rem]',
  medium: 'h-9 w-9 text-xs',
  large: 'h-20 w-20 text-2xl',
} as const

const buildInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

export const Avatar = ({
  name,
  imageUrl,
  size = 'medium',
  className,
}: {
  name: string
  imageUrl?: string | null
  size?: keyof typeof avatarSizeClasses
  className?: string
}) => (
  <span
    aria-hidden
    className={classNames(
      'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-accent-tint font-semibold text-accent',
      avatarSizeClasses[size],
      className,
    )}
  >
    {imageUrl ? (
      <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
    ) : (
      buildInitials(name)
    )}
  </span>
)
