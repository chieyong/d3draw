/**
 * Welke template deze spec beschrijft, en waar zijn instellingen staan.
 *
 * `spec.template` noemt de sleutel waaronder de template-instellingen
 * staan: bij `"flower"` is dat `spec.flower`. Die naam blijft leesbaar in
 * de JSON — je ziet meteen wat voor grafiek het is — maar de code noemt
 * hem nergens meer bij naam.
 *
 * Dit is de naad tussen platform en template. Alles wat hierboven werkt
 * (schalen, interpolatie, validatie, inspector) hoort grafiekonafhankelijk
 * te zijn; alles wat de sectie zelf uitleest hoort bij de template.
 */
export function templateKey(spec) {
  return spec?.template ?? 'flower'
}

export function templateSpec(spec) {
  return spec?.[templateKey(spec)]
}

/** Een pad binnen de template als volledig spec-pad. */
export function templatePath(spec, path) {
  return path ? `${templateKey(spec)}.${path}` : templateKey(spec)
}
