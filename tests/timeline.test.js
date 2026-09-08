import { describe, expect, it } from 'vitest'
import { easeCubicInOut, easeLinear } from 'd3'
import { yearsOf, frameOf, frameAt, placeAllYears, blendFrames, blendedFields } from '../src/renderer/timeline'
import { spec, data } from './fixtures'

const s = spec()
const d = data(s)
const years = yearsOf(d, 'year')
const frame = (i, sp = s, ease = easeCubicInOut) => frameOf(d, sp, years, i, ease)

describe('frameOf', () => {
  it('kent alle tien de jaren', () => {
    expect(years).toEqual([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024])
  })

  it.each([0, 4, 9])('een heel jaar (index %i) levert de echte rijen', (i) => {
    const f = frame(i)
    expect(f.placed).toHaveLength(24)
    for (const { row } of f.placed) {
      const echt = d.find((r) => r.country === row.country && r.year === years[i])
      for (const veld of s.data.fields) expect(row[veld]).toBe(echt[veld])
    }
  })

  it('mengt ertussenin, zonder buiten de twee jaren te komen', () => {
    const midden = frame(0.5).placed.find((p) => p.row.country === 'Finland').row
    const a = d.find((r) => r.country === 'Finland' && r.year === 2015)
    const b = d.find((r) => r.country === 'Finland' && r.year === 2016)
    const v = midden.gdp_per_capita
    expect(v).toBeGreaterThan(Math.min(a.gdp_per_capita, b.gdp_per_capita))
    expect(v).toBeLessThan(Math.max(a.gdp_per_capita, b.gdp_per_capita))
  })

  it('laat tekstkolommen met rust', () => {
    const r = frame(3.5).placed[0].row
    expect(typeof r.country).toBe('string')
    expect(typeof r.region).toBe('string')
  })

  it('respecteert een lege interpolate-lijst', () => {
    const geen = structuredClone(s)
    geen.animation.interpolate = []
    const v = frame(0.5, geen).placed.find((p) => p.row.country === 'Finland').row
    const a = d.find((r) => r.country === 'Finland' && r.year === 2015)
    expect(v.gdp_per_capita).toBe(a.gdp_per_capita)
  })

  it('houdt de plekken vast bij reorder "fixed"', () => {
    const plek = (i) =>
      frame(i).placed.find((p) => p.row.country === 'United States')
    expect(plek(0).x).toBe(plek(9).x)
    expect(plek(0).y).toBe(plek(9).y)
  })

  it('produceert nergens ongeldige getallen', () => {
    for (let i = 0; i <= 9; i += 0.25) {
      for (const p of frame(i).placed) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true)
      }
    }
  })
})

describe('blendFrames', () => {
  const raster = frame(9)
  const spiraal = frameOf(d, s, years, 9, easeLinear, { ...s.layout, type: 'spiral' })

  it('t = 1 levert de doelplaatsing', () => {
    const b = blendFrames(raster, spiraal, 1, 'country')
    expect(b).toBe(spiraal)
  })

  it('t = 0 heeft de posities van de bron', () => {
    const b = blendFrames(raster, spiraal, 0, 'country')
    for (const p of b.placed) {
      const bron = raster.placed.find((q) => q.row.country === p.row.country)
      expect(p.x).toBeCloseTo(bron.x)
      expect(p.y).toBeCloseTo(bron.y)
    }
  })

  it('halverwege ligt het canvas tussen beide maten in', () => {
    const b = blendFrames(raster, spiraal, 0.5, 'country')
    expect(b.width).toBeCloseTo((raster.width + spiraal.width) / 2)
  })
})

describe('blendedFields', () => {
  it('dekt de zes ankerpunten plus steel en vulling', () => {
    const velden = blendedFields(s)
    for (const f of s.data.fields) expect(velden).toContain(f)
    expect(velden).toContain(s.flower.stem.radius.field)
    expect(velden).toContain(s.flower.contour.fill.stops.field)
  })

  it('neemt een nieuwe encoding vanzelf mee', () => {
    const uitgebreid = structuredClone(s)
    uitgebreid.flower.contour.anchorDots.radius = {
      field: 'population_millions', scale: 'sqrt', domain: { from: 0 }, range: [1, 5],
    }
    uitgebreid.animation.interpolate.push('contour.anchorDots')
    expect(blendedFields(uitgebreid)).toContain('population_millions')
  })

  it('is leeg als er niets geïnterpoleerd wordt', () => {
    const geen = structuredClone(s)
    geen.animation.interpolate = []
    expect(blendedFields(geen)).toEqual([])
  })
})

describe('frameAt houdt zich binnen de lijst', () => {
  const frames = placeAllYears(d, s, years)

  it('een index voorbij het laatste jaar levert het laatste jaar', () => {
    const f = frameAt(frames, s, 42, easeCubicInOut)
    expect(f.placed).toHaveLength(24)
    expect(f).toEqual(frameAt(frames, s, years.length - 1, easeCubicInOut))
  })

  it('een negatieve index levert het eerste jaar', () => {
    expect(frameAt(frames, s, -3, easeCubicInOut).placed).toHaveLength(24)
  })

  it('NaN crasht niet', () => {
    expect(frameAt(frames, s, NaN, easeCubicInOut).placed).toHaveLength(24)
  })

  it('een lege tijdlijn levert een lege plaatsing in plaats van een crash', () => {
    expect(frameAt([], s, 3, easeCubicInOut)).toEqual({ placed: [], width: 0, height: 0 })
  })

  it('een gekrompen tijdlijn crasht niet', () => {
    expect(frameAt(frames.slice(0, 3), s, 9, easeCubicInOut).placed).toHaveLength(24)
  })
})
