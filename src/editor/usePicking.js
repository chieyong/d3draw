import { useCallback, useState } from 'react'

/**
 * Het canvas als ingang op de inspector.
 *
 * De renderer geeft niets terug - hij labelt alleen wat hij tekent met
 * data-spec-path. Deze haak vangt de gebeurtenis op de omhullende div en
 * leest dat label uit het dichtstbijzijnde gelabelde element. Daardoor
 * heeft de renderer geen enkele callback nodig en blijft hij los te
 * leveren.
 *
 * `closest()` doet hier het echte werk: klik je op een ankerpunt, dan
 * vindt hij eerst dat punt; klik je ernaast op de contour, dan de contour;
 * klik je in de lege ruimte binnen de bloem, dan de bloem als geheel.
 * De fijnste treffer wint vanzelf, zonder dat wij hitboxen hoeven te
 * ordenen.
 */
export function usePicking(enabled) {
  const [selection, setSelection] = useState(null)
  const [hoverPath, setHoverPath] = useState(null)

  const read = (event) => {
    const node = event.target.closest?.('[data-spec-path]')
    if (!node) return null
    return {
      path: node.dataset.specPath,
      field: node.dataset.specField ?? null,
      entity: node.closest('[data-spec-entity]')?.dataset.specEntity ?? null,
    }
  }

  const onClickCapture = useCallback(
    (event) => {
      if (!enabled) return

      // Alleen klikken op de tekening zijn van de editor. De renderer heeft
      // ook eigen bedieningselementen - de afspeelknop, de dropdown - en die
      // staan binnen hetzelfde blok. Zonder deze grens slikte de editor die
      // klikken op en deed de afspeelknop niets meer.
      if (!event.target.closest?.('svg')) return

      const hit = read(event)
      // In bewerkmodus is de klik van de editor. Zonder dit zou hij
      // doorlopen naar pin-compare in de renderer. Een klik op lege ruimte
      // binnen de tekening laat de selectie los.
      event.stopPropagation()
      event.preventDefault()
      setSelection(hit)
    },
    [enabled]
  )

  const onPointerMove = useCallback(
    (event) => {
      if (!enabled || !event.target.closest?.('svg')) return
      const hit = read(event)
      setHoverPath((was) => (was === (hit?.path ?? null) ? was : hit?.path ?? null))
    },
    [enabled]
  )

  const clear = useCallback(() => setSelection(null), [])

  return { selection, hoverPath, onClickCapture, onPointerMove, clear }
}
