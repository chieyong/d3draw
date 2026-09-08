import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart } from '../renderer'
import { labelOf } from '../renderer/editor-api'
import Inspector from './Inspector'
import { useSpecHistory } from './useSpecHistory'
import { usePicking } from './usePicking'
import { useDragging } from './useDragging'
import Toolbar from './Toolbar'
import { loadSession, mergeSpec, clearSession } from './persist'
import { validateSpec, hasErrors } from '../renderer'

/**
 * Het editor-omhulsel: houdt de spec vast, biedt undo, en vertaalt klikken
 * op het canvas naar een plek in de inspector. De renderer krijgt alleen
 * `spec` en `data` - hij weet niet dat er een editor bestaat en kan dus
 * los meegeleverd worden aan een klant.
 */

const MODES = {
  edit: 'Bewerken',
  view: 'Bekijken',
}

/** Wat je hebt aangeklikt, in woorden. */
function describeSelection(selection, spec) {
  if (!selection) return null
  const what = selection.field ? labelOf(spec, selection.field) : selection.path.split('.').pop()
  return [selection.entity, what].filter(Boolean).join(' · ')
}

export default function Editor({ spec: initialSpec, data, specKeuze }) {
  // Eén keer bij het opstarten kijken of er nog werk van vorige keer ligt.
  // De sessie wordt over de spec uit het bestand gelegd, zodat sleutels die
  // er sindsdien bij kwamen hun standaardwaarde krijgen. Levert dat alsnog
  // een ongeldige spec op (een hernoemde sleutel bijvoorbeeld), dan gooien
  // we de sessie weg in plaats van ermee te crashen.
  const [restored] = useState(() => {
    const saved = loadSession()
    if (!saved) return null
    const merged = mergeSpec(initialSpec, saved)
    // Mét de data controleren, niet alleen structureel. Een oude sessie kan
    // naar een kolom wijzen die niet (meer) bestaat - bijvoorbeeld een
    // gewijzigde tijdkolom - en dat is aan de vorm van de spec niet te zien.
    if (hasErrors(validateSpec(merged, data))) {
      clearSession()
      return null
    }
    return merged
  })
  const history = useSpecHistory(initialSpec, restored)
  const spec = history.spec
  const [mode, setMode] = useState('edit')
  const picking = usePicking(mode === 'edit')
  const dragging = useDragging(mode === 'edit', history)
  const canvas = useRef(null)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') picking.clear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picking])

  // Selectie tonen zonder de renderer aan te raken: een CSS-regel die het
  // gelabelde element aanwijst. Een outline werkt niet in SVG, een
  // drop-shadow wel - en die tast de vorm zelf niet aan.
  const highlight = useMemo(() => {
    const rules = []
    if (picking.hoverPath && mode === 'edit') {
      rules.push(`[data-spec-path="${picking.hoverPath}"]{cursor:pointer}`)
    }
    if (mode === 'edit') {
      rules.push('[data-drag="radial"]{cursor:grab}')
      if (dragging.drag) rules.push('svg{cursor:grabbing}')
    }
    if (picking.selection) {
      const target = picking.selection.entity
        ? `[data-spec-entity="${picking.selection.entity}"] [data-spec-path="${picking.selection.path}"]`
        : `[data-spec-path="${picking.selection.path}"]`
      rules.push(`${target}{filter:drop-shadow(0 0 3px #e07a5f) drop-shadow(0 0 7px #e07a5f)}`)
    }
    return rules.join('\n')
  }, [picking.hoverPath, picking.selection, mode, dragging.drag])

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: '100vh' }}>
      <style>{highlight}</style>

      <main style={{ flex: 1, minWidth: 0, padding: '1.5rem', background: spec.theme.background }}>
        <header
          style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '0.75rem' }}
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontFamily: spec.theme.fontDisplay,
                fontWeight: 600,
                fontSize: '2rem',
                margin: 0,
                color: '#1a1a2e',
              }}
            >
              {spec.meta.title}
            </h1>
            <p
              style={{
                fontFamily: spec.theme.fontBody,
                fontSize: '0.78rem',
                opacity: 0.7,
                margin: '0.2rem 0 0',
                color: '#1a1a2e',
              }}
            >
              {dragging.drag
                ? `${dragging.drag.doel.split('.').slice(1).join(' · ')}:  ${dragging.drag.v0}  →  ${dragging.drag.waarde}`
                : picking.selection
                ? `Geselecteerd: ${describeSelection(picking.selection, spec)} — Esc om los te laten`
                : restored
                  ? 'Verder waar je gebleven was — "herstel" gaat terug naar de spec uit het bestand'
                  : mode === 'edit'
                    ? 'Klik een element aan om de bijbehorende instelling te openen'
                    : spec.meta.subtitle}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: spec.theme.fontBody,
              fontSize: 11,
            }}
          >
            {specKeuze && (
              <select
                value={specKeuze.actief}
                onChange={(e) => {
                  const url = new URL(window.location)
                  url.searchParams.set('spec', e.target.value)
                  window.history.replaceState(null, '', url)
                  specKeuze.kies(e.target.value)
                }}
                style={{
                  fontFamily: 'inherit', fontSize: 11, color: '#1a1a2e',
                  background: 'transparent', border: '1px solid rgba(26,26,46,0.35)',
                  borderRadius: 3, padding: '0.3rem 0.4rem',
                }}
              >
                {Object.entries(specKeuze.opties).map(([k, v]) => (
                  <option key={k} value={k}>{v.naam}</option>
                ))}
              </select>
            )}
            <Toolbar spec={spec} history={history} canvasRef={canvas} />
            {Object.entries(MODES).map(([key, name]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                style={{
                  fontFamily: 'inherit',
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: '0.3rem 0.6rem',
                  borderRadius: 3,
                  border: '1px solid rgba(26,26,46,0.35)',
                  background: mode === key ? '#1a1a2e' : 'transparent',
                  color: mode === key ? '#fdf6ec' : '#1a1a2e',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </header>

        <div
          ref={canvas}
          onClickCapture={(event) => {
            // Een sleep eindigt met een klik; die hoort de selectie niet te
            // verzetten naar het punt dat je net verplaatst hebt.
            if (dragging.slikKlikIn()) {
              event.stopPropagation()
              return
            }
            picking.onClickCapture(event)
          }}
          onPointerDown={dragging.onPointerDown}
          onPointerMove={(event) => {
            dragging.onPointerMove(event)
            picking.onPointerMove(event)
          }}
          onPointerUp={dragging.onPointerUp}
          onPointerCancel={dragging.onPointerUp}
        >
          <Chart spec={spec} data={data} />
        </div>
      </main>

      <Inspector history={history} spec={spec} selection={picking.selection} />
    </div>
  )
}
