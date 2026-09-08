import { useCallback, useEffect, useMemo, useState } from 'react'
import { withOverrides, readPath } from '../renderer/editor-api'
import { saveSession, clearSession } from './persist'

const COALESCE_MS = 700

/**
 * De spec plus zijn geschiedenis. Elke spec-versie is één stap, precies
 * zoals sectie 6 van het schema beschrijft.
 *
 * Slepen aan een slider zou honderd stappen opleveren, dus opeenvolgende
 * bewerkingen aan hetzelfde pad binnen 0,7 seconde vervangen de bovenste
 * stap in plaats van er een toe te voegen. Zo is één sleepbeweging één
 * ongedaan-maken.
 *
 * Deze laag hoort bij de editor. De renderer weet er niets van - die
 * krijgt alleen de spec die er op dit moment uitkomt.
 */
export function useSpecHistory(initial, restored) {
  const [past, setPast] = useState([])
  const [present, setPresent] = useState(restored ?? initial)
  const [future, setFuture] = useState([])
  const [lastEdit, setLastEdit] = useState({ path: null, at: 0 })

  const set = useCallback(
    (path, value) => {
      const now = Date.now()
      const sameDrag = lastEdit.path === path && now - lastEdit.at < COALESCE_MS

      setPast((stack) => (sameDrag ? stack : [...stack, present]))
      setPresent((spec) => withOverrides(spec, { [path]: value }))
      setFuture([])
      setLastEdit({ path, at: now })
    },
    [present, lastEdit]
  )

  const undo = useCallback(() => {
    setPast((stack) => {
      if (stack.length === 0) return stack
      setFuture((f) => [present, ...f])
      setPresent(stack[stack.length - 1])
      setLastEdit({ path: null, at: 0 })
      return stack.slice(0, -1)
    })
  }, [present])

  const redo = useCallback(() => {
    setFuture((stack) => {
      if (stack.length === 0) return stack
      setPast((p) => [...p, present])
      setPresent(stack[0])
      setLastEdit({ path: null, at: 0 })
      return stack.slice(1)
    })
  }, [present])

  const reset = useCallback(() => {
    setPast((stack) => [...stack, present])
    setPresent(initial)
    setFuture([])
    clearSession()
  }, [present, initial])

  /** Een geladen spec is een nieuw begin, maar wel ongedaan te maken. */
  const replace = useCallback(
    (spec) => {
      setPast((stack) => [...stack, present])
      setPresent(spec)
      setFuture([])
    },
    [present]
  )

  // Vangnet tegen een herlaad. Het archief is het gedownloade bestand;
  // dit is alleen bedoeld om te voorkomen dat een F5 je werk wist.
  useEffect(() => {
    saveSession(present)
  }, [present])

  useEffect(() => {
    const onKey = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return useMemo(
    () => ({
      spec: present,
      set,
      undo,
      redo,
      reset,
      replace,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      steps: past.length,
      read: (path) => readPath(present, path),
    }),
    [present, set, undo, redo, reset, replace, past.length, future.length]
  )
}
