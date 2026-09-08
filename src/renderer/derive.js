import { group, mean } from 'd3'

export const DELTA = '$delta'
export const RESIDUAL = '$residual'

/**
 * Voegt afgeleide kolommen toe aan de dataset, één keer, vóór alles.
 *
 * `$delta` = hoeveel de zes factoren gemiddeld bewogen ten opzichte van
 * het vorige jaar. Het eerste jaar heeft geen vorig jaar en krijgt 0.
 *
 * `$residual` = de score min de som van de zes factoren: het deel van de
 * score dat de zes factoren NIET verklaren. Het oppervlak van de bloem
 * zegt al wat de zes samen bijdragen (r = 0,92 met hun som), dus zonder
 * deze kolom is het residu nergens af te lezen - terwijl het per land
 * flink verschilt en verklaart waarom een land hoog in de ranglijst kan
 * staan met een kleine bloem.
 *
 * Door dit als gewone kolom in de rijen te zetten in plaats van als
 * uitzondering in de encoding-laag, werkt de rest vanzelf: schalen
 * berekenen er een domein over, en de tussenrijen van de animatie mengen
 * hem mee als elke andere numerieke kolom.
 *
 * Bekende beperking (v1, zie het schema): dit is één gemiddelde per bloem,
 * niet een dikte per ankerpunt. Voor per-ankerpunt zou je een pad met
 * variabele breedte moeten tekenen - twee offset-contouren, gevuld.
 */
export const MEAN = '$gemiddelde'

/**
 * De afgeleide kolommen die het platform kan maken. Welke een spec wil,
 * zegt `data.derived` — anders zou elke template de kolommen van alle
 * andere meeslepen. `$residual` heeft alleen betekenis bij een template
 * met een totaalscore; `$gemiddelde` alleen bij onderling vergelijkbare
 * velden. Dat oordeel hoort in de spec, niet hier.
 */
const DERIVED = {
  [DELTA]: ({ row, previous, fields }) =>
    previous ? mean(fields, (field) => Math.abs(row[field] - previous[field])) : 0,
  [RESIDUAL]: ({ row, fields, scoreField }) =>
    scoreField ? row[scoreField] - fields.reduce((sum, f) => sum + row[f], 0) : 0,
  [MEAN]: ({ row, fields }) => mean(fields, (field) => row[field]),
}

export function withDerived(data, spec) {
  const { entity, time, fields, scoreField } = spec.data
  const gevraagd = (spec.data.derived ?? [DELTA, RESIDUAL]).filter((k) => DERIVED[k])
  const out = []

  for (const [, rows] of group(data, (row) => row[entity])) {
    const ordered = [...rows].sort((a, b) => a[time] - b[time])
    ordered.forEach((row, i) => {
      const context = { row, previous: i === 0 ? null : ordered[i - 1], fields, scoreField }
      const extra = {}
      for (const kolom of gevraagd) extra[kolom] = DERIVED[kolom](context)
      out.push({ ...row, ...extra })
    })
  }

  return out
}

/**
 * De referentierij per entiteit voor de schaduwcontour: waar stond dit
 * land aan het begin (of eind, of gemiddeld)?
 */
export function referenceRows(data, spec, reference) {
  const { entity, time, fields } = spec.data
  const byEntity = new Map()

  for (const [name, rows] of group(data, (row) => row[entity])) {
    const ordered = [...rows].sort((a, b) => a[time] - b[time])
    if (reference === 'first') byEntity.set(name, ordered[0])
    else if (reference === 'last') byEntity.set(name, ordered[ordered.length - 1])
    else if (reference === 'mean') {
      const averaged = { ...ordered[0] }
      for (const field of fields) averaged[field] = mean(ordered, (row) => row[field])
      byEntity.set(name, averaged)
    } else {
      byEntity.set(name, ordered.find((row) => row[time] === reference) ?? ordered[0])
    }
  }

  return byEntity
}
