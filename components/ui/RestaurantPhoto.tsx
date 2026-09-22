import { classNames } from '@/lib/utilities/classNames'

export const RestaurantPhoto = ({
  name,
  photoUrl,
  className,
}: {
  name: string
  photoUrl?: string | null
  className?: string
}) => (
  <span
    aria-hidden
    className={classNames(
      'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-accent',
      className,
    )}
  >
    {photoUrl ? (
      <img src={photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <span className="font-display text-lg font-black text-on-accent">
        {name.trim().charAt(0).toUpperCase()}
      </span>
    )}
  </span>
)
