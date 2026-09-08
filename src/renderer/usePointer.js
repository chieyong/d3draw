import { useCallback, useRef, useState } from 'react'

/**
 * De muispositie binnen een element, voor het plaatsen van de tooltip.
 *
 * Stond eerst los in Garden. Toen de bump chart dezelfde tooltip kreeg,
 * bleek het geen bloem-code maar host-code te zijn: elke template die iets
 * bij de muis wil tonen heeft precies dit nodig.
 */
export function usePointer() {
  const ref = useRef(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  const track = useCallback((event) => {
    const box = ref.current?.getBoundingClientRect()
    if (box) setPointer({ x: event.clientX - box.left, y: event.clientY - box.top })
  }, [])

  return { ref, pointer, track, set: setPointer }
}
