'use client'

import { classNames } from '@/lib/utilities/classNames'

type SliderProps = {
  label: string
  value: number
  minimum?: number
  maximum?: number
  step?: number
  valueClassName?: string
  onChange: (value: number) => void
}

export const Slider = ({
  label,
  value,
  minimum = 0,
  maximum = 5,
  step = 0.5,
  valueClassName,
  onChange,
}: SliderProps) => {
  const filledPercentage = ((value - minimum) / (maximum - minimum)) * 100

  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-body-md">{label}</span>
        <span className={classNames('text-numeric text-heading-md', valueClassName)}>
          {value.toFixed(1)}
        </span>
      </span>

      <input
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(90deg, var(--accent-press) 0%, var(--accent) ${filledPercentage}%, var(--surface-3) ${filledPercentage}%, var(--surface-3) 100%)`,
        }}
        className="slider-track h-2 w-full cursor-pointer appearance-none rounded-pill focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
      />
    </label>
  )
}
