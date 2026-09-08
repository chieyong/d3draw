import { contourPath, anchorAngles } from './geometry'
import { anchorLabelLayout } from './anchorLabels'
import { scaleAt } from './scales'

/**
 * Vergelijkmodus: de vastgezette bloemen over elkaar heen, elk in een
 * eigen kleur. Alleen contouren, geen vulling - drie gevulde vormen over
 * elkaar geven modder in plaats van een vergelijking.
 *
 * Neemt de plek van de sleutelbloem in. Dat is dezelfde ruimte met
 * dezelfde functie: uitleggen wat je ziet.
 */
export default function Compare({ spec, scales, rows, x, y }) {
  const { legend, theme, data } = spec
  const { colors, strokeWidth, stemStrokeWidth } = spec.interaction.click
  const scale = legend.scale
  const radiusOf = scaleAt(scales, 'contour.radius', spec.flower.contour.radius)
  const stemOf = scaleAt(scales, 'stem.radius', spec.flower.stem.radius)
  const angles = anchorAngles(data.fields.length)

  // De labelring hangt aan de grootste bloem, zodat geen enkele contour
  // over zijn eigen labels heen valt.
  const widest = rows.reduce((best, row) => {
    const reach = Math.max(...data.fields.map((f, i) => radiusOf(row, i)))
    return reach > best.reach ? { row, reach } : best
  }, { row: rows[0], reach: -Infinity }).row

  const labels = anchorLabelLayout(spec, scales, widest, scale, legend.gap, legend.fontSize)
  const bottom = Math.max(...labels.map((l) => l.ty)) + legend.fontSize

  return (
    <g transform={`translate(${x}, ${y})`}>
      {labels.map((l) => (
        <g key={`cmp-label-${l.field}`}>
          <line x1={l.px} y1={l.py} x2={l.tx} y2={l.ty} stroke={legend.color} strokeOpacity={0.3} />
          <text
            x={l.tx}
            y={l.ty}
            textAnchor={l.anchor}
            dominantBaseline="middle"
            fontFamily={theme.fontBody}
            fontSize={legend.fontSize}
            fill={legend.color}
          >
            {l.text}
          </text>
        </g>
      ))}

      {rows.map((row, i) => (
        <path
          key={`cmp-${row[data.entity]}`}
          d={contourPath(
            data.fields.map((field, k) => ({
              angle: angles[k],
              radius: radiusOf(row, k) * scale,
            })),
            spec.flower.contour
          )}
          fill="none"
          stroke={colors[i % colors.length]}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ))}

      {/*
        De stelen als concentrische ringen in dezelfde kleur. Ze verschillen
        genoeg in straal om leesbaar te blijven, en zonder deze zou het
        paneel juist het kenmerk verzwijgen dat twee landen het duidelijkst
        onderscheidt: hoeveel van hun score onverklaard blijft.
      */}
      {rows.map((row, i) => (
        <circle
          key={`cmp-stem-${row[data.entity]}`}
          r={stemOf(row) * scale}
          fill="none"
          stroke={colors[i % colors.length]}
          strokeWidth={stemStrokeWidth}
          strokeDasharray="2 2"
        />
      ))}

      {rows.map((row, i) => (
        <g key={`cmp-key-${row[data.entity]}`} transform={`translate(0, ${bottom + legend.fontSize * (2.4 + i * 1.6)})`}>
          <circle cx={-legend.fontSize * 5} cy={-legend.fontSize * 0.35} r={legend.fontSize * 0.4} fill={colors[i % colors.length]} />
          <text
            x={-legend.fontSize * 4}
            textAnchor="start"
            fontFamily={theme.fontBody}
            fontSize={legend.fontSize}
            fill={legend.color}
          >
            {row[data.entity]}
          </text>
        </g>
      ))}
    </g>
  )
}
