/**
 * Wat is benadrukt en wat is gedempt. Puur rekenwerk, geen React.
 *
 * Volgorde van voorrang: vastgezette bloemen winnen van hover. Zodra je
 * iets vastzet, is dat je vergelijking; een muis die er toevallig overheen
 * beweegt hoort die niet te overschrijven.
 */
/**
 * `unitField` is wat je kunt aanwijzen. Meestal is dat de entiteit uit de
 * data - een land, een bedrijfstak - maar niet altijd: bij een ridgeline
 * wijs je een decennium aan terwijl de entiteit een film is. De template
 * weet dat, dit bestand niet.
 */
export function opacityOf(row, spec, { hovered, pinned }, unitField) {
  const hover = spec.interaction?.hover
  const veld = unitField ?? spec.data.entity
  if (!hover || hover.highlight === 'none') return 1

  const dim = hover.dimOthersTo ?? 1
  const name = row[veld]

  if (pinned.length > 0) return pinned.includes(name) ? 1 : dim
  if (!hovered) return 1
  if (name === hovered.name) return 1

  if (hover.highlight === 'sameRegion' && hover.groupField) {
    return row[hover.groupField] === hovered.group ? 1 : dim
  }
  return dim
}

/** De rijen van het vergelijkpaneel, in de volgorde waarin ze zijn vastgezet. */
export function pinnedRows(placed, spec, pinned, unitField) {
  const veld = unitField ?? spec.data.entity
  return pinned
    .map((name) => placed.find((p) => p.row[veld] === name)?.row)
    .filter(Boolean)
}

/**
 * Vastzetten of losmaken. Boven het maximum valt de oudste eruit - dat
 * leest beter dan een klik die niets doet.
 */
export function togglePin(pinned, name, max) {
  if (pinned.includes(name)) return pinned.filter((n) => n !== name)
  const next = [...pinned, name]
  return next.length > max ? next.slice(next.length - max) : next
}
