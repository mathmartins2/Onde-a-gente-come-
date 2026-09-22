import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const typographyScale = [
  'display-hero',
  'display-large',
  'heading-xl',
  'heading-lg',
  'heading-md',
  'heading-sm',
  'body-lg',
  'body-md',
  'body-sm',
  'caption',
  'micro-cap',
  'button-cap',
]

const mergeTailwindClasses = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: typographyScale }], 'font-family': ['text-numeric'] } },
})

export const classNames = (...inputs: ClassValue[]) => mergeTailwindClasses(clsx(inputs))
