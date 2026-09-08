import { ascending, descending, group, mean } from 'd3'

/**
 * Sorteert de rijen van één jaar. De volgorde bepaalt de plek, dus de
 * ordening ís de ranglijst. Sorteren gebeurt binnen het jaar - anders zou
 * de rangorde van 2015 blijven plakken in 2024.
 */
export function sortRows(rows, sortBy) {
  if (!sortBy) return rows
  const compare = sortBy.order === 'asc' ? ascending : descending
  return [...rows].sort((a, b) => compare(a[sortBy.field], b[sortBy.field]))
}

/**
 * Posities als rekenkunde, niet als layout-algoritme.
 *
 * Geen d3.forceSimulation of d3.pack: die geven bij elke aanroep een net
 * iets andere uitkomst. Posities worden hier geïnterpoleerd - bij een
 * jaarstap én bij een wissel van ordening - en dan moet dezelfde invoer
 * altijd dezelfde plek opleveren.
 *
 * Elke plaatsing levert zelf zijn afmetingen: een spiraal is vierkant, een
 * raster is zo breed als zijn kolommen, en banden per regio zijn zo hoog
 * als de regio's samen nodig hebben. De aanroeper hoeft dat niet te weten.
 */
const PLACERS = {
  grid(rows, layout) {
    const { columns, cellSize, margin } = layout
    const placed = rows.map((row, i) => ({
      row,
      x: (i % columns) * cellSize + cellSize / 2 + margin,
      y: Math.floor(i / columns) * cellSize + cellSize / 2 + margin,
    }))
    return {
      placed,
      width: Math.min(rows.length, columns) * cellSize + margin * 2,
      height: Math.ceil(rows.length / columns) * cellSize + margin * 2,
    }
  },

  /**
   * Archimedische spiraal met constante booglengte tussen opeenvolgende
   * bloemen: r groeit lineair met de hoek, en de hoekstap wordt per punt
   * berekend als afstand / straal.
   *
   * Bewust GEEN phyllotaxis (het zonnebloempatroon). Dat pakt dichter,
   * maar de gulden hoek zet opeenvolgende items 137 graden uit elkaar -
   * je krijgt een strooisel waarin de volgorde onzichtbaar is, terwijl de
   * volgorde hier juist de betekenis draagt: de gelukkigste in het hart.
   * Hier liggen buren in de ranglijst ook naast elkaar op de curve, en
   * daarom kun je die curve ook tekenen (layout.spiral.guide).
   *
   * De radiale afstand tussen twee omwentelingen is gelijk aan de
   * booglengte, zodat de bloemen in beide richtingen even ver uit elkaar
   * liggen.
   */
  spiral(rows, layout) {
    const { cellSize, margin, spiral } = layout
    const spacing = cellSize * (spiral?.spacing ?? 0.82)
    const pitch = spacing / (2 * Math.PI)

    const offsets = []
    let theta = 0
    for (let i = 0; i < rows.length; i += 1) {
      const r = pitch * theta
      offsets.push([r * Math.cos(theta), r * Math.sin(theta)])
      // Vanuit het middelpunt is er geen hoekstap te berekenen; daar
      // beginnen we op één volle omwenteling, precies `spacing` van het hart.
      theta = theta === 0 ? 2 * Math.PI : theta + spacing / (pitch * theta)
    }

    const reach = Math.max(...offsets.map(([x, y]) => Math.hypot(x, y))) + cellSize / 2 + margin
    return {
      placed: rows.map((row, i) => ({
        row,
        x: reach + offsets[i][0],
        y: reach + offsets[i][1],
      })),
      width: reach * 2,
      height: reach * 2,
    }
  },

  byRegion(rows, layout) {
    const { cellSize, margin, byRegion } = layout
    const { groupField, gap, labelHeight = 22, columns = 8 } = byRegion

    // Groepen op hun sterkste lid, zodat de leesvolgorde die van het raster
    // blijft: het beste eerst.
    const groups = [...group(rows, (row) => row[groupField])].sort(
      (a, b) => rows.indexOf(a[1][0]) - rows.indexOf(b[1][0])
    )

    // Planken vullen van links naar rechts. Elke groep is één rij breed;
    // past hij niet meer, dan begint een nieuwe plank. Zonder dit krijgt
    // elke groep een eigen volle band en staat een groep van één land
    // naast vijf cellen leegte - vier keer zo hoog als nodig.
    const budget = columns * cellSize
    const shelves = [[]]
    let used = 0
    for (const entry of groups) {
      const width = entry[1].length * cellSize
      if (used > 0 && used + gap + width > budget) {
        shelves.push([])
        used = 0
      }
      shelves[shelves.length - 1].push(entry)
      used += (used > 0 ? gap : 0) + width
    }

    const placed = []
    const bands = []
    let cursor = margin
    let widest = 0

    for (const shelf of shelves) {
      cursor += labelHeight
      let x = margin
      for (const [name, members] of shelf) {
        bands.push({ name, x, y: cursor - labelHeight * 0.35, count: members.length })
        members.forEach((row, i) => {
          placed.push({ row, x: x + i * cellSize + cellSize / 2, y: cursor + cellSize / 2 })
        })
        x += members.length * cellSize + gap
      }
      widest = Math.max(widest, x - gap)
      cursor += cellSize + gap
    }

    return { placed, bands, width: widest + margin, height: cursor - gap + margin }
  },
}

export function placeRows(rows, layout) {
  const place = PLACERS[layout.type]
  if (!place) {
    throw new Error(
      `layout.type "${layout.type}" bestaat niet. Beschikbaar: ${Object.keys(PLACERS).join(', ')}.`
    )
  }
  return place(rows, layout)
}

export const LAYOUT_TYPES = Object.keys(PLACERS)

/**
 * Schaalt een plaatsing zodat hij binnen een doosje past.
 *
 * Dit gebeurt ná het plaatsen, niet ervoor: elke plaatsing rekent in zijn
 * eigen natuurlijke maat en hoeft niets van het scherm te weten. Wat er
 * terugkomt is dezelfde plaatsing plus een schaalfactor, die de bloemen
 * meekrijgen als transform. Typografie schaalt bewust NIET mee - een label
 * van 11px is bij 0,5 onleesbaar, en dan verberg je het liever.
 */
export function fitFrame(frame, box) {
  if (!box) return { ...frame, scale: 1 }
  const scale = Math.min(1, box.width / frame.width, box.height / frame.height)
  if (scale === 1) return { ...frame, scale }

  return {
    ...frame,
    scale,
    width: frame.width * scale,
    height: frame.height * scale,
    placed: frame.placed.map((p) => ({ ...p, x: p.x * scale, y: p.y * scale })),
    bands: frame.bands?.map((b) => ({ ...b, x: b.x * scale, y: b.y * scale })),
  }
}

/** Gemiddelde van een veld per groep - gebruikt om groepen te ordenen. */
export function groupMeans(rows, groupField, field) {
  return new Map(
    [...group(rows, (row) => row[groupField])].map(([name, members]) => [
      name,
      mean(members, (row) => row[field]),
    ])
  )
}
