import type { ImageLoaderProps } from 'next/image'
import { pickResponsiveWidth } from './responsiveImageWidths'

export const storedImageLoader = ({ src, width }: ImageLoaderProps) => `${src}?w=${pickResponsiveWidth(width)}`
