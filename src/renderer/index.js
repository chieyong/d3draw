/**
 * De publieke API van de renderer — wat een klant nodig heeft.
 *
 * Meer niet. Alles wat hier staat is iets dat je met een geleverde
 * visualisatie kunt doen: hem tekenen, en vooraf controleren of de spec op
 * de data past. De rest is intern; wat de editor daarvan nodig heeft staat
 * in editor-api.js, expliciet gemarkeerd.
 *
 * Deze lijst klein houden is geen netheid maar de belofte zelf: hoe meer
 * er uitsteekt, hoe meer er stukgaat als de binnenkant verandert.
 */
export { default as Chart } from './Chart'
export { validateSpec, hasErrors } from './validate'
