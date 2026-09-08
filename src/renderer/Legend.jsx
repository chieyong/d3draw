import Flower from './Flower'
import { anchorLabelLayout } from './anchorLabels'
import { sizeCaption } from './captions'
import { scaleAt } from './scales'

/**
 * De sleutelbloem: één uitvergroot voorbeeldexemplaar met de zes
 * factornamen aan hun ankerpunt. Je leest hem één keer en daarna lees je
 * de hele tuin.
 *
 * Hoort binnen de renderer, niet in het editor-omhulsel: een klant die de
 * export krijgt, krijgt anders een visualisatie zonder uitleg.
 */

/** Welk land dient als voorbeeld. "median" pakt de middelste van dat jaar. */
export function pickSample(rows, sample, sortField, entity = 'country') {
  if (sample !== 'median') {
    return rows.find((row) => row[entity] === sample) ?? rows[0]
  }
  const sorted = [...rows].sort((a, b) => a[sortField] - b[sortField])
  return sorted[Math.floor(sorted.length / 2)]
}

export default function Legend({ spec, scales, sample, x = 0, y = 0 }) {
  const { legend, flower, theme } = spec
  const { scale, gap, annotate } = legend

  const labels = anchorLabelLayout(spec, scales, sample, scale, gap, legend.fontSize)

  const stemRadius = scaleAt(scales, 'stem.radius', spec.flower.stem.radius)(sample) * scale
  const bottom = Math.max(...labels.map((l) => l.ty)) + legend.fontSize

  return (
    <g data-spec-path="legend" transform={`translate(${x}, ${y})`}>
      <Flower
        datum={sample}
        spec={spec}
        scales={scales}
        scale={scale}
        showLabel={false}
      />

      {annotate.anchors &&
        labels.map((l) => (
          <g key={`legend-${l.field}`}>
            <line
              x1={l.px}
              y1={l.py}
              x2={l.tx}
              y2={l.ty}
              stroke={legend.color}
              strokeOpacity={0.4}
            />
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

      <text
        x={0}
        y={bottom + legend.fontSize * 2}
        textAnchor="middle"
        fontFamily={theme.fontDisplay}
        fontSize={legend.fontSize * 1.5}
        fill={legend.color}
      >
        {sample[spec.data.entity]} · {sample[spec.data.time]}
      </text>

      {annotate.stem && (
        // Een swatch onder de bloem in plaats van een leader-lijn naar de
        // steel: die lijn liep links tussen "Vertrouwen" en "Vrijgevigheid"
        // door en botste met beide labels.
        <g transform={`translate(0, ${bottom + legend.fontSize * 3.6})`}>
          <circle
            cx={-legend.fontSize * 4.2}
            cy={-legend.fontSize * 0.35}
            r={legend.fontSize * 0.45}
            fill={flower.stem.fill}
            fillOpacity={flower.stem.opacity}
          />
          <text
            x={-legend.fontSize * 3.2}
            y={0}
            textAnchor="start"
            fontFamily={theme.fontBody}
            fontSize={legend.fontSize}
            fill={flower.stem.fill}
          >
            {annotate.stem}
          </text>
        </g>
      )}

      {sizeCaption(spec) && (
        <text
          x={0}
          y={bottom + legend.fontSize * 5.4}
          textAnchor="middle"
          fontFamily={theme.fontBody}
          fontSize={legend.fontSize}
          fill={legend.color}
          opacity={0.75}
        >
          {sizeCaption(spec)}
        </text>
      )}
    </g>
  )
}
