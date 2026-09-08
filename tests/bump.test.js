import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { csvParse, autoType } from 'd3'
import { withDerived } from '../src/renderer/derive'
import { buildScales, scaleAt } from '../src/renderer/scales'
import { validateSpec } from '../src/renderer'
import { plotArea, bumpLines, bumpPath, cursorSegment, cursorPoint, ranksByYear }
  from '../src/renderer/bump-geometry'

const spec = JSON.parse(fs.readFileSync('src/spec/it-gebruik-bump.json', 'utf8'))
const data = withDerived(
  csvParse(fs.readFileSync(`public/${spec.data.source}`, 'utf8'), autoType),
  spec
)
const area = plotArea(spec)
const { years, lijnen, x, y } = bumpLines(data, spec, area)

describe('de bump-spec op het platform', () => {
  it('valideert tegen de data', () => {
    expect(validateSpec(spec, data)).toEqual([])
  })

  it('krijgt zijn afgeleide kolom uit data.derived', () => {
    expect(spec.data.derived).toEqual(['$gemiddelde'])
    expect(data[0].$gemiddelde).toBeGreaterThan(0)
    expect(data[0].$residual).toBeUndefined()
  })

  it('bouwt schalen voor beide encodings, inclusief de ordinale', () => {
    const scales = buildScales(spec, data)
    expect(Object.keys(scales).sort()).toEqual(['line.color', 'line.width'])
    const kleur = scaleAt(scales, 'line.color', null)
    expect(kleur(data[0])).toMatch(/^#/)
  })
})

describe('rangorde', () => {
  it('kent 16 bedrijfstakken over 10 jaar', () => {
    const { count } = ranksByYear(data, spec)
    expect(years).toHaveLength(10)
    expect(count).toBe(16)
  })

  it('geeft elk jaar de plekken 1 tot en met 16, zonder gaten', () => {
    const { perYear } = ranksByYear(data, spec)
    for (const [, plekken] of perYear) {
      const rangen = [...plekken.values()].map((p) => p.rank).sort((a, b) => a - b)
      expect(rangen).toEqual([...Array(16)].map((_, i) => i + 1))
    }
  })

  it('elke lijn raakt alle tien de jaren', () => {
    expect(lijnen).toHaveLength(16)
    for (const lijn of lijnen) expect(lijn.punten).toHaveLength(10)
  })
})

describe('de cursor', () => {
  const lijn = lijnen.find((l) => l.naam === 'Onderwijs')

  it('ligt exact op het lint, ook halverwege', () => {
    for (const frac of [0, 0.25, 0.5, 0.75]) {
      const { i0, i1, s } = cursorSegment(years, 5 + frac)
      const a = lijn.punten.find((p) => p.year === years[i0])
      const b = lijn.punten.find((p) => p.year === years[i1])
      const punt = cursorPoint(
        { x: x(a.year), y: y(a.rank) }, { x: x(b.year), y: y(b.rank) }, s, 'curveBumpX'
      )
      // Het echte bezierpad van curveBumpX: beide controlepunten op de
      // horizontale helft.
      const [x0, x1, y0, y1] = [x(a.year), x(b.year), y(a.rank), y(b.rank)]
      const xm = (x0 + x1) / 2
      const bx = x0 * (1 - s) ** 3 + 3 * xm * s * (1 - s) ** 2 + 3 * xm * s ** 2 * (1 - s) + x1 * s ** 3
      const by = y0 * (1 - s) ** 3 + 3 * y0 * s * (1 - s) ** 2 + 3 * y1 * s ** 2 * (1 - s) + y1 * s ** 3
      expect(Math.hypot(punt.x - bx, punt.y - by)).toBeLessThan(1e-9)
    }
  })

  it('valt bij een rechte curve samen met lineair interpoleren', () => {
    const p = cursorPoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5, 'curveLinear')
    expect(p).toEqual({ x: 5, y: 10 })
  })

  it('blijft binnen het tekenvlak, ook bij een index erbuiten', () => {
    for (const index of [-5, 0, 4.5, 9, 42]) {
      const { i0, i1, s } = cursorSegment(years, index)
      expect(i0).toBeGreaterThanOrEqual(0)
      expect(i1).toBeLessThanOrEqual(years.length - 1)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(1)
    }
  })
})

describe('het pad', () => {
  it('bevat geen ongeldige getallen', () => {
    for (const lijn of lijnen) {
      expect(bumpPath(lijn.punten, spec.bump.line, x, y)).not.toMatch(/NaN|Infinity/)
    }
  })

  it('past binnen het tekenvlak', () => {
    for (const lijn of lijnen) {
      for (const punt of lijn.punten) {
        expect(x(punt.year)).toBeGreaterThanOrEqual(area.left - 0.01)
        expect(x(punt.year)).toBeLessThanOrEqual(area.left + area.width + 0.01)
        expect(y(punt.rank)).toBeGreaterThanOrEqual(area.top - 0.01)
        expect(y(punt.rank)).toBeLessThanOrEqual(area.top + area.height + 0.01)
      }
    }
  })
})

describe('het tekenvlak blijft bruikbaar', () => {
  const met = (marges) => {
    const s = structuredClone(spec)
    Object.assign(s.bump.plot, marges)
    return plotArea(s)
  }

  it.each([
    ['standaard', {}],
    ['geen marges', { top: 0, right: 0, bottom: 0, left: 0 }],
    ['alles maximaal', { top: 240, right: 560, bottom: 240, left: 560 }],
    ['absurd', { top: 900, right: 1500, bottom: 900, left: 1500 }],
    ['negatief', { top: -50, left: -200 }],
  ])('%s levert een vlak dat past', (naam, marges) => {
    const a = met(marges)
    expect(a.width).toBeGreaterThanOrEqual(120)
    expect(a.height).toBeGreaterThanOrEqual(120)
    expect(a.left).toBeGreaterThanOrEqual(0)
    expect(a.left + a.width).toBeLessThanOrEqual(a.outerWidth + 0.01)
    expect(a.top + a.height).toBeLessThanOrEqual(a.outerHeight + 0.01)
  })

  it('houdt ruimte voor de jaartallen boven het vlak', () => {
    const a = met({ top: 0 })
    const nodig = spec.bump.axis.tickLength + spec.bump.axis.size + 10
    expect(a.top).toBeGreaterThanOrEqual(nodig - 0.01)
  })

  it('houdt ruimte voor het cursorjaar onder het vlak', () => {
    const a = met({ bottom: 0 })
    const nodig = spec.bump.axis.tickLength + spec.bump.cursor.yearSize + 14
    expect(a.outerHeight - (a.top + a.height)).toBeGreaterThanOrEqual(nodig - 0.01)
  })
})
