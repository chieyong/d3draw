import { useCallback, useRef, useState } from 'react'
import { readPath } from '../renderer/editor-api'

/**
 * Aan het canvas trekken, en daarmee de spec verzetten.
 *
 * De mentale regel uit sectie 6 van het schema: in Illustrator manipuleer je
 * het object, hier de *regel* die alle objecten tekent. Trek je één
 * ankerpunt naar buiten, dan schaalt de hele tuin mee — want je verzet
 * `contour.radius.range[1]`, niet de straal van dat ene punt.
 *
 * De editor kent de meetkunde niet en hoort die niet te kennen. De renderer
 * labelt daarom wat je kunt vastpakken:
 *
 *   data-drag-origin   op de groep waarvan het lokale nulpunt het middelpunt
 *                      van het gebaar is
 *   data-drag          het soort gebaar ("radial")
 *   data-drag-target   het spec-pad dat mee moet schalen
 *
 * De rest is een verhouding: hoeveel keer verder is de muis van het
 * middelpunt dan waar hij begon? Die factor gaat op de spec-waarde.
 */

/** Ruim genoeg om vrij te slepen, krap genoeg om niet per ongeluk te ontsporen. */
const MAX_FACTOR = 8

export function useDragging(enabled, history) {
  const [drag, setDrag] = useState(null)
  const bezig = useRef(null)
  const netGesleept = useRef(0)

  const afstand = (punt, event) => Math.hypot(event.clientX - punt.x, event.clientY - punt.y)

  const onPointerDown = useCallback(
    (event) => {
      if (!enabled || event.button !== 0) return
      const greep = event.target.closest?.('[data-drag]')
      const doel = greep?.dataset.dragTarget
      if (!doel) return

      const nulpunt = greep.closest('[data-drag-origin]')
      const ctm = nulpunt?.getScreenCTM?.()
      if (!ctm) return

      const punt = new DOMPoint(0, 0).matrixTransform(ctm)
      const r0 = afstand(punt, event)
      const v0 = readPath(history.spec, doel)
      if (!Number.isFinite(v0) || r0 < 4) return

      event.preventDefault()
      event.stopPropagation()
      greep.setPointerCapture?.(event.pointerId)
      bezig.current = { doel, v0, r0, punt, bewogen: false }
      setDrag({ doel, v0, waarde: v0 })
    },
    [enabled, history.spec]
  )

  const onPointerMove = useCallback(
    (event) => {
      const staat = bezig.current
      if (!staat) return
      event.preventDefault()

      const factor = Math.min(
        MAX_FACTOR,
        Math.max(1 / MAX_FACTOR, afstand(staat.punt, event) / staat.r0)
      )
      const waarde = Math.round(staat.v0 * factor * 100) / 100
      staat.bewogen = true
      history.set(staat.doel, waarde)
      setDrag({ doel: staat.doel, v0: staat.v0, waarde })
    },
    [history]
  )

  const onPointerUp = useCallback(() => {
    if (bezig.current?.bewogen) netGesleept.current = Date.now()
    bezig.current = null
    setDrag(null)
  }, [])

  /**
   * Na een sleep volgt een klik. Zonder dit zou die klik de selectie
   * verzetten naar het punt dat je net verplaatst hebt.
   */
  const slikKlikIn = useCallback(() => Date.now() - netGesleept.current < 250, [])

  return { drag, onPointerDown, onPointerMove, onPointerUp, slikKlikIn }
}
