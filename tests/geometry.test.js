import { describe, expect, it } from 'vitest'
import { anchorAngles, polarToXY, contourPath, CURVE_TYPES } from '../src/renderer/geometry'

const punten = (stralen) =>
  stralen.map((radius, i) => ({ angle: anchorAngles(stralen.length)[i], radius }))

describe('contourPath', () => {
  const stralen = [60, 62, 50, 42, 24, 36]

  it.each(CURVE_TYPES)('%s sluit de contour', (curve) => {
    const d = contourPath(punten(stralen), { curve, tension: 0.6 })
    // De twee families sluiten verschillend: curveLinearClosed zet een "Z",
    // de spline-varianten keren terug naar het beginpunt. Beide zijn dicht;
    // testen op alleen "Z" zou de spline-curves onterecht afkeuren.
    const getallen = d.match(/-?\d+\.?\d*/g).map(Number)
    const terugGekeerd =
      Math.hypot(getallen[0] - getallen.at(-2), getallen[1] - getallen.at(-1)) < 1e-6
    expect(d.trimEnd().endsWith('Z') || terugGekeerd).toBe(true)
  })

  it('levert geen NaN bij een straal van nul', () => {
    const d = contourPath(punten([0, 0, 0, 0, 0, 0]), { curve: 'curveCardinalClosed', tension: 0.6 })
    expect(d).not.toMatch(/NaN/)
  })

  it('tension verandert de vorm bij cardinal', () => {
    const a = contourPath(punten(stralen), { curve: 'curveCardinalClosed', tension: 0 })
    const b = contourPath(punten(stralen), { curve: 'curveCardinalClosed', tension: 1 })
    expect(a).not.toEqual(b)
  })

  it('curveLinearClosed negeert tension', () => {
    const a = contourPath(punten(stralen), { curve: 'curveLinearClosed', tension: 0 })
    const b = contourPath(punten(stralen), { curve: 'curveLinearClosed', tension: 1 })
    expect(a).toEqual(b)
  })
})

describe('hoeken', () => {
  it('hoek 0 wijst omhoog', () => {
    const [x, y] = polarToXY(anchorAngles(6)[0], 10)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(-10)
  })

  it('zes gelijke hoeken', () => {
    const hoeken = anchorAngles(6)
    expect(hoeken).toHaveLength(6)
    expect(hoeken[3]).toBeCloseTo(Math.PI)
  })
})
