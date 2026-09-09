import { useId, useMemo } from 'react'
import { buildScales, scaleAt } from './scales'
import { withDerived } from './derive'
import { templateSpec } from './template'
import { labelOf } from './captions'
import { plotArea, bumpLines, bumpPath, cursorSegment, cursorPoint, legendItems } from './bump-geometry'
import { useTimeline, easeOf } from './useTimeline'
import TimeSlider from './TimeSlider'
import Tooltip from './Tooltip'
import { useView } from './useView'
import { usePointer } from './usePointer'
import { opacityOf, togglePin } from './highlight'

/**
 * De bump-template: rangorde over tijd, één lijn per entiteit.
 *
 * Het verschil met de bloem zit niet in de vorm maar in de omgang met tijd.
 * De bloem tekent één jaar per beeldje en animeert ertussen; hier is tijd
 * een as en staat alles tegelijk in beeld. Daarom gebruikt dit component
 * geen enkele functie uit timeline.js behalve yearsOf - de frame-machinerie
 * heeft hier niets te doen.
 *
 * Wat het wél deelt met de bloem: de data, de afgeleide kolommen, de
 * schalen uit de encodings, de sortering, het thema en de labels. Dat is
 * precies de scheidslijn tussen platform en template.
 */
export default function BumpChart({ spec, data: rawData }) {
  const bump = templateSpec(spec)
  const { entity } = spec.data
  const { theme } = spec

  const data = useMemo(() => withDerived(rawData, spec), [rawData, spec.data])
  const scales = useMemo(() => buildScales(spec, data), [bump, spec.data, data])

  const area = useMemo(() => plotArea(spec), [spec.layout.fit, bump.plot])
  const { years, lijnen, x, y } = useMemo(
    () => bumpLines(data, spec, area),
    [data, spec.data, spec.layout, area]
  )

  const breedte = scaleAt(scales, 'line.width', bump.line.width)
  const kleur = scaleAt(scales, 'line.color', bump.line.color)

  // Dezelfde klok als de bloem. Alleen de betekenis verschilt: de bloem
  // tekent het beeldje dat bij deze stand hoort, hier staat er een cursor
  // op die plek. Vandaar dat de tijdslider ongewijzigd hergebruikt kan
  // worden - hij stuurt een getal aan, niet een grafiek.
  // Dezelfde interactielaag als de bloem. opacityOf, togglePin en Tooltip
  // kennen alleen entiteiten en de spec, geen grafiekvorm - dus ze werken
  // hier ongewijzigd.
  const view = useView(spec)
  const { hovered, setHovered, pinned, setPinned } = view
  const { ref: wrapper, pointer, track } = usePointer()
  const maxPins = spec.interaction?.click?.max ?? 0
  const groupField = spec.interaction?.hover?.groupField

  const timeline = useTimeline(spec, years)
  const clipId = `tot${useId().replace(/:/g, '')}`
  const ease = easeOf(spec)
  const { i0, i1, s } = cursorSegment(years, timeline.index)
  const soepel = i0 === i1 ? 0 : ease(s)

  const cursor = bump.cursor?.show
    ? {
        ...bump.cursor,
        x: cursorPoint(
          { x: x(years[i0]), y: 0 },
          { x: x(years[i1]), y: 0 },
          soepel,
          bump.line.curve
        ).x,
        jaar: years[Math.round(timeline.index)],
        rangJaar: years[Math.round(timeline.index)],
        stippen: lijnen
          .map((lijn) => {
            const a = lijn.punten.find((p) => p.year === years[i0])
            const b = lijn.punten.find((p) => p.year === years[i1])
            if (!a || !b) return null
            const punt = cursorPoint(
              { x: x(a.year), y: y(a.rank) },
              { x: x(b.year), y: y(b.rank) },
              soepel,
              bump.line.curve
            )
            return { naam: lijn.naam, row: a.row, ...punt }
          })
          .filter(Boolean),
      }
    : null

  const onthullen = Boolean(cursor && bump.cursor.reveal)
  const volgLabel = (lijn) => {
    const stip = cursor?.stippen.find((s) => s.naam === lijn.naam)
    const opJaar = lijn.punten.find((p) => p.year === cursor?.rangJaar)
    return { y: stip?.y ?? y(lijn.laatste.rank), rank: opJaar?.rank ?? lijn.laatste.rank }
  }

  // De legenda leest de groepen uit de data en hun kleur uit dezelfde
  // schaal die de linten kleurt. Een handmatige lijst zou stilletjes gaan
  // afwijken zodra iemand de kleuren of het veld wijzigt.
  const clusters = useMemo(() => {
    const veld = bump.line.color?.field
    if (!veld) return []
    return [...new Set(data.map((row) => row[veld]))].map((naam) => ({
      naam,
      kleur: kleur(data.find((row) => row[veld] === naam)),
    }))
  }, [data, bump.line.color, kleur])

  const hoveredRow = hovered
    ? lijnen.find((l) => l.naam === hovered.name)?.laatste.row
    : null

  return (
    <div ref={wrapper} style={{ maxWidth: area.outerWidth, position: 'relative' }}>
      <svg
        onPointerLeave={() => setHovered(null)}
        viewBox={`0 0 ${area.outerWidth} ${area.outerHeight}`}
        width="100%"
        style={{ background: theme.background, display: 'block' }}
        role="img"
      >
        <title>{spec.meta.title}</title>
        <desc>{spec.meta.subtitle}</desc>

        {onthullen && (
          // Alleen tekenen tot waar de cursor staat. Zonder dit is
          // afspelen beweging zonder informatie: de grafiek is dan al af en
          // er ontvouwt zich niets. Mét onthullen vertelt de knop het
          // verhaal in de volgorde waarin het gebeurde.
          <defs>
            <clipPath id={clipId}>
              <rect
                x={0}
                y={0}
                width={cursor.x + bump.line.width.range?.[1] ?? 10}
                height={area.outerHeight}
              />
            </clipPath>
          </defs>
        )}

        {bump.axis.show &&
          years.map((year) => (
            <g key={`as-${year}`} data-spec-path={`${spec.template}.axis`}>
              <line
                x1={x(year)}
                y1={area.top - bump.axis.tickLength}
                x2={x(year)}
                y2={area.top + area.height + bump.axis.tickLength}
                stroke={theme.ink}
                strokeOpacity={bump.axis.gridOpacity}
              />
              <text
                x={x(year)}
                y={area.top - bump.axis.tickLength - 6}
                textAnchor="middle"
                fontFamily={theme.fontBody}
                fontSize={bump.axis.size}
                fill={theme.ink}
                opacity={bump.axis.opacity}
              >
                {year}
              </text>
            </g>
          ))}

        <g clipPath={onthullen ? `url(#${clipId})` : undefined}>
        {lijnen.map((lijn) => {
          const pad = bumpPath(lijn.punten, bump.line, x, y)
          return (
            <g
              key={`lijn-${lijn.naam}`}
              data-spec-path={`${spec.template}.line`}
              data-spec-entity={lijn.naam}
              opacity={opacityOf(lijn.eerste.row, spec, { hovered, pinned })}
              onPointerEnter={(event) => {
                setHovered({
                  name: lijn.naam,
                  group: groupField ? lijn.eerste.row[groupField] : null,
                })
                track(event)
              }}
              onPointerMove={track}
              onPointerLeave={() => setHovered(null)}
              onClick={
                maxPins
                  ? () => setPinned((was) => togglePin(was, lijn.naam, maxPins))
                  : undefined
              }
              style={{ cursor: maxPins ? 'pointer' : 'default' }}
              tabIndex={0}
              role={maxPins ? 'button' : 'img'}
              aria-label={`${lijn.naam}${pinned.includes(lijn.naam) ? ' (vastgezet)' : ''}`}
              onFocus={() =>
                setHovered({
                  name: lijn.naam,
                  group: groupField ? lijn.eerste.row[groupField] : null,
                })
              }
              onBlur={() => setHovered(null)}
              onKeyDown={(event) => {
                if (!maxPins || (event.key !== 'Enter' && event.key !== ' ')) return
                event.preventDefault()
                setPinned((was) => togglePin(was, lijn.naam, maxPins))
              }}
            >
              {/*
                Een onzichtbaar, breder pad als trefvlak. Een lint van 1,5px
                is met de muis vrijwel niet te raken.
              */}
              <path
                d={pad}
                fill="none"
                stroke="transparent"
                strokeWidth={bump.line.hitWidth}
                pointerEvents="stroke"
              />
              <path
                d={pad}
                fill="none"
                stroke={kleur(lijn.eerste.row)}
                strokeWidth={breedte(lijn.eerste.row)}
                strokeOpacity={bump.line.opacity}
                strokeLinecap="round"
                pointerEvents="none"
              />
            </g>
          )
        })}

        {bump.dots.show &&
          lijnen.flatMap((lijn) =>
            lijn.punten.map((punt) => (
              <circle
                key={`punt-${lijn.naam}-${punt.year}`}
                data-spec-path={`${spec.template}.dots`}
                cx={x(punt.year)}
                cy={y(punt.rank)}
                r={bump.dots.radius}
                fill={theme.background}
                stroke={kleur(punt.row)}
                strokeWidth={bump.dots.strokeWidth}
              />
            ))
          )}
        </g>

        {cursor && (
          <g data-spec-path={`${spec.template}.cursor`}>
            <line
              x1={cursor.x}
              y1={area.top - bump.axis.tickLength}
              x2={cursor.x}
              y2={area.top + area.height + bump.axis.tickLength}
              stroke={theme.accent}
              strokeWidth={cursor.width}
              strokeOpacity={cursor.opacity}
            />
            {cursor.stippen.map((stip) => (
              <circle
                key={`cursor-${stip.naam}`}
                cx={stip.x}
                cy={stip.y}
                r={cursor.dotRadius}
                fill={kleur(stip.row)}
                stroke={theme.background}
                strokeWidth={1.5}
              />
            ))}
            <text
              x={cursor.x}
              y={area.top + area.height + bump.axis.tickLength + cursor.yearSize + 8}
              textAnchor="middle"
              fontFamily={theme.fontDisplay}
              fontSize={cursor.yearSize}
              fill={theme.accent}
            >
              {cursor.jaar}
            </text>
          </g>
        )}

        {bump.legend?.show &&
          (() => {
            const dikte = `lijndikte ≈ ${labelOf(spec, bump.line.width.field).toLowerCase()}`
            const { items, extraX, breedte } = legendItems(clusters, spec, dikte)
            const y = area.top + area.height + bump.axis.tickLength + bump.cursor.yearSize + 26
            const x0 = area.left + Math.max(0, (area.width - breedte) / 2)
            return (
              <g data-spec-path={`${spec.template}.legend`} transform={`translate(${x0}, ${y})`}>
                {items.map((item) => (
                  <g key={`leg-${item.naam}`}>
                    <circle
                      cx={item.x + bump.legend.swatch / 2}
                      cy={-bump.legend.size * 0.3}
                      r={bump.legend.swatch / 2}
                      fill={item.kleur}
                    />
                    <text
                      x={item.x + bump.legend.swatch + bump.legend.size * 0.5}
                      fontFamily={theme.fontBody}
                      fontSize={bump.legend.size}
                      fill={theme.ink}
                    >
                      {item.naam}
                    </text>
                  </g>
                ))}
                <text
                  x={extraX}
                  fontFamily={theme.fontBody}
                  fontSize={bump.legend.size}
                  fill={theme.ink}
                  opacity={0.7}
                >
                  {dikte}
                </text>
              </g>
            )
          })()}

        {bump.labels.show &&
          lijnen.map((lijn) => (
            <g key={`label-${lijn.naam}`} data-spec-path={`${spec.template}.labels`}>
              <text
                x={x(lijn.eerste.year) - bump.labels.offset}
                y={y(lijn.eerste.rank)}
                textAnchor="end"
                dominantBaseline="middle"
                fontFamily={theme.fontBody}
                fontSize={bump.labels.size}
                fill={theme.ink}
              >
                {lijn.naam}
              </text>
              <text
                x={(onthullen ? cursor.x : x(lijn.laatste.year)) + bump.labels.offset}
                y={onthullen ? volgLabel(lijn).y : y(lijn.laatste.rank)}
                textAnchor="start"
                dominantBaseline="middle"
                fontFamily={theme.fontBody}
                fontSize={bump.labels.size}
                fill={theme.ink}
              >
                {onthullen ? volgLabel(lijn).rank : lijn.laatste.rank}. {lijn.naam}
              </text>
            </g>
          ))}
      </svg>

      {hoveredRow && <Tooltip spec={spec} row={hoveredRow} x={pointer.x} y={pointer.y} />}

      {(spec.interaction?.controls ?? [])
        .filter((control) => control.type === 'timeSlider')
        .map((control) => (
          <TimeSlider key={control.type} spec={spec} control={control} timeline={timeline} />
        ))}

      <p
        style={{
          fontFamily: theme.fontBody,
          fontSize: bump.axis.size,
          color: theme.ink,
          opacity: 0.7,
          margin: '0.5rem 0 0',
        }}
      >
        Gerangschikt op {labelOf(spec, spec.layout.sortBy.field).toLowerCase()} — plek 1 bovenaan.
        Klik een lijn aan om hem vast te zetten.
      </p>
    </div>
  )
}
