import type { ReactNode } from 'react'

export const ActionBar = ({ children }: { children: ReactNode }) => (
  <div className="sticky bottom-0 z-20 -mx-4 mt-2 border-t border-hairline bg-[color-mix(in_srgb,var(--canvas)_88%,transparent)] px-4 pb-3 pt-3 backdrop-blur-xl lg:-mx-8 lg:px-8">
    <div className="flex gap-2">{children}</div>
  </div>
)
