import { useEffect, useMemo, useRef, useState } from 'react'
import Field from './Field'
import { describeSpec, groupFields } from './inspect'

const SECTION_NAMES = {
  preview: 'Weergave',
  data: 'Data',
  layout: 'Ordening',
  legend: 'Legenda',
  flower: 'Bloem',
  animation: 'Animatie',
  interaction: 'Interactie',
  theme: 'Thema',
}

/**
 * Het inspector-paneel. Het kent geen enkele spec-sleutel bij naam: het
 * krijgt een lijst velden van describeSpec() en tekent die. Voeg je morgen
 * een sleutel toe aan de spec, dan staat hij hier vanzelf.
 */
/**
 * Hoort dit veld bij wat er op het canvas is aangeklikt? Een klik op de
 * contour opent alles onder `flower.contour`; een klik op één ankerpunt
 * wijst preciezer naar de encoding die dat punt aanstuurt.
 */
function matchesSelection(field, selection) {
  if (!selection) return false
  return field.path === selection.path || field.path.startsWith(`${selection.path}.`)
}

export default function Inspector({ history, spec, selection }) {
  const [open, setOpen] = useState(() => new Set(['flower', 'layout']))
  const firstMatch = useRef(null)

  // Selecteren op het canvas vouwt de juiste sectie open en scrolt ernaartoe.
  const section = selection?.path.split('.')[0]
  useEffect(() => {
    if (!section) return
    setOpen((was) => (was.has(section) ? was : new Set([...was, section])))
  }, [section, selection])

  useEffect(() => {
    if (selection && firstMatch.current) {
      firstMatch.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [selection])
  const groups = useMemo(() => groupFields(describeSpec(spec)), [spec])
  const labels = spec.data.labels

  const toggle = (name) =>
    setOpen((was) => {
      const next = new Set(was)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  return (
    <aside
      style={{
        width: 330,
        flex: '0 0 330px',
        alignSelf: 'stretch',
        overflowY: 'auto',
        maxHeight: '100vh',
        padding: '1rem',
        fontFamily: spec.theme.fontBody,
        fontSize: 11,
        color: '#1a1a2e',
        borderLeft: '1px solid rgba(26,26,46,0.14)',
        background: 'rgba(255,255,255,0.35)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.9rem',
        }}
      >
        <strong style={{ flex: 1, fontFamily: spec.theme.fontDisplay, fontSize: 17 }}>
          Inspector
        </strong>
        <button type="button" onClick={history.undo} disabled={!history.canUndo} title="Cmd-Z">
          ↩
        </button>
        <button
          type="button"
          onClick={history.redo}
          disabled={!history.canRedo}
          title="Cmd-Shift-Z"
        >
          ↪
        </button>
        <button type="button" onClick={history.reset} disabled={!history.canUndo}>
          herstel
        </button>
      </header>

      <p style={{ opacity: 0.6, margin: '0 0 1rem' }}>
        {history.steps} {history.steps === 1 ? 'wijziging' : 'wijzigingen'}
      </p>

      {groups.map(([section, fields]) => (
        <section key={section} style={{ marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => toggle(section)}
            style={{
              width: '100%',
              textAlign: 'left',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 500,
              color: 'inherit',
              background: 'transparent',
              border: 0,
              borderBottom: '1px solid rgba(26,26,46,0.14)',
              padding: '0.35rem 0',
              cursor: 'pointer',
            }}
          >
            {open.has(section) ? '▾' : '▸'} {SECTION_NAMES[section] ?? section}
            <span style={{ float: 'right', opacity: 0.5 }}>{fields.length}</span>
          </button>

          {open.has(section) && (
            <div style={{ padding: '0.5rem 0 0.75rem' }}>
              {fields.map((field, i) => {
                const hit = matchesSelection(field, selection)
                return (
                  <div
                    key={field.path}
                    ref={hit && i === fields.findIndex((f) => matchesSelection(f, selection))
                      ? firstMatch
                      : null}
                    style={
                      hit
                        ? {
                            background: 'rgba(224,122,95,0.16)',
                            boxShadow: '0 0 0 3px rgba(224,122,95,0.16)',
                            borderRadius: 2,
                          }
                        : undefined
                    }
                  >
                    <Field field={field} labels={labels} onChange={history.set} />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ))}
    </aside>
  )
}
