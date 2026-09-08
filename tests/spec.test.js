import { describe, expect, it } from 'vitest'
import { validateSpec, hasErrors } from '../src/renderer'
import { buildScales, scaleAt } from '../src/renderer/scales'
import { withOverrides, templateKey, templateSpec } from '../src/renderer/editor-api'
import { describeSpec } from '../src/editor/inspect'
import { mergeSpec } from '../src/editor/persist'
import { spec, data, rows } from './fixtures'

const s = spec()
const d = data(s)

describe('validateSpec', () => {
  it('keurt de meegeleverde spec goed', () => {
    expect(validateSpec(s, d)).toEqual([])
  })

  it('vindt een onbekende kolom in een encoding', () => {
    const kapot = structuredClone(s)
    kapot.flower.contour.radius.field = 'gdp_per_capitaa'
    expect(hasErrors(validateSpec(kapot, d))).toBe(true)
  })

  it('vindt een onbekende kolom in data.fields', () => {
    const kapot = structuredClone(s)
    kapot.data.fields[2] = 'bestaat_niet'
    expect(hasErrors(validateSpec(kapot, d))).toBe(true)
  })

  it('waarschuwt bij een lege waarde zonder het tekenen te blokkeren', () => {
    const gaten = d.map((r, i) => (i === 5 ? { ...r, freedom: null } : r))
    const p = validateSpec(s, gaten)
    expect(p.length).toBeGreaterThan(0)
    expect(hasErrors(p)).toBe(false)
  })

  it('weigert een log-schaal vanaf nul', () => {
    const kapot = structuredClone(s)
    kapot.flower.contour.radius.scale = 'log'
    expect(hasErrors(validateSpec(kapot, d))).toBe(true)
  })

  it('eist theme.background en theme.ink', () => {
    const kapot = structuredClone(s)
    delete kapot.theme.ink
    expect(hasErrors(validateSpec(kapot, d))).toBe(true)
  })

  it('waarschuwt over een control die niets aanstuurt', () => {
    const kapot = structuredClone(s)
    kapot.interaction.controls.push({ type: 'select', binds: 'flower.contour.tension' })
    expect(validateSpec(kapot, d).some((p) => p.level === 'warning')).toBe(true)
  })

  it('werkt zonder data', () => {
    expect(validateSpec(s)).toEqual([])
  })
})

describe('schalen', () => {
  it('clampt onder de ondergrens van een handgezet domein', () => {
    const krap = structuredClone(s)
    krap.flower.stem.radius.domain = [2, 3]
    const straal = scaleAt(buildScales(krap, d), 'stem.radius', 0)
    expect(Math.min(...d.map(straal))).toBeGreaterThanOrEqual(krap.flower.stem.radius.range[0])
  })

  it('bouwt een schaal voor elke encoding in de template', () => {
    expect(Object.keys(buildScales(s, d)).sort()).toEqual([
      'contour.fill.stops', 'contour.radius', 'contour.strokeWidth', 'stem.radius',
    ])
  })

  it('valt terug op een vaste waarde waar geen encoding staat', () => {
    const vast = structuredClone(s)
    vast.flower.contour.strokeWidth = 1.25
    const scales = buildScales(vast, d)
    expect(scales['contour.strokeWidth']).toBeUndefined()
    expect(scaleAt(scales, 'contour.strokeWidth', 1.25)(d[0])).toBe(1.25)
  })
})

describe('withOverrides', () => {
  it('muteert de spec niet', () => {
    withOverrides(s, { 'theme.ink': '#000000' })
    expect(s.theme.ink).toBe('#1a1a2e')
  })

  it('deelt takken die niet op het pad liggen', () => {
    const na = withOverrides(s, { 'theme.ink': '#000000' })
    expect(na.theme).not.toBe(s.theme)
    expect(na.flower).toBe(s.flower)
    expect(na.data).toBe(s.data)
  })

  it('deelt ook binnen een diepe tak', () => {
    const na = withOverrides(s, { 'flower.contour.tension': 0.2 })
    expect(na.flower.contour).not.toBe(s.flower.contour)
    expect(na.flower.stem).toBe(s.flower.stem)
  })
})

describe('inspector', () => {
  it('elke slider bevat zijn eigen waarde', () => {
    for (const f of describeSpec(s).filter((f) => f.kind === 'number')) {
      expect(f.value, f.path).toBeGreaterThanOrEqual(f.min)
      expect(f.value, f.path).toBeLessThanOrEqual(f.max)
    }
  })

  it('geeft elk veld een uniek pad', () => {
    const paden = describeSpec(s).map((f) => f.path)
    expect(new Set(paden).size).toBe(paden.length)
  })

  it('herkent de vier encodings', () => {
    expect(describeSpec(s).filter((f) => f.kind === 'encoding')).toHaveLength(4)
  })
})

describe('sessie samenvoegen', () => {
  it('vult sleutels aan die er sindsdien bij kwamen', () => {
    const oud = structuredClone(s)
    delete oud.theme.tooltip
    oud.flower.contour.tension = 0.25
    const m = mergeSpec(s, oud)
    expect(m.theme.tooltip).toEqual(s.theme.tooltip)
    expect(m.flower.contour.tension).toBe(0.25)
  })

  it('levert een geldige spec op', () => {
    const oud = structuredClone(s)
    delete oud.interaction.click.strokeWidth
    expect(hasErrors(validateSpec(mergeSpec(s, oud), rows()))).toBe(false)
  })
})

describe('de naad tussen platform en template', () => {
  it('spec.template wijst naar de template-sectie', () => {
    expect(templateKey(s)).toBe('flower')
    expect(templateSpec(s)).toBe(s.flower)
  })

  it('valt terug op "flower" als de sleutel ontbreekt', () => {
    const zonder = structuredClone(s)
    delete zonder.template
    expect(templateSpec(zonder)).toBe(zonder.flower)
  })

  it('meldt het als de genoemde sectie niet bestaat', () => {
    const kapot = withOverrides(s, { template: 'bump' })
    expect(hasErrors(validateSpec(kapot))).toBe(true)
  })

  it('bouwt schalen voor de sectie die template noemt', () => {
    const hernoemd = structuredClone(s)
    hernoemd.template = 'mark'
    hernoemd.mark = hernoemd.flower
    delete hernoemd.flower
    expect(Object.keys(buildScales(hernoemd, d)).sort()).toEqual(
      Object.keys(buildScales(s, d)).sort()
    )
  })

  it('de inspector loopt een andere sectienaam vanzelf af', () => {
    const hernoemd = structuredClone(s)
    hernoemd.template = 'mark'
    hernoemd.mark = hernoemd.flower
    delete hernoemd.flower
    const paden = describeSpec(hernoemd).map((f) => f.path)
    expect(paden.some((p) => p.startsWith('mark.'))).toBe(true)
    expect(paden.some((p) => p.startsWith('flower.'))).toBe(false)
  })
})
