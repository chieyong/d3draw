import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { csvParse, autoType } from 'd3'
import { validateSpec } from '../src/renderer'
import { buildScales, scaleAt } from '../src/renderer/scales'
import { opacityOf } from '../src/renderer/highlight'
import { ridgePlot, ridges, ridgePath, density, bandwidth, valueScale }
  from '../src/renderer/ridge-geometry'
import { plotBox } from '../src/renderer/plot'

const spec = JSON.parse(fs.readFileSync('src/spec/montagetempo-ridge.json', 'utf8'))
const data = csvParse(fs.readFileSync(`public/${spec.data.source}`, 'utf8'), autoType)
const vlak = ridgePlot(spec)
const { groepen, x } = ridges(data, spec, vlak)

describe('de ridge-spec op het platform', () => {
  it('valideert tegen de data', () => {
    expect(validateSpec(spec, data)).toEqual([])
  })

  it('vraagt geen afgeleide kolommen aan', () => {
    expect(spec.data.derived).toEqual([])
  })

  it('bouwt een schaal voor de vulling', () => {
    const scales = buildScales(spec, data)
    expect(scaleAt(scales, 'fill', null)(data[0])).toMatch(/^(#|rgb)/)
  })
})

describe('groepen en verdelingen', () => {
  it('kent elf decennia', () => {
    expect(groepen).toHaveLength(11)
    expect(groepen[0].naam).toBe(1920)
    expect(groepen.at(-1).naam).toBe(2020)
  })

  it('vat elke groep samen voor de tooltip', () => {
    for (const g of groepen) {
      expect(g.samenvatting.aantal).toBe(g.rijen.length)
      expect(g.samenvatting.mediaan).toBeGreaterThan(0)
      expect(g.samenvatting.snelste).toBeLessThanOrEqual(g.samenvatting.traagste)
    }
  })

  it('laat het tempo dalen over de decennia', () => {
    const eerste = groepen.find((g) => g.naam === 1940).samenvatting.mediaan
    const laatste = groepen.find((g) => g.naam === 2020).samenvatting.mediaan
    expect(laatste).toBeLessThan(eerste / 3)
  })

  it('levert paden zonder ongeldige getallen', () => {
    for (const g of groepen) expect(ridgePath(g)).not.toMatch(/NaN|Infinity/)
  })

  it('houdt elke rug binnen het vlak', () => {
    for (const g of groepen) {
      expect(g.basis).toBeLessThanOrEqual(vlak.top + vlak.height + 0.01)
      for (const p of g.kromme) {
        expect(p.x).toBeGreaterThanOrEqual(-0.01)
        expect(p.x).toBeLessThanOrEqual(vlak.width + 0.01)
      }
    }
  })
})

describe('de kerndichtheid', () => {
  const schaal = valueScale(spec, vlak)

  it('berekent zijn eigen bandbreedte uit spreiding en aantal', () => {
    const weinig = bandwidth([100, 200, 300])
    const veel = bandwidth([...Array(300)].map((_, i) => i))
    expect(weinig).toBeGreaterThan(0)
    expect(veel).toBeGreaterThan(0)
    // meer metingen → fijner mogen kijken
    expect(bandwidth([100, 110, 120, 130])).toBeLessThan(bandwidth([100, 300, 500, 700]))
  })

  it('levert één top voor een unimodale verdeling', () => {
    const kromme = density([2, 2.2, 2.5, 2.6, 2.8, 3, 3.1, 3.4], schaal, { samples: 200 })
    const piek = Math.max(...kromme.map((p) => p.y))
    let toppen = 0
    for (let i = 1; i < kromme.length - 1; i += 1) {
      if (kromme[i].y > kromme[i - 1].y && kromme[i].y >= kromme[i + 1].y && kromme[i].y > 0.15 * piek) {
        toppen += 1
      }
    }
    expect(toppen).toBe(1)
  })

  it('geeft elke decennium-verdeling één top', () => {
    for (const g of groepen) {
      const piek = Math.max(...g.kromme.map((p) => p.y))
      let toppen = 0
      for (let i = 1; i < g.kromme.length - 1; i += 1) {
        if (g.kromme[i].y > g.kromme[i - 1].y && g.kromme[i].y >= g.kromme[i + 1].y &&
            g.kromme[i].y > 0.15 * piek) toppen += 1
      }
      expect(toppen, `${g.naam}s`).toBeLessThanOrEqual(2)
    }
  })

  it('is leeg bij geen metingen in plaats van NaN', () => {
    expect(density([], schaal, { samples: 10 }).every((p) => p.y === 0)).toBe(true)
  })
})

describe('de aanwijsbare eenheid is de groep, niet de entiteit', () => {
  const rij = groepen[3].rijen[0]

  it('dimt op decennium', () => {
    const staat = { hovered: { name: groepen[3].naam, group: null }, pinned: [] }
    expect(opacityOf(rij, spec, staat, 'decennium')).toBe(1)
    expect(opacityOf(groepen[0].rijen[0], spec, staat, 'decennium'))
      .toBe(spec.interaction.hover.dimOthersTo)
  })

  it('zonder die aanwijzing zou hij op film kijken en niets vinden', () => {
    const staat = { hovered: { name: groepen[3].naam, group: null }, pinned: [] }
    expect(opacityOf(rij, spec, staat)).toBe(spec.interaction.hover.dimOthersTo)
  })
})

describe('het tekenvlak', () => {
  it.each([
    ['standaard', {}],
    ['geen marges', { top: 0, right: 0, bottom: 0, left: 0 }],
    ['absurd', { top: 900, right: 900, bottom: 900, left: 900 }],
  ])('%s blijft bruikbaar', (naam, marges) => {
    const box = plotBox(spec.layout.fit, { ...spec.ridge.plot, ...marges }, { top: 10, bottom: 40 })
    expect(box.width).toBeGreaterThanOrEqual(120)
    expect(box.height).toBeGreaterThanOrEqual(120)
  })
})

describe('de stapeling past precies', () => {
  it('de bovenste piek raakt de bovenrand', () => {
    const top = groepen[0].basis - groepen[0].hoogte(
      Math.max(...groepen.flatMap((g) => g.kromme.map((p) => p.y)))
    )
    expect(top).toBeCloseTo(vlak.top, 6)
  })

  it('de onderste basislijn raakt de onderrand', () => {
    expect(groepen.at(-1).basis).toBeCloseTo(vlak.top + vlak.height, 6)
  })

  it('blijft passen bij elke overlap', () => {
    for (const overlap of [0, 0.5, 1.4, 3]) {
      const s = structuredClone(spec)
      s.ridge.overlap = overlap
      const v = ridgePlot(s)
      const g = ridges(data, s, v).groepen
      expect(g.at(-1).basis, `overlap ${overlap}`).toBeCloseTo(v.top + v.height, 6)
    }
  })
})
