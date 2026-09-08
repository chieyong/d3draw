import { useEffect, useRef, useState } from 'react'

/**
 * Loopt van 0 naar 1 zodra `key` verandert, en onthoudt de vorige waarde
 * zolang dat duurt. Daarmee kan de aanroeper twee toestanden in elkaar
 * overvloeien zonder ze zelf te hoeven bewaren.
 *
 * requestAnimationFrame, net als useTimeline: d3.transition schrijft naar
 * de DOM en die is hier van React.
 */
export function useTween(key, duration) {
  const [state, setState] = useState({ from: null, t: 1 })
  const previous = useRef(key)

  useEffect(() => {
    if (previous.current === key) return
    const from = previous.current
    previous.current = key

    if (!duration) {
      setState({ from: null, t: 1 })
      return
    }

    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / duration, 1)
      setState({ from: t < 1 ? from : null, t })
      if (t < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [key, duration])

  return state
}
