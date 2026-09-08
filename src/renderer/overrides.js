/**
 * Een pad in de spec wijzigen zonder de spec te muteren.
 *
 * Structuurdelend: alleen de takken op weg naar de gewijzigde sleutel
 * worden gekopieerd, de rest houdt zijn identiteit. Dat is niet alleen
 * netter maar noodzakelijk - met een structuredClone is na een
 * kleurwijziging óók `spec.flower` en `spec.data` een nieuw object, en
 * dan herberekent elke useMemo die daarop let zich voor niets. De afgeleide
 * kolommen en alle schalen zouden dan bij elke schuif opnieuw uitgerekend
 * worden.
 *
 * De spec zelf wordt nooit gemuteerd; dat is wat undo mogelijk maakt.
 */
function setIn(node, keys, value) {
  const [key, ...rest] = keys
  const current = node?.[key]
  const next = rest.length ? setIn(current ?? {}, rest, value) : value
  if (current === next) return node

  if (Array.isArray(node)) {
    const copy = [...node]
    copy[key] = next
    return copy
  }
  return { ...(node ?? {}), [key]: next }
}

export function withOverrides(spec, overrides) {
  const entries = Object.entries(overrides)
  if (entries.length === 0) return spec
  return entries.reduce((acc, [path, value]) => setIn(acc, path.split('.'), value), spec)
}

/** Huidige waarde op een spec-pad. */
export function readPath(spec, path) {
  return path.split('.').reduce((node, key) => node?.[key], spec)
}
