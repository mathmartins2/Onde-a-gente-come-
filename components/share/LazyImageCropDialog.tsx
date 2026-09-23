'use client'

import dynamic from 'next/dynamic'

export const LazyImageCropDialog = dynamic(
  () => import('./ImageCropDialog').then((module) => module.ImageCropDialog),
  { ssr: false },
)
