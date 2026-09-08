import { describe, expect, it } from 'vitest'
import { describeSpec } from '../src/editor/inspect'
import { sizeCaption, orderCaption } from '../src/renderer/captions'
import { withOverrides } from '../src/renderer/editor-api'
import { spec } from './fixtures'

const s = spec()
const veld = (sp, pad) => describeSpec(sp).find((f) => f.path === pad)

describe('inspector — bereikbaarheid', () => {
  it('slaat structurele koppelingen aan de dataset over', () => {
    for (const pad of ['data.entity', 'data.time', 'data.scoreField']) {
      expect(veld(s, pad), pad).toBeUndefined()
    }
  })

  it('toont een lege sleutel als tekstveld in plaats van hem weg te laten', () => {
    expect(veld(s, 'layout.header.note')).toMatchObject({ kind: 'text', value: '' })
    expect(veld(s, 'legend.annotate.size')).toMatchObject({ kind: 'text', value: '' })
  })

  it('maakt fill.color bereikbaar, ook bij een gradient', () => {
    expect(veld(s, 'flower.contour.fill.color')).toMatchObject({ kind: 'color' })
  })

  it('laat de solid-vulling werken zonder de spec aan te vullen', () => {
    const solid = withOverrides(s, { 'flower.contour.fill.type': 'solid' })
    expect(solid.flower.contour.fill.color).toBeTruthy()
  })
})

describe('afgeleide legendatekst', () => {
  it('beschrijft een sqrt-schaal vanaf nul als oppervlak', () => {
    expect(sizeCaption(s)).toBe('Oppervlak ≈ som van de zes factoren')
  })

  it('verandert mee als de schaal lineair wordt', () => {
    const lin = withOverrides(s, { 'flower.contour.radius.scale': 'linear' })
    expect(sizeCaption(lin)).toBe('Lengte van elke punt ≈ de waarde')
  })

  it('verandert mee bij normaliseren per veld', () => {
    const per = withOverrides(s, { 'flower.contour.radius.domain': { mode: 'perField', from: 0 } })
    expect(sizeCaption(per)).toBe('Elke punt is op zijn eigen bereik geschaald')
  })

  it('laat een handmatige tekst voorgaan', () => {
    const eigen = withOverrides(s, { 'legend.annotate.size': 'Eigen uitleg' })
    expect(sizeCaption(eigen)).toBe('Eigen uitleg')
  })
})

describe('bijschrift boven het raster', () => {
  it('noemt de ordening en dat de plekken vastliggen', () => {
    expect(orderCaption(s, [2015, 2024])).toContain('plekken vastgezet')
  })

  it('past zich aan bij een spiraal', () => {
    expect(orderCaption(withOverrides(s, { 'layout.type': 'spiral' }), [2015, 2024]))
      .toContain('in het midden')
  })
})
