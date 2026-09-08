import { memo, useId } from 'react'
import { anchorAngles, polarToXY, contourPath } from './geometry'
import { scaleAt } from './scales'

/**
 * Eén bloem: spaken + contour + steel + schaduwcontour + ankerpunten + label.
 *
 * Krijgt de schalen van buiten (Garden bouwt ze één keer uit de volledige
 * dataset). Deze component rekent zelf geen domeinen uit - dan zou elke
 * bloem zijn eigen schaal krijgen en is niets meer vergelijkbaar.
 *
 * Puur React. D3 levert alleen getallen, kleuren en de `d`-string.
 */

/**
 * Elk getekend element draagt het spec-pad dat het aanstuurt. Dat is een
 * label, geen logica: de renderer weet niet dat er een editor bestaat en
 * geeft niets terug. Een laag eromheen kan de klik opvangen en het pad
 * uitlezen - en bij een export is het meteen documentatie van wat waar
 * vandaan komt.
 */

/**
 * Gradient-id's moeten uniek zijn binnen het hele document. Ze afleiden
 * van de landnaam ging mis: de legenda tekent hetzelfde land als het
 * raster, dus stonden er twee <radialGradient> met hetzelfde id in één
 * SVG - met verschillende stops. De browser pakt de eerste, en één van de
 * twee bloemen kreeg stilletjes de verkeerde vulling.
 *
 * useId() geeft een id per component-instantie. De dubbele punten die
 * React erin zet halen we eruit: die zijn riskant in een url(#...)-
 * verwijzing en breken elke CSS-selector erop.
 */
function useGradientId() {
  return `grad${useId().replace(/:/g, '')}`
}

function Flower({
  datum,
  ghostDatum,
  spec,
  scales,
  x = 0,
  y = 0,
  scale = 1,
  showLabel = true,
}) {
  const { fields } = spec.data
  const { stem, contour, label } = spec.flower

  // "Vast óf gekoppeld" op de plek van gebruik: staat er een encoding in de
  // spec, dan komt de schaal daarvandaan; staat er een getal, dan is dat het.
  const radiusOf = scaleAt(scales, 'contour.radius', contour.radius)
  const strokeWidthOf = scaleAt(scales, 'contour.strokeWidth', contour.strokeWidth)
  const fillOuterOf = scaleAt(scales, 'contour.fill.stops', contour.fill.color)

  const angles = anchorAngles(fields.length)
  const anchors = fields.map((field, i) => ({
    field,
    angle: angles[i],
    radius: radiusOf(datum, i),
  }))

  const stemRadius = scaleAt(scales, 'stem.radius', stem.radius)(datum)
  const d = contourPath(anchors, contour)
  const maxRadius = Math.max(...anchors.map((a) => a.radius), stemRadius)

  const ghost = contour.ghost
  const ghostPath =
    ghost?.show && ghostDatum
      ? contourPath(
          fields.map((field, i) => ({
            angle: angles[i],
            radius: radiusOf(ghostDatum, i),
          })),
          contour
        )
      : null

  const isGradient = contour.fill.type === 'gradient'
  const fillId = useGradientId()
  const fill = isGradient ? `url(#${fillId})` : fillOuterOf(datum)

  return (
    // `data-drag-origin` zegt: het lokale nulpunt van deze groep is het
    // middelpunt van radiale gebaren. Een laag eromheen kan daarmee een
    // sleepafstand terugrekenen naar een spec-waarde, zonder dat dit
    // component iets van bewerken hoeft te weten. Het staat op de buitenste
    // groep, want de grijpvlakken hangen daaronder en niet onder de
    // geschaalde binnengroep.
    <g transform={`translate(${x}, ${y})`} data-drag-origin="">
      {/*
        Alleen de geometrie schaalt. Het label staat erbuiten en houdt zijn
        maat uit de spec: 11px wordt bij schaal 0,5 onleesbaar, en dan is
        verbergen eerlijker dan onleesbaar afdrukken.
      */}
      <g transform={`scale(${scale})`}>
      {isGradient && (
        <defs>
          {/*
            De gradient begint bij de rand van de steel, niet in het midden.
            De steel dekt de binnenste derde van de bloem af; zou de lichte
            stop daar liggen, dan zie je van het kleurverloop alleen het
            donkere eind en encodeert de gradient niets meer.
          */}
          <radialGradient id={fillId}>
            <stop offset={`${(stemRadius / maxRadius) * 100}%`} stopColor={contour.fill.stops.range[0]} />
            <stop offset="100%" stopColor={fillOuterOf(datum)} />
          </radialGradient>
        </defs>
      )}

      {contour.spokes.show &&
        anchors.map((a) => {
          const [x2, y2] = polarToXY(a.angle, a.radius)
          return (
            <line
              key={`spoke-${a.field}`}
              data-spec-path="flower.contour.spokes"
              x1={0}
              y1={0}
              x2={x2}
              y2={y2}
              stroke={contour.spokes.color}
              strokeOpacity={contour.spokes.opacity}
              strokeDasharray={contour.spokes.dash.join(' ')}
            />
          )
        })}

      <path
        d={d}
        data-spec-path="flower.contour"
        fill={fill}
        fillOpacity={contour.opacity}
        stroke={contour.strokeColor}
        strokeWidth={strokeWidthOf(datum)}
        strokeLinejoin="round"
        style={{ mixBlendMode: contour.blendMode }}
      />

      <circle
        r={stemRadius}
        data-spec-path="flower.stem"
        fill={stem.fill}
        fillOpacity={stem.opacity}
      />

      {ghostPath && (
        // Bóven de vulling, niet erachter: een referentielijn die je alleen
        // buiten de bloem zou zien, vertelt de helft van het verhaal. Nu zie
        // je ook waar de bloem is gekrompen.
        <path
          d={ghostPath}
          data-spec-path="flower.contour.ghost"
          fill="none"
          stroke={ghost.stroke}
          strokeWidth={ghost.strokeWidth}
          strokeOpacity={ghost.opacity}
          strokeDasharray={ghost.dash.join(' ')}
        />
      )}

      {contour.anchorDots.show &&
        anchors.map((a) => {
          const [cx, cy] = polarToXY(a.angle, a.radius)
          return (
            <circle
              key={`dot-${a.field}`}
              data-spec-path="flower.contour.radius"
              data-spec-field={a.field}
              cx={cx}
              cy={cy}
              r={contour.anchorDots.radius}
              fill={contour.anchorDots.fill}
            />
          )
        })}

      </g>

      {/*
        Onzichtbare, ruimere grijpvlakken. Een stip van 2,5px is niet te
        pakken, en het gebaar hoort bij het ankerpunt, niet bij de stip.
      */}
      {contour.anchorDots.show &&
        anchors.map((a) => {
          const [cx, cy] = polarToXY(a.angle, a.radius)
          return (
            <circle
              key={`grip-${a.field}`}
              data-spec-path="flower.contour.radius"
              data-spec-field={a.field}
              data-drag="radial"
              data-drag-target="flower.contour.radius.range.1"
              cx={cx * scale}
              cy={cy * scale}
              r={9}
              fill="transparent"
              pointerEvents="all"
            />
          )
        })}

      {label.show && showLabel && (
        <text
          x={0}
          y={maxRadius * scale + label.offset}
          data-spec-path="flower.label"
          textAnchor="middle"
          fontFamily={label.font}
          fontSize={label.size}
          fill={label.color}
        >
          {datum[label.field]}
        </text>
      )}
    </g>
  )
}

/**
 * memo helpt bij hover en bij bewerken: dan veranderen de props van een
 * bloem niet als je over de buurman zweeft of aan een schuif elders trekt.
 *
 * Tijdens het afspelen helpt het NIET, en dat is geen omissie maar een
 * gevolg: elk beeldje is `datum` een vers gemengd object, dus elke bloem
 * hertekent hoe dan ook. Zou je dat willen veranderen, dan moeten de props
 * primitief worden (de stralen als losse getallen in plaats van een rij),
 * en dat is pas de moeite waard als het tekenen zelf te traag wordt.
 *
 * Gemeten bij 216 bloemen: het rekenwerk per beeldje is 0,12ms en het
 * tekenen 15ms. De winst zit dus in minder tekenen, niet in minder rekenen.
 */
export default memo(Flower)
