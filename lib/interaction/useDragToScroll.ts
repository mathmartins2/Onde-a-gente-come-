'use client'

import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

const dragThresholdInPixels = 6
const frictionPerFrame = 0.94
const frameDurationInMilliseconds = 16
const minimumMomentumSpeed = 0.02
const motionSettleDelayInMilliseconds = 140

type DragState = { pointerX: number; scrollLeft: number; lastX: number; lastTimestamp: number; velocity: number }

export const useDragToScroll = <Element extends HTMLElement>() => {
  const containerReference = useRef<Element>(null)
  const dragState = useRef<DragState | null>(null)
  const hasDragged = useRef(false)
  const momentumFrame = useRef(0)

  useEffect(() => {
    const container = containerReference.current
    if (!container) return

    const scrollState = { previousScrollLeft: container.scrollLeft, settleTimer: 0 }

    const markMotion = () => {
      const scrollDelta = container.scrollLeft - scrollState.previousScrollLeft
      scrollState.previousScrollLeft = container.scrollLeft
      if (scrollDelta === 0) return
      container.dataset.motion = scrollDelta > 0 ? 'forward' : 'backward'
      window.clearTimeout(scrollState.settleTimer)
      scrollState.settleTimer = window.setTimeout(() => {
        delete container.dataset.motion
      }, motionSettleDelayInMilliseconds)
    }

    container.addEventListener('scroll', markMotion, { passive: true })
    return () => {
      container.removeEventListener('scroll', markMotion)
      window.clearTimeout(scrollState.settleTimer)
      cancelAnimationFrame(momentumFrame.current)
    }
  }, [])

  const glideWithMomentum = (initialVelocity: number) => {
    const container = containerReference.current
    if (!container) return

    const glide = { velocity: initialVelocity, previousTimestamp: performance.now() }
    const step = (timestamp: number) => {
      const elapsed = timestamp - glide.previousTimestamp
      glide.previousTimestamp = timestamp
      container.scrollLeft -= glide.velocity * elapsed
      glide.velocity *= frictionPerFrame ** (elapsed / frameDurationInMilliseconds)
      if (Math.abs(glide.velocity) < minimumMomentumSpeed) return
      momentumFrame.current = requestAnimationFrame(step)
    }
    momentumFrame.current = requestAnimationFrame(step)
  }

  const onPointerDown = (event: PointerEvent<Element>) => {
    if (event.pointerType !== 'mouse' || !containerReference.current) return
    cancelAnimationFrame(momentumFrame.current)
    dragState.current = {
      pointerX: event.clientX,
      scrollLeft: containerReference.current.scrollLeft,
      lastX: event.clientX,
      lastTimestamp: event.timeStamp,
      velocity: 0,
    }
    hasDragged.current = false
  }

  const onPointerMove = (event: PointerEvent<Element>) => {
    const state = dragState.current
    const container = containerReference.current
    if (!state || !container) return
    const horizontalDistance = event.clientX - state.pointerX
    if (Math.abs(horizontalDistance) < dragThresholdInPixels && !hasDragged.current) return
    if (!hasDragged.current) container.setPointerCapture(event.pointerId)
    hasDragged.current = true
    container.scrollLeft = state.scrollLeft - horizontalDistance

    const elapsed = Math.max(event.timeStamp - state.lastTimestamp, 1)
    dragState.current = {
      ...state,
      velocity: (event.clientX - state.lastX) / elapsed,
      lastX: event.clientX,
      lastTimestamp: event.timeStamp,
    }
  }

  const endDrag = (event: PointerEvent<Element>) => {
    const state = dragState.current
    dragState.current = null
    const container = containerReference.current
    if (container?.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId)
    if (!state || !hasDragged.current) return
    glideWithMomentum(state.velocity)
  }

  const onClickCapture = (event: MouseEvent<Element>) => {
    if (!hasDragged.current) return
    hasDragged.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return {
    ref: containerReference,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onClickCapture,
  }
}
