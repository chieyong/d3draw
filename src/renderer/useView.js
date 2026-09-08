import { useCallback, useEffect, useState } from 'react'

/**
 * De toestand van de kijker, los van de spec.
 *
 * De spec is wat de maker heeft besloten: hij zit in undo en wordt
 * geëxporteerd. De view is waar de kijker nu naar kijkt - welke ordening,
 * welke bloemen vastgezet, wat er onder de muis ligt. Die wordt uit de
 * spec geïnitialiseerd en daarna door de renderer zelf beheerd; hij gaat
 * nooit terug de spec in, staat niet in undo en wordt niet bewaard.
 *
 * Voor deze splitsing schreef de "Ordening"-dropdown in een spec-kopie
 * binnen Garden. Gevolg: undo zag het niet, en "Spec opslaan" leverde de
 * oude layout.type op. Twee bronnen van waarheid voor één sleutel.
 *
 * Welke spec-paden een control mag aansturen staat hieronder. Alles wat er
 * niet in staat hoort in de inspector thuis, niet in de visualisatie.
 */
export const VIEW_BINDS = {
  'layout.type': 'layoutType',
}

export function useView(spec) {
  const [layoutType, setLayoutType] = useState(spec.layout?.type)
  const [hovered, setHovered] = useState(null)
  const [pinned, setPinned] = useState([])
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  // Verandert de maker de standaard in de inspector, dan volgt de kijker.
  // Andersom niet: de dropdown laat de spec ongemoeid.
  useEffect(() => {
    setLayoutType(spec.layout?.type)
  }, [spec.layout?.type])

  const setBound = useCallback((path, value) => {
    if (VIEW_BINDS[path] === 'layoutType') setLayoutType(value)
  }, [])

  const readBound = useCallback(
    (path) => (VIEW_BINDS[path] === 'layoutType' ? layoutType : undefined),
    [layoutType]
  )

  return {
    layoutType,
    hovered,
    setHovered,
    pinned,
    setPinned,
    pointer,
    setPointer,
    setBound,
    readBound,
  }
}
