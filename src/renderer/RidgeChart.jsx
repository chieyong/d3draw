import { useMemo } from 'react'
import { buildScales, scaleAt } from './scales'
import { withDerived } from './derive'
import { templateSpec } from './template'
import { labelOf } from './captions'
import { ridgePlot, ridges, ridgePath } from './ridge-geometry'
import { usePointer } from './usePointer'
import { useView } from './useView'
import { opacityOf, togglePin } from './highlight'
import Tooltip from './Tooltip'

/**
 * De ridgeline-template: één verdeling per groep, gestapeld.
 *
 * Het derde type, en het eerste met een andere datavorm. Bloem en bump
 * chart tekenen iets per entiteit over de tijd; hier is elke rij één losse
 * meting en is de getekende vorm een groep. Geen klok, geen animatie, geen
 * cursor - tijd is hier de stapelrichting, niet een dimensie om doorheen te
 * bewegen.
 */
export default function RidgeChart({ spec, data: rawData }) {
  const ridge = templateSpec(spec)
  const { theme } = spec

  const data = useMemo(() => withDerived(rawData, spec), [rawData, spec.data])
  const scales = useMemo(() => buildScales(spec, data), [ridge, spec.data, data])
  const vlak = useMemo(() => ridgePlot(spec), [spec.layout.fit, ridge])
  const { x, groepen } = useMemo(() => ridges(data, spec, vlak), [data, spec, vlak])

  const view = useView(spec)
  const { hovered, setHovered, pinned, setPinned } = view
  const { ref: wrapper, pointer, track } = usePointer()
  const maxPins = spec.interaction?.click?.max ?? 0

  // De aanwijsbare eenheid is hier het decennium, niet de film. Dat zegt de
  // template; highlight.js hoeft er niets van te weten.
  const eenheid = ridge.group.field
  const vulling = scaleAt(scales, 'fill', ridge.fill)

  const hoveredGroep = hovered ? groepen.find((g) => g.naam === hovered.name) : null

  return (
    <div ref={wrapper} style={{ maxWidth: vlak.outerWidth, position: 'relative' }}>
      <svg
        viewBox={`0 0 ${vlak.outerWidth} ${vlak.outerHeight}`}
        width="100%"
        style={{ background: theme.background, display: 'block' }}
        role="img"
        onPointerLeave={() => setHovered(null)}
      >
        <title>{spec.meta.title}</title>
        <desc>{spec.meta.subtitle}</desc>

        {ridge.axis.show &&
          ridge.axis.ticks.map((tick) => (
            <g key={`tick-${tick}`} data-spec-path={`${spec.template}.axis`}>
              <line
                x1={vlak.left + x(tick)}
                y1={vlak.top}
                x2={vlak.left + x(tick)}
                y2={vlak.top + vlak.height + ridge.axis.tickLength}
                stroke={theme.ink}
                strokeOpacity={ridge.axis.gridOpacity}
              />
              <text
                x={vlak.left + x(tick)}
                y={vlak.top + vlak.height + ridge.axis.tickLength + ridge.axis.size + 4}
                textAnchor="middle"
                fontFamily={theme.fontBody}
                fontSize={ridge.axis.size}
                fill={theme.ink}
                opacity={ridge.axis.opacity}
              >
                {tick}
              </text>
            </g>
          ))}

        {/* Van onder naar boven tekenen, zodat elke rug over zijn buurman
            eronder valt en de stapeling klopt. */}
        {[...groepen].reverse().map((groep) => (
          <g
            key={`rug-${groep.naam}`}
            data-spec-path={`${spec.template}.ridge`}
            data-spec-entity={groep.naam}
            transform={`translate(${vlak.left}, 0)`}
            opacity={opacityOf(groep.rijen[0], spec, { hovered, pinned }, eenheid)}
            onPointerEnter={(event) => {
              setHovered({ name: groep.naam, group: null })
              track(event)
            }}
            onPointerMove={track}
            onPointerLeave={() => setHovered(null)}
            onClick={
              maxPins ? () => setPinned((was) => togglePin(was, groep.naam, maxPins)) : undefined
            }
            style={{ cursor: maxPins ? 'pointer' : 'default' }}
            tabIndex={0}
            role={maxPins ? 'button' : 'img'}
            aria-label={`${groep.naam}: ${groep.samenvatting.aantal} films, mediaan ${groep.samenvatting.mediaan} seconden`}
            onFocus={() => setHovered({ name: groep.naam, group: null })}
            onBlur={() => setHovered(null)}
            onKeyDown={(event) => {
              if (!maxPins || (event.key !== 'Enter' && event.key !== ' ')) return
              event.preventDefault()
              setPinned((was) => togglePin(was, groep.naam, maxPins))
            }}
          >
            <path
              d={ridgePath(groep)}
              fill={vulling(groep.rijen[0])}
              fillOpacity={ridge.fillOpacity}
              stroke={theme.background}
              strokeWidth={ridge.strokeWidth}
              strokeLinejoin="round"
            />
          </g>
        ))}

        {ridge.labels.show &&
          groepen.map((groep) => (
            <text
              key={`label-${groep.naam}`}
              data-spec-path={`${spec.template}.labels`}
              x={vlak.left - ridge.labels.offset}
              y={groep.basis - 3}
              textAnchor="end"
              fontFamily={theme.fontBody}
              fontSize={ridge.labels.size}
              fill={theme.ink}
            >
              {groep.naam}s
            </text>
          ))}

        {ridge.axis.show && (
          <text
            x={vlak.left + vlak.width / 2}
            y={vlak.outerHeight - 6}
            textAnchor="middle"
            fontFamily={theme.fontBody}
            fontSize={ridge.axis.size}
            fill={theme.ink}
            opacity={ridge.axis.opacity}
          >
            {ridge.axis.label}
          </text>
        )}
      </svg>

      {hoveredGroep && (
        <Tooltip spec={spec} row={hoveredGroep.samenvatting} x={pointer.x} y={pointer.y} />
      )}

      <p
        style={{
          fontFamily: theme.fontBody,
          fontSize: ridge.axis.size,
          color: theme.ink,
          opacity: 0.7,
          margin: '0.6rem 0 0',
        }}
      >
        Elke vorm is de verdeling van {labelOf(spec, ridge.axis.field).toLowerCase()} binnen dat{' '}
        {labelOf(spec, ridge.group.field).toLowerCase()}. Hoogtes zijn onderling vergelijkbaar:
        een smallere, hogere vorm betekent dat films meer op elkaar gingen lijken.
      </p>
    </div>
  )
}
