import { useCallback, useEffect, useRef, useState } from 'react'
import { easeCubicInOut, easeLinear, easeSinInOut, easeQuadInOut } from 'd3'

const EASES = {
  easeCubicInOut,
  easeLinear,
  easeSinInOut,
  easeQuadInOut,
}

/** Welke easings de renderer kent. De inspector leest deze lijst. */
export const EASE_TYPES = Object.keys(EASES)

export function easeOf(spec) {
  return EASES[spec.animation?.ease] ?? easeCubicInOut
}

/**
 * De klok van de visualisatie.
 *
 * `index` is een kommagetal in de jarenlijst: 3.4 betekent 40% onderweg van
 * het vierde naar het vijfde jaar. Dat lineaire getal is de waarheid; de
 * easing wordt pas bij het tekenen toegepast (in frameOf). Zo blijft de
 * slider gelijkmatig lopen terwijl de beweging op het scherm versnelt en
 * afremt.
 *
 * requestAnimationFrame in plaats van d3.transition: d3.transition schrijft
 * rechtstreeks naar de DOM, en die is hier van React.
 */
export function useTimeline(spec, years) {
  const { durationPerStep = 900, loop = false } = spec.animation ?? {}
  const startYear = spec.preview?.[spec.data.time]
  const start = Math.max(0, years.indexOf(startYear))

  const [index, setIndex] = useState(start)
  const [playing, setPlaying] = useState(false)
  const indexRef = useRef(start)

  const last = years.length - 1

  // Springt de spec naar een ander jaar (bijvoorbeeld via de inspector),
  // dan volgt de klok.
  useEffect(() => {
    indexRef.current = start
    setIndex(start)
  }, [start])

  // Krimpt de tijdlijn (andere tijdkolom, andere dataset), dan mag de klok
  // niet voorbij het laatste jaar blijven staan.
  useEffect(() => {
    if (indexRef.current > last) {
      indexRef.current = last
      setIndex(last)
    }
  }, [last])

  useEffect(() => {
    if (!playing || last <= 0) return
    let previous = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const step = (now - previous) / durationPerStep
      previous = now
      let next = indexRef.current + step

      if (next >= last) {
        next = loop ? 0 : last
        if (!loop) setPlaying(false)
      }
      indexRef.current = next
      setIndex(next)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing, durationPerStep, loop, last])

  const seek = useCallback((value) => {
    indexRef.current = value
    setIndex(value)
  }, [])

  const toggle = useCallback(() => {
    // Aan het eind opnieuw beginnen in plaats van niets doen. Dit staat
    // bewust buiten de updater: een updater hoort puur te zijn, en React
    // roept hem in strict mode twee keer aan.
    if (!playing && indexRef.current >= last) seek(0)
    setPlaying((was) => !was)
  }, [playing, last, seek])

  return { index, playing, seek, toggle, years }
}
