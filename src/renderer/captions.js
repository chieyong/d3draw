import { templateSpec } from './template'
/**
 * Teksten die de visualisatie over zichzelf vertelt.
 *
 * Ze worden AFGELEID uit de spec, niet met de hand ingetypt. Zet je
 * layout.sortBy op een ander veld, dan verandert het bijschrift mee. Een
 * ingetypte tekst zou blijven staan en gaan liegen zodra iemand in de
 * inspector iets wijzigt - en dat is precies het soort fout dat niemand
 * opmerkt, omdat er iets plausibels staat.
 */

/** Leesbare naam van een kolom; valt terug op de kolomnaam zelf. */
export function labelOf(spec, field) {
  return spec.data.labels?.[field] ?? field
}

/**
 * Beschrijft de volgorde van het raster. De leesrichting is links naar
 * rechts, boven naar onder, dus de eerste plek is linksboven.
 *
 * `years` is optioneel en wordt alleen gebruikt om bij fixedYear "mean"
 * de periode te kunnen noemen.
 */
/**
 * Waar de eerste plek ligt, per ordening. Zonder dit zou het bijschrift
 * "hoogste linksboven" blijven zeggen ook bij een spiraal, waar links-
 * boven niets betekent.
 */
const PLACEMENT = {
  grid: (spec, direction) => `${direction} linksboven`,
  spiral: (spec, direction) => `${direction} in het midden`,
  byRegion: (spec, direction) =>
    `gegroepeerd per ${labelOf(spec, spec.layout.byRegion.groupField).toLowerCase()}, ` +
    `${direction} binnen elke groep`,
}

/**
 * Beschrijft de ordening van de tuin: waarop is gerangschikt, waar ligt de
 * eerste plek, en staan de plekken vast of niet.
 *
 * `years` is optioneel en wordt alleen gebruikt om bij fixedYear "mean"
 * de periode te kunnen noemen.
 */
export function orderCaption(spec, years) {
  const { header, sortBy, reorder, fixedYear, type } = spec.layout
  if (header?.note) return header.note
  if (!sortBy) return null

  const name = labelOf(spec, sortBy.field).toLowerCase()
  const direction = sortBy.order === 'asc' ? 'laagste' : 'hoogste'
  const where = (PLACEMENT[type] ?? PLACEMENT.grid)(spec, direction)

  if (reorder !== 'fixed') {
    return `Gerangschikt op ${name} — ${where}, per jaar opnieuw berekend`
  }

  const period = years?.length ? ` ${years[0]}–${years[years.length - 1]}` : ''
  const basis = fixedYear === 'mean' ? `gemiddelde ${name}${period}` : `${name} in ${fixedYear}`
  return `Gerangschikt op ${basis} — ${where}, plekken vastgezet`
}

/**
 * De regels van de tooltip, afgeleid uit interaction.hover.tooltip.fields.
 * `$values` klapt uit naar de zes ankerpunten met hun label - anders zou
 * je die zes met de hand in de spec moeten herhalen en kunnen ze uit de
 * pas raken met data.fields.
 */
export function tooltipRows(spec, row) {
  const fields = spec.interaction?.hover?.tooltip?.fields ?? []
  const out = []

  for (const field of fields) {
    if (field === '$values') {
      for (const anchor of spec.data.fields) {
        out.push({ label: labelOf(spec, anchor), value: format(row[anchor]) })
      }
    } else {
      out.push({ label: labelOf(spec, field), value: format(row[field]) })
    }
  }
  return out
}

function format(value) {
  if (typeof value !== 'number') return String(value ?? '—')
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

/**
 * Wat de grootte van een bloem betekent. Afgeleid uit de straal-encoding,
 * niet ingetypt.
 *
 * Dit stond als vaste zin in de spec: "Oppervlak ≈ som van de zes
 * factoren". Die is waar bij een sqrt-schaal vanaf nul over één gedeeld
 * domein - en onwaar zodra iemand de schaal op linear zet of per veld gaat
 * normaliseren. Een legenda die liegt is erger dan geen legenda.
 *
 * `legend.annotate.size` blijft bestaan als ontsnappingsluik; staat daar
 * tekst, dan wint die.
 */
export function sizeCaption(spec) {
  const eigen = spec.legend?.annotate?.size
  if (eigen) return eigen

  const encoding = templateSpec(spec)?.contour?.radius
  if (!encoding?.range) return null

  if (encoding.domain?.mode === 'perField') {
    return 'Elke punt is op zijn eigen bereik geschaald'
  }
  const vanafNul = Array.isArray(encoding.domain)
    ? encoding.domain[0] === 0
    : (encoding.domain?.from ?? 0) === 0
  if (!vanafNul) return 'Lengtes zijn onderling vergelijkbaar, maar niet vanaf nul'
  if (encoding.scale === 'sqrt') return 'Oppervlak ≈ som van de zes factoren'
  if (encoding.scale === 'linear') return 'Lengte van elke punt ≈ de waarde'
  return null
}
