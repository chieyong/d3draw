import { line, curveBumpX, curveMonotoneX, curveLinear, ascending } from 'd3'
import { sortRows } from './layout'
import { plotBox } from './plot'
import { yearsOf } from './timeline'

/**
 * Curves voor open lijnen. De bloem gebruikt gesloten varianten; hier hoort
 * juist een curve die netjes van punt naar punt loopt. curveBumpX geeft de
 * klassieke bump-vorm: vlak bij de jaren, een S-bocht ertussen.
 */
const CURVES = { curveBumpX, curveMonotoneX, curveLinear }
export const BUMP_CURVE_TYPES = Object.keys(CURVES)

/**
 * De rangorde per jaar, berekend en niet uit een kolom gelezen.
 *
 * Hergebruikt sortRows uit layout.js: waarop gerangschikt wordt staat in
 * layout.sortBy, net als bij het raster. Zo kun je op elk veld een bump
 * chart maken zonder dat er een kant-en-klare rangkolom in de data hoeft
 * te zitten - en blijft de betekenis van "eerste plek" dezelfde als daar.
 */
export function ranksByYear(data, spec) {
  const { entity, time } = spec.data
  const years = yearsOf(data, time)
  const perYear = new Map()

  for (const year of years) {
    const rows = data.filter((row) => row[time] === year)
    const ordered = sortRows(rows, spec.layout.sortBy)
    perYear.set(
      year,
      new Map(ordered.map((row, i) => [row[entity], { rank: i + 1, row }]))
    )
  }
  return { years, perYear, count: perYear.get(years[0])?.size ?? 0 }
}

/**
 * Het tekenvlak. De bump chart kent geen raster van cellen; hij heeft één
 * gedeeld assenstelsel met ruimte opzij voor de namen aan beide uiteinden.
 */
/**
 * Wat er minimaal in elke marge moet passen. De jaartallen staan bóven het
 * vlak en het cursorjaar eronder; is de marge kleiner dan die tekst, dan
 * valt hij buiten het canvas.
 */
function minimum(spec) {
  const { axis, cursor, labels } = spec.bump
  return {
    top: axis?.show ? axis.tickLength + axis.size + 10 : 4,
    bottom: (axis?.show ? axis.tickLength : 0) + (cursor?.show ? cursor.yearSize + 14 : 6),
    left: labels?.show ? labels.size * 3 : 4,
    right: labels?.show ? labels.size * 3 : 4,
  }
}

export function plotArea(spec) {
  return plotBox(spec.layout.fit, spec.bump.plot, minimum(spec))
}

/** Eén lijn per entiteit, van het eerste tot het laatste jaar. */
export function bumpLines(data, spec, area) {
  const { entity } = spec.data
  const { years, perYear, count } = ranksByYear(data, spec)

  const x = (year) =>
    area.left + (years.indexOf(year) / Math.max(1, years.length - 1)) * area.width
  const y = (rank) =>
    area.top + ((rank - 1) / Math.max(1, count - 1)) * area.height

  const namen = [...(perYear.get(years[0])?.keys() ?? [])].sort(ascending)

  const lijnen = namen.map((naam) => {
    const punten = years
      .map((year) => {
        const plek = perYear.get(year)?.get(naam)
        return plek ? { year, rank: plek.rank, row: plek.row } : null
      })
      .filter(Boolean)
    return { naam, punten, eerste: punten[0], laatste: punten[punten.length - 1] }
  })

  return { years, lijnen, x, y, count }
}

/** De `d`-string van één lijn. */
export function bumpPath(punten, { curve }, x, y) {
  const factory = CURVES[curve] ?? curveBumpX
  return line()
    .x((p) => x(p.year))
    .y((p) => y(p.rank))
    .curve(factory)(punten)
}

/**
 * De cursorstand tussen twee jaren, uitgedrukt in de parameter van de
 * curve zelf.
 *
 * De stip moet ÓP het lint liggen, ook halverwege. curveBumpX tekent per
 * segment een bezier met beide controlepunten op de horizontale helft;
 * lineair interpoleren zou de stip ernaast leggen, het meest zichtbaar
 * midden in een kruising. Door dezelfde parameter `s` te gebruiken voor
 * zowel x als y volgt de stip de curve exact.
 *
 * Voor curveLinear is de bezier een rechte lijn en valt het samen met
 * lineair interpoleren. Voor curveMonotoneX is dit een benadering: die
 * curve hangt af van de buurpunten en is niet per segment te evalueren.
 */
export function cursorSegment(years, index) {
  const i0 = Math.max(0, Math.min(Math.floor(index), years.length - 1))
  const i1 = Math.min(i0 + 1, years.length - 1)
  return { i0, i1, s: i0 === i1 ? 0 : Math.min(Math.max(index - i0, 0), 1) }
}

const bumpX = (x0, x1, s) =>
  x0 * (1 - s) ** 3 + 3 * ((x0 + x1) / 2) * s * (1 - s) + x1 * s ** 3
const bumpY = (y0, y1, s) => y0 * (1 - s) ** 2 * (1 + 2 * s) + y1 * s ** 2 * (3 - 2 * s)

export function cursorPoint(a, b, s, curve) {
  if (curve === 'curveBumpX') return { x: bumpX(a.x, b.x, s), y: bumpY(a.y, b.y, s) }
  return { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s }
}
