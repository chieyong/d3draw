import { useCallback, useId, useMemo, useRef } from 'react'
import Flower from './Flower'
import Legend, { pickSample } from './Legend'
import TimeSlider from './TimeSlider'
import Tooltip from './Tooltip'
import Compare from './Compare'
import Select from './Select'
import { useTween } from './useTween'
import { useView } from './useView'
import { opacityOf, pinnedRows, togglePin } from './highlight'
import { buildScales, scaleAt } from './scales'
import { line, curveCatmullRom } from 'd3'
import { LAYOUT_TYPES, fitFrame } from './layout'
import { orderCaption, sizeCaption } from './captions'
import { yearsOf, placeAllYears, frameAt, blendFrames } from './timeline'
import { withDerived, referenceRows } from './derive'
import { templateSpec } from './template'
import { usePointer } from './usePointer'
import { useTimeline, easeOf } from './useTimeline'

/**
 * De bloem-template: raster van bloemen, één beeldje per jaar.
 *
 * Dit was ooit "de renderer". Bij het bouwen van een tweede grafiektype
 * bleek het de template te zijn: de host eromheen (valideren, vangnet,
 * kiezen welk type) staat nu in Chart.jsx.
 *
 * `data` is de VOLLEDIGE dataset, alle jaren. Niet de rijen van één jaar.
 * Dat is bewust: de schaaldomeinen moeten over alle jaren berekend worden,
 * en als de renderer alleen het huidige jaar zou krijgen, kan hij die regel
 * niet naleven. Welk jaar getekend wordt, bepaalt de spec.
 *
 * Geen enkele afhankelijkheid van de editor: geen selectie, geen hover-naar-
 * inspector, geen undo. Deze component werkt standalone in elk React-project.
 */

/**
 * Waar de legenda staat en hoeveel ruimte de tuin daardoor opschuift.
 * Zelfde registry-vorm als PLACERS in layout.js: een nieuwe positie is een
 * functie erbij, geen verbouwing.
 */
const LEGEND_SLOTS = {
  left: (box, grid, headerHeight) => {
    const height = Math.max(box.height, grid.height + headerHeight)
    return {
      // Verticaal in het hele canvas centreren, niet in de eigen box:
      // anders hangt de legenda bovenin terwijl de tuin doorloopt.
      legend: { x: box.width / 2, y: height / 2 },
      grid: { x: box.width, y: headerHeight },
      width: box.width + grid.width,
      height,
    }
  },
}

export default function Garden({ spec, data: rawData }) {
  const { entity, time } = spec.data
  const { legend, theme } = spec

  // De toestand van de kijker, niet van de spec. Zie useView.js.
  const view = useView(spec)

  // De ordening die nú getoond wordt: de spec levert de standaard, de
  // kijker mag hem wisselen zonder de spec te raken.
  const layout = useMemo(
    () => ({ ...spec.layout, type: view.layoutType }),
    [spec.layout, view.layoutType]
  )

  // Afgeleide kolommen ($delta) één keer, vóór alles. Daarna is $delta een
  // gewone kolom: schalen, blenden en sorteren werken er vanzelf op.
  // Afgeleide kolommen hangen alleen aan data.fields/entity/time/scoreField.
  // Dankzij het structuurdelen in overrides.js houdt spec.data zijn
  // identiteit bij elke wijziging elders, dus dit rekent niet opnieuw als
  // je een kleur verandert.
  const data = useMemo(() => withDerived(rawData, spec), [rawData, spec.data])

  // Schalen hangen aan de hele dataset, niet aan wat er nu op het scherm
  // staat. Alleen een nieuwe spec of nieuwe data bouwt ze opnieuw.
  const template = templateSpec(spec)
  const scales = useMemo(() => buildScales(spec, data), [template, spec.data, data])

  const ghosts = useMemo(() => {
    const ghost = template.contour.ghost
    return ghost?.show ? referenceRows(data, spec, ghost.reference) : null
  }, [data, template.contour.ghost, spec.data])

  const years = useMemo(() => yearsOf(data, time), [data, time])
  const timeline = useTimeline(spec, years)
  const ease = easeOf(spec)

  // De rijen van dit moment in de animatie, mét positie. Bij een heel jaar
  // is dit gewoon dat jaar; ertussenin zijn het tussenrijen.
  // Van ordening wisselen is zelf een animatie: twee plaatsingen van
  // dezelfde bloemen worden in elkaar overgevloeid.
  const switching = useTween(layout.type, spec.animation?.durationPerStep ?? 900)

  // Het doosje waar de tuin in moet passen. De legenda en de kop nemen
  // hun deel; wat overblijft is voor de bloemen.
  const fitBox = useMemo(() => {
    if (!layout.fit) return null
    return {
      width: layout.fit.width - (legend?.show ? legend.box.width : 0),
      height: layout.fit.height - (layout.header?.show ? layout.header.height : 0),
    }
  }, [layout.fit, layout.header, legend])

  // De plaatsing per jaar staat los van waar de slider staat, dus die
  // hoort buiten de animatielus. Alleen het opzoeken en mengen gebeurt per
  // beeldje.
  const frames = useMemo(
    () => placeAllYears(data, spec, years, layout),
    [data, spec.data, spec.layout, years, layout]
  )
  const framesFrom = useMemo(
    () =>
      switching.from
        ? placeAllYears(data, spec, years, { ...layout, type: switching.from })
        : null,
    [data, spec.data, spec.layout, years, layout, switching.from]
  )

  const frame = useMemo(() => {
    const to = frameAt(frames, spec, timeline.index, ease)
    if (!framesFrom) return fitFrame(to, fitBox)
    const from = frameAt(framesFrom, spec, timeline.index, ease)
    // Passend maken ná het overvloeien: anders springt de schaal op het
    // moment dat de ene ordening de andere wordt.
    return fitFrame(blendFrames(from, to, ease(switching.t), entity), fitBox)
  }, [frames, framesFrom, spec, timeline.index, ease, switching.t, entity, fitBox])

  const placed = frame.placed

  // Het voorbeeldland wordt één keer gekozen, bij het startjaar. Zou de
  // legenda per frame opnieuw de mediaan pakken, dan wisselt hij tijdens
  // het afspelen van land - de sleutel moet juist stil blijven staan.
  const sampleCountry = useMemo(() => {
    if (!legend?.show) return null
    const atStart = data.filter((row) => row[time] === spec.preview[time])
    return pickSample(atStart, legend.sample, layout.sortBy.field, entity)[entity]
  }, [data, time, spec.preview, legend, layout.sortBy.field, entity])

  // ...maar zijn wáárden volgen het huidige frame, zodat de sleutelbloem
  // hetzelfde doet als de tuin eromheen.
  const sample = placed.find((p) => p.row[entity] === sampleCountry)?.row

  const spiralGuide = layout.spiral?.guide
  const guide = useMemo(() => {
    if (!spiralGuide?.show || layout.type !== 'spiral') return null
    const path = line()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveCatmullRom.alpha(0.5))(frame.placed)
    return {
      d: path,
      stroke: spiralGuide.stroke,
      width: spiralGuide.width,
      // Bij het wisselen van ordening vervaagt de lijn mee, anders zou hij
      // als zigzag door een raster lopen.
      opacity: spiralGuide.opacity * (switching.from ? ease(switching.t) : 1),
    }
  }, [spiralGuide, layout.type, frame.placed, switching.from, switching.t, ease])

  const grid = { width: frame.width, height: frame.height }
  const header = layout.header?.show ? layout.header : null
  const headerHeight = header ? header.height : 0
  const caption = header ? orderCaption(spec, years) : null

  const slot = legend?.show ? LEGEND_SLOTS[legend.position] : null
  if (legend?.show && !slot) {
    throw new Error(
      `legend.position "${legend.position}" bestaat nog niet. Beschikbaar: ${Object.keys(LEGEND_SLOTS).join(', ')}.`
    )
  }
  const canvas = slot
    ? slot(legend.box, grid, headerHeight)
    : { grid: { x: 0, y: headerHeight }, width: grid.width, height: grid.height + headerHeight }

  const controls = spec.interaction?.controls ?? []

  // Interactietoestand blijft binnen de renderer. Er gaat niets naar
  // buiten: geen callbacks, geen selectie die een editor kan lezen.
  const { hovered, setHovered, pinned, setPinned } = view
  const { ref: wrapper, pointer, track: onMove, set: setPointer } = usePointer()
  const titleId = useId()
  const descId = useId()

  const maxPins = spec.interaction?.click?.max ?? 0
  const groupField = spec.interaction?.hover?.groupField

  // Het trefvlak volgt de bloem, niet de cel. Een schijf ter grootte van de
  // hele cel raakt zijn buren, waardoor er geen lege ruimte tussen bloemen
  // bestaat en de tooltip van het ene land rechtstreeks in het andere
  // overgaat zonder ooit te verdwijnen.
  const hitPadding = spec.interaction?.hover?.hitPadding ?? 6
  const hitRadius = useCallback(
    (row, scale) =>
      Math.min(
        Math.max(...spec.data.fields.map((f, i) => scaleAt(scales, 'contour.radius', template.contour.radius)(row, i))) * scale +
          hitPadding,
        (layout.cellSize * scale) / 2
      ),
    [scales, spec.data.fields, hitPadding, layout.cellSize]
  )

  const compared = pinnedRows(placed, spec, pinned)
  const hoveredRow = hovered && placed.find((p) => p.row[entity] === hovered.name)?.row

  return (
    <div ref={wrapper} style={{ maxWidth: canvas.width, position: 'relative' }}>
      <svg
        onPointerMove={hovered ? onMove : undefined}
        onPointerLeave={() => setHovered(null)}
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
        width="100%"
        style={{ background: theme.background, display: 'block' }}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        {/*
          Zonder titel en beschrijving is dit voor een schermlezer een lege
          doos. Beide komen uit de spec en uit dezelfde afleiding als het
          bijschrift, dus ze kunnen niet uit de pas raken met wat er
          getekend wordt.
        */}
        <title id={titleId}>{spec.meta.title}</title>
        <desc id={descId}>
          {[spec.meta.subtitle, orderCaption(spec, years), sizeCaption(spec)]
            .filter(Boolean)
            .join('. ')}
        </desc>

        {compared.length > 0 ? (
          <Compare
            spec={spec}
            scales={scales}
            rows={compared}
            x={canvas.legend.x}
            y={canvas.legend.y}
          />
        ) : sample && (
          <Legend
            spec={spec}
            scales={scales}
            sample={sample}
            x={canvas.legend.x}
            y={canvas.legend.y}
          />
        )}

        {caption && (
          // Boven het raster, want het beschrijft het raster. De tekst komt
          // uit orderCaption() en volgt dus layout.sortBy.
          <text
            data-spec-path="layout.header"
            x={canvas.grid.x + layout.margin}
            y={canvas.grid.y - header.fontSize}
            fontFamily={theme.fontBody}
            fontSize={header.fontSize}
            fill={legend?.color ?? theme.ink}
            opacity={0.75}
          >
            {caption}
          </text>
        )}

        <g transform={`translate(${canvas.grid.x}, ${canvas.grid.y})`}>
          {guide && (
            // De spiraal zelf zichtbaar maken. Zonder deze lijn is een
            // spiraal een strooisel: je ziet 24 bloemen maar niet dat ze
            // een volgorde vormen van het midden naar buiten.
            <path
              d={guide.d}
              data-spec-path="layout.spiral.guide"
              fill="none"
              stroke={guide.stroke}
              strokeWidth={guide.width}
              strokeOpacity={guide.opacity}
              strokeLinecap="round"
            />
          )}

          {frame.bands?.map((band) => (
            <text
              key={`band-${band.name}`}
              data-spec-path="layout.byRegion"
              x={band.x}
              y={band.y}
              fontFamily={theme.fontBody}
              fontSize={header?.fontSize ?? 12}
              fill={legend?.color ?? theme.ink}
              opacity={0.8}
            >
              {band.name} · {band.count}
            </text>
          ))}
          {placed.map(({ row, x, y }) => (
            // key = de entiteit, niet de index. Bij een herordening (ander
            // jaar, andere sortering) hergebruikt React dan de node van
            // hetzelfde land in plaats van die van dezelfde rasterplek.
            <g
              key={row[entity]}
              data-spec-path="flower"
              data-spec-entity={row[entity]}
              opacity={opacityOf(row, spec, { hovered, pinned })}
              onPointerEnter={(event) => {
                setHovered({ name: row[entity], group: groupField ? row[groupField] : null })
                onMove(event)
              }}
              onPointerLeave={() => setHovered(null)}
              onClick={maxPins ? () => setPinned((was) => togglePin(was, row[entity], maxPins)) : undefined}
              style={{ cursor: maxPins ? 'pointer' : 'default' }}
              // Met het toetsenbord bereikbaar: tabben zet de tooltip aan
              // bij de bloem zelf, Enter of spatie zet hem vast. Zonder dit
              // is pin-compare alleen met een muis te bedienen.
              tabIndex={0}
              role={maxPins ? 'button' : 'img'}
              aria-label={`${row[entity]}${pinned.includes(row[entity]) ? ' (vastgezet)' : ''}`}
              aria-pressed={maxPins ? pinned.includes(row[entity]) : undefined}
              onFocus={() => {
                setHovered({ name: row[entity], group: groupField ? row[groupField] : null })
                const box = wrapper.current?.getBoundingClientRect()
                const svg = wrapper.current?.querySelector('svg')?.getBoundingClientRect()
                if (box && svg) {
                  const k = svg.width / canvas.width
                  setPointer({ x: (canvas.grid.x + x) * k, y: svg.top - box.top + (canvas.grid.y + y) * k })
                }
              }}
              onBlur={() => setHovered(null)}
              onKeyDown={(event) => {
                if (!maxPins || (event.key !== 'Enter' && event.key !== ' ')) return
                event.preventDefault()
                setPinned((was) => togglePin(was, row[entity], maxPins))
              }}
            >
              {/*
                Een onzichtbare schijf als trefvlak. De bloem zelf heeft
                gaten tussen de spaken; zonder dit zou de hover flikkeren
                zodra je over een inham beweegt.
              */}
              <circle cx={x} cy={y} r={hitRadius(row, frame.scale)} fill="transparent" pointerEvents="all" />
              <Flower
                datum={row}
                ghostDatum={ghosts?.get(row[entity])}
                spec={spec}
                scales={scales}
                x={x}
                y={y}
                scale={frame.scale}
                showLabel={frame.scale >= (template.label.minScale ?? 0)}
              />
            </g>
          ))}
        </g>
      </svg>

      {hoveredRow && (
        <Tooltip spec={spec} row={hoveredRow} x={pointer.x} y={pointer.y} />
      )}

      {controls
        .filter((control) => control.type === 'timeSlider')
        .map((control) => (
          <TimeSlider key={control.type} spec={spec} control={control} timeline={timeline} />
        ))}

      {controls
        .filter((control) => control.type === 'select')
        .map((control) => (
          <Select
            key={control.binds}
            spec={spec}
            control={control}
            value={view.readBound(control.binds) ?? ''}
            options={(control.options ?? LAYOUT_TYPES).map((value) => ({
              value,
              label: control.optionLabels?.[value] ?? value,
            }))}
            onChange={view.setBound}
          />
        ))}
    </div>
  )
}
