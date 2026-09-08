import {
  lineRadial,
  curveCardinalClosed,
  curveCatmullRomClosed,
  curveLinearClosed,
  range,
} from 'd3'

/**
 * Zes ankerpunten = zes gelijke hoeken. Bewust geen d3.scalePoint: die is
 * voor posities op een lijn en brengt padding-semantiek mee die hier niets
 * betekent. Hoek 0 wijst omhoog en loopt kloksgewijs - precies de conventie
 * die d3.lineRadial hanteert.
 */
export function anchorAngles(count) {
  return range(count).map((i) => (i / count) * 2 * Math.PI)
}

/** Zelfde conventie als lineRadial: 0 = 12 uur, kloksgewijs. */
export function polarToXY(angle, radius) {
  return [radius * Math.sin(angle), -radius * Math.cos(angle)]
}

const clamp01 = (t) => Math.max(0, Math.min(1, t))

/**
 * Elke curve-familie in D3 heeft zijn eigen vorm-parameter, met zijn eigen
 * betekenis en zijn eigen richting. De spec kent maar één slider,
 * `tension`, die loopt van 0 = hoekig naar 1 = vloeiend rond. Hier staat
 * per familie hoe die slider vertaald wordt - en dat is de enige plek waar
 * die vertaling voorkomt.
 */
const CURVES = {
  // De echte vorm-knop. .tension(1) maakt alle raaklijnen nul en levert
  // letterlijk de zeshoek door de datapunten; .tension(0) bolt ver uit.
  // Richting is omgekeerd aan de spec, vandaar 1 - tension.
  curveCardinalClosed: (t) => curveCardinalClosed.tension(1 - clamp01(t)),

  // Let op: .alpha() is GEEN tension. Het regelt de parametrisatie van de
  // spline (0 = uniform, 0.5 = centripetaal, 1 = chordaal) en maakt een
  // vorm nooit hoekig. Bij zes gelijk verdeelde hoeken is het effect klein.
  // Waarvoor je hem wél wilt: centripetaal (~0.5) voorkomt doorschieten en
  // lusjes wanneer één ankerpunt veel langer is dan zijn buren.
  curveCatmullRomClosed: (t) => curveCatmullRomClosed.alpha(1 - clamp01(t)),

  // Rechte lijnen; negeert tension. Handig als referentie: zo ziet de
  // ruwe zeshoek eruit waar alle curves een variant op zijn.
  curveLinearClosed: () => curveLinearClosed,
}

/** Welke curve-families de renderer kent. De inspector leest deze lijst. */
export const CURVE_TYPES = Object.keys(CURVES)

/**
 * Bouwt de `d`-string van de contour. Punten zijn { angle, radius }-paren.
 *
 * lineRadial in plaats van zelf x/y rekenen: je voert hoek + straal in en
 * D3 doet de poolconversie. Dat betaalt zich terug in stap 4, want dan
 * interpoleren we in straal (de bloem groeit) in plaats van in x/y (wat
 * zwiepende bewegingen geeft).
 *
 * De ...Closed-varianten sluiten het pad zonder dat we het eerste punt
 * hoeven te herhalen.
 */
export function contourPath(points, { curve, tension }) {
  const shape = CURVES[curve] ?? CURVES.curveCardinalClosed

  return lineRadial()
    .angle((d) => d.angle)
    .radius((d) => d.radius)
    .curve(shape(tension))(points)
}
