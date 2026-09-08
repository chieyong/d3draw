/**
 * Voor de editor, niet voor klanten.
 *
 * Deze symbolen horen niet bij het geleverde product: ze bestaan zodat een
 * bewerkomgeving de renderer kan *bevragen* — welke schaaltypes, curves,
 * ordeningen en easings kent hij, wat is een encoding, hoe wijzig je een
 * spec-pad zonder de spec te muteren.
 *
 * Dat het een apart bestand is, is de bedoeling: wie hieruit importeert
 * bouwt gereedschap, geen visualisatie. Zou dit in index.js staan, dan
 * groeit de publieke API stilletjes mee met elke interne behoefte.
 */
export { isEncoding, SCALE_TYPES_LIST, walkEncodings, scaleAt } from './scales'
export { CURVE_TYPES } from './geometry'
export { EASE_TYPES } from './useTimeline'
export { LAYOUT_TYPES } from './layout'
export { BUMP_CURVE_TYPES } from './bump-geometry'
export { VIEW_BINDS } from './useView'
export { labelOf, orderCaption } from './captions'
export { withOverrides, readPath } from './overrides'
export { templateKey, templateSpec, templatePath } from './template'
