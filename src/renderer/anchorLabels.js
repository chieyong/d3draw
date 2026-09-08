import { anchorAngles, polarToXY } from './geometry'
import { labelOf } from './captions'
import { scaleAt } from './scales'

/**
 * Een label rond een cirkel moet van de klok weg wijzen, anders loopt het
 * over de vorm heen. Rechts van het midden begint de tekst bij het punt,
 * links eindigt hij erbij, en boven- en onderaan (waar x bijna nul is) is
 * centreren het enige dat niet scheef oogt.
 */
function anchorSide(x) {
  if (x > 1) return 'start'
  if (x < -1) return 'end'
  return 'middle'
}

/**
 * De zes veldnamen op hun plek rond een bloem, met een leaderlijn.
 * Gedeeld door de legenda en het vergelijkpaneel: één berekening, dus de
 * twee kunnen niet uit de pas gaan lopen.
 */
export function anchorLabelLayout(spec, scales, row, scale, gap, fontSize) {
  const { fields } = spec.data
  const angles = anchorAngles(fields.length)
  const radiusOf = scaleAt(scales, 'contour.radius', spec.flower.contour.radius)

  return fields.map((field, i) => {
    const radius = radiusOf(row, i) * scale
    const [px, py] = polarToXY(angles[i], radius)
    const [tx, ty] = polarToXY(angles[i], radius + gap)
    const side = anchorSide(tx)
    return {
      field,
      text: labelOf(spec, field),
      px,
      py,
      tx,
      // Boven- en onderaan zou de tekst op het ankerpunt vallen; daar
      // duwen we hem nog een regelhoogte weg van het midden.
      ty: side === 'middle' ? ty + Math.sign(ty) * fontSize : ty,
      anchor: side,
    }
  })
}
