import { group, mean } from 'd3'
import { templateSpec } from './template'
import { walkEncodings } from './scales'
import { sortRows, placeRows } from './layout'

/** Alle jaren in de dataset, oplopend. */
export function yearsOf(data, timeField) {
  return [...new Set(data.map((row) => row[timeField]))].sort((a, b) => a - b)
}

/**
 * Staat een pad in animation.interpolate? Alles wat er niet in staat
 * springt bij een jaarstap. Dat is bewust: transities overal maken een
 * chart wollig.
 */
export function interpolates(spec, path) {
  return spec.animation?.interpolate?.includes(path) ?? false
}

/**
 * Eén tussenrij tussen twee jaren. Alleen numerieke kolommen worden
 * gemengd; tekst (land, regio) komt uit de eerste rij.
 *
 * We interpoleren hier de DATA, niet het pad. De tussenrij gaat daarna
 * door dezelfde schalen en dezelfde lineRadial als een echte rij, dus
 * contour, steel en straks kleur blijven vanzelf onderling consistent.
 */
export function blendRow(a, b, t, onlyFields) {
  if (t === 0 || a === b) return a
  const out = { ...a }
  for (const key of onlyFields) {
    if (typeof a[key] === 'number' && typeof b[key] === 'number') {
      out[key] = a[key] + (b[key] - a[key]) * t
    }
  }
  return out
}

/**
 * Welke kolommen meemengen bij een jaarstap.
 *
 * Vroeger stond hier een handmatige tabel van spec-pad naar veld. Die moest
 * bij elke nieuwe encoding bijgewerkt worden, en dat gaat een keer mis: een
 * encoding die de tabel niet kent, springt dan stilletjes in plaats van te
 * interpoleren. Nu wordt de template-sectie afgelopen en levert elke
 * encoding onder een pad uit `animation.interpolate` zijn eigen veld.
 *
 * `$value` staat voor "de waarde van het huidige ankerpunt" en dekt dus
 * alle zes de velden tegelijk.
 */
export function blendedFields(spec) {
  const paths = spec.animation?.interpolate ?? []
  const fields = []

  walkEncodings(templateSpec(spec), '', (encoding, path) => {
    const covered = paths.some((p) => path === p || path.startsWith(`${p}.`))
    if (!covered) return
    if (encoding.field === '$value') fields.push(...spec.data.fields)
    else if (encoding.field) fields.push(encoding.field)
  })

  return fields
}

/**
 * De vaste volgorde van entiteiten bij layout.reorder = "fixed".
 * Retourneert null bij "perYear"; dan wordt er per jaar opnieuw gesorteerd.
 *
 * `fixedYear: "mean"` rangschikt op het gemiddelde over alle jaren. Dan is
 * geen enkel jaar bevoorrecht - wat past bij wat "fixed" wil zijn: een
 * stabiel referentiekader voor het hele decennium in plaats van de
 * momentopname van één jaar.
 */
export function fixedOrderOf(data, spec) {
  const { entity, time } = spec.data
  const { layout } = spec
  if (layout.reorder !== 'fixed') return null

  const rows =
    layout.fixedYear === 'mean'
      ? [...group(data, (row) => row[entity])].map(([name, rowsOfEntity]) => ({
          [entity]: name,
          [layout.sortBy.field]: mean(rowsOfEntity, (row) => row[layout.sortBy.field]),
        }))
      : data.filter((row) => row[time] === layout.fixedYear)

  return sortRows(rows, layout.sortBy).map((row) => row[entity])
}

/**
 * De plaatsing van élk jaar, één keer uitgerekend.
 *
 * Dit hangt alleen af van de data, de ordening en de sortering - niet van
 * waar de tijdslider staat. Het stond eerst binnen frameOf en werd dus per
 * beeldje opnieuw gedaan: de volgorde bepalen (groeperen en sorteren over
 * alle rijen) plus twee keer de hele dataset filteren, zestig keer per
 * seconde, en tijdens een ordeningswissel dubbel.
 */
export function placeAllYears(data, spec, years, layoutOverride) {
  const { entity, time } = spec.data
  const layout = layoutOverride ?? spec.layout

  // Bij "fixed" deelt deze volgorde de plekken uit; de getekende waarden
  // komen altijd uit het jaar zelf.
  const fixedOrder = fixedOrderOf(data, spec)

  const perYear = new Map()
  for (const row of data) {
    if (!perYear.has(row[time])) perYear.set(row[time], [])
    perYear.get(row[time]).push(row)
  }

  return years.map((year) => {
    const rows = perYear.get(year) ?? []
    const byEntity = new Map(rows.map((row) => [row[entity], row]))
    const ordered = fixedOrder
      ? fixedOrder.map((name) => byEntity.get(name)).filter(Boolean)
      : sortRows(rows, layout.sortBy)
    return placeRows(ordered, layout)
  })
}

/**
 * De plaatsing op dit moment in de animatie: opzoeken en, als we tussen
 * twee jaren in zitten, mengen.
 *
 * Posities worden per jaar berekend en dan geïnterpoleerd - niet gesorteerd
 * op de gemengde waarde. Zou je dat laatste doen, dan wisselen twee landen
 * van plek op het moment dat hun scores elkaar kruisen, en dat is een
 * sprong midden in de beweging.
 */
export function frameAt(frames, spec, index, ease) {
  const { entity } = spec.data
  if (!frames?.length) return { placed: [], width: 0, height: 0 }

  // De index binnen de lijst houden. Hij kan er even buiten vallen: de
  // klok en de plaatsingen worden door verschillende hooks bijgewerkt, en
  // als het aantal jaren krimpt (andere tijdkolom, andere dataset) staat de
  // slider één render lang nog op de oude, hogere stand. Zonder deze grens
  // is dat een crash op `undefined.placed` in plaats van één beeldje op de
  // laatste stand.
  const laatste = frames.length - 1
  const veilig = Number.isFinite(index) ? Math.min(Math.max(index, 0), laatste) : 0

  const i0 = Math.floor(veilig)
  const i1 = Math.min(i0 + 1, laatste)
  const t = i0 === i1 ? 0 : ease(veilig - i0)

  const a = frames[i0]
  if (t === 0) return a

  const blended = blendedFields(spec)
  const b = new Map(frames[i1].placed.map((p) => [p.row[entity], p]))
  const movePosition = interpolates(spec, 'layout.position')

  return {
    ...a,
    placed: a.placed.map((p) => {
      const q = b.get(p.row[entity])
      if (!q) return p
      return {
        row: blendRow(p.row, q.row, t, blended),
        x: movePosition ? p.x + (q.x - p.x) * t : p.x,
        y: movePosition ? p.y + (q.y - p.y) * t : p.y,
      }
    }),
  }
}

/**
 * Plaatsen en mengen in één stap. Handig in tests en scripts; de renderer
 * gebruikt de twee losse functies, zodat het plaatsen buiten de animatielus
 * blijft.
 */
export function frameOf(data, spec, years, index, ease, layoutOverride) {
  return frameAt(placeAllYears(data, spec, years, layoutOverride), spec, index, ease)
}

/**
 * Twee plaatsingen van dezelfde bloemen in elkaar overvloeien: het wisselen
 * van ordening is zelf een animatie.
 *
 * De waarden komen altijd uit `to`; alleen de posities en de afmetingen
 * van het canvas schuiven mee. Zo verandert er tijdens de wissel niets aan
 * wat een bloem zégt, alleen aan waar hij staat.
 */
export function blendFrames(from, to, t, entity) {
  if (!from || t >= 1) return to
  const before = new Map(from.placed.map((p) => [p.row[entity], p]))
  const lerp = (a, b) => a + (b - a) * t
  return {
    ...to,
    bands: t < 0.5 ? from.bands : to.bands,
    width: lerp(from.width, to.width),
    height: lerp(from.height, to.height),
    placed: to.placed.map((p) => {
      const q = before.get(p.row[entity])
      return q ? { ...p, x: lerp(q.x, p.x), y: lerp(q.y, p.y) } : p
    }),
  }
}
