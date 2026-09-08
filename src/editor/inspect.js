import { BUMP_CURVE_TYPES, CURVE_TYPES, EASE_TYPES, LAYOUT_TYPES, SCALE_TYPES_LIST, isEncoding, templateKey } from '../renderer/editor-api'

/**
 * De inspector wordt AFGELEID uit de spec, niet met de hand opgebouwd.
 *
 * Dat is het hele punt van sectie 4 van het schema: een getal wordt een
 * slider, een kleur een kleurkiezer, een encoding een veld-dropdown plus
 * schaal plus bereik. Zou je de inspector met de hand samenstellen, dan
 * moet je hem bij elke nieuwe spec-sleutel opnieuw bijwerken - en dan lopen
 * spec en inspector uit elkaar.
 *
 * Wat NIET afleidbaar is, staat in twee tabellen: hoe ver een schuif mag
 * lopen, en welke keuzes een enum heeft. Het bereik van `opacity` (0-1) en
 * dat van `cellSize` (60-300) kun je niet uit de waarde 0.85 of 170 raden.
 */

/**
 * Grenzen, eerst op volledig pad, anders op sleutelnaam.
 *
 * Alleen op sleutelnaam ging mis: `width` gold zowel voor
 * spiral.guide.width (1,2) als voor legend.box.width (430) en
 * layout.fit.width (1520). Drie sliders stonden buiten hun eigen bereik en
 * sprongen bij de eerste aanraking naar een onzinwaarde.
 */
const BOUNDS_BY_PATH = {
  'layout.fit.width': [400, 2400, 10],
  'layout.fit.height': [300, 1600, 10],
  'layout.header.height': [0, 120, 1],
  'layout.header.fontSize': [6, 36, 1],
  'legend.box.width': [200, 800, 10],
  'legend.box.height': [200, 900, 10],
  'legend.scale': [0.5, 4, 0.05],
}

/**
 * Wat alleen voor één grafiektype geldt, staat hier apart — met paden
 * *binnen* de template-sectie, niet met "flower." ervoor. Een tweede type
 * voegt hier een blok toe en hoeft verder niets aan de inspector te
 * veranderen.
 */
const TEMPLATE_HINTS = {
  ridge: {
    bounds: {
      'plot.top': [10, 240, 5],
      'plot.bottom': [30, 240, 5],
      'plot.left': [40, 400, 5],
      'plot.right': [10, 400, 5],
      'overlap': [0, 4, 0.1],
      'smoothing': [0.3, 3, 0.05],
      'samples': [40, 500, 10],
      'fillOpacity': [0, 1, 0.01],
      'strokeWidth': [0, 6, 0.1],
      'labels.size': [7, 24, 1],
      'labels.offset': [0, 60, 1],
      'axis.size': [7, 24, 1],
      'axis.opacity': [0, 1, 0.01],
      'axis.gridOpacity': [0, 1, 0.01],
      'axis.tickLength': [0, 40, 1],
    },
    options: (columns) => ({ 'group.field': columns, 'axis.field': columns }),
  },

  bump: {
    bounds: {
      // Marges: een ondergrens omdat er tekst in staat, en een bovengrens
      // ruim onder de halve canvasmaat zodat het vlak nooit verdwijnt.
      'plot.top': [30, 240, 5],
      'plot.bottom': [30, 240, 5],
      'plot.left': [40, 560, 5],
      'plot.right': [40, 560, 5],
      'line.opacity': [0, 1, 0.01],
      'cursor.opacity': [0, 1, 0.01],
      'cursor.width': [0, 8, 0.25],
      'cursor.dotRadius': [0, 14, 0.5],
      'cursor.yearSize': [8, 32, 1],
      'dots.radius': [0, 10, 0.25],
      'dots.strokeWidth': [0, 5, 0.25],
      'labels.size': [7, 24, 1],
      'labels.offset': [0, 60, 1],
      'axis.size': [7, 24, 1],
      'axis.opacity': [0, 1, 0.01],
      'axis.gridOpacity': [0, 1, 0.01],
      'axis.tickLength': [0, 40, 1],
    },
    options: () => ({ 'line.curve': BUMP_CURVE_TYPES }),
  },

  flower: {
    // Structuurmarkering ($fields), geen instelling.
    skip: ['contour.anchors'],
    bounds: {
      'contour.anchorDots.radius': [0, 12, 0.5],
      'label.size': [6, 36, 1],
    },
    options: (columns) => ({
      'contour.curve': CURVE_TYPES,
      'contour.fill.type': ['solid', 'gradient'],
      'contour.fill.direction': ['radial', 'linear'],
      'contour.ghost.reference': ['first', 'last', 'mean'],
      'label.field': columns,
    }),
  },
}

/** Het pad binnen de template-sectie, of null als het er niet onder valt. */
function binnenTemplate(spec, path) {
  const prefix = `${templateKey(spec)}.`
  return path.startsWith(prefix) ? path.slice(prefix.length) : null
}

/** Grenzen per sleutelnaam, als het pad niets oplevert. */
const BOUNDS = {
  opacity: [0, 1, 0.01],
  fillOpacity: [0, 1, 0.01],
  dimOthersTo: [0, 1, 0.01],
  tension: [0, 1, 0.01],
  minScale: [0, 1, 0.01],
  spacing: [0.4, 1.6, 0.01],
  scale: [0.5, 4, 0.05],
  strokeWidth: [0, 8, 0.05],
  width: [0, 8, 0.05],
  radius: [0, 40, 0.5],
  size: [6, 36, 1],
  fontSize: [6, 36, 1],
  labelHeight: [0, 60, 1],
  offset: [0, 60, 1],
  gap: [0, 80, 1],
  margin: [0, 80, 1],
  hitPadding: [0, 40, 1],
  cellSize: [60, 300, 5],
  columns: [1, 12, 1],
  height: [200, 2000, 10],
  durationPerStep: [100, 3000, 50],
  max: [1, 6, 1],
  grain: [0, 1, 0.01],
}

/**
 * Keuzelijsten. De meeste komen uit de renderer zelf, zodat de inspector
 * niet kan aanbieden wat de renderer niet kent.
 */
function optionsFor(path, key, spec) {
  const columns = Object.keys(spec.data.labels ?? {})
  const table = {
    'layout.type': LAYOUT_TYPES,
    'layout.reorder': ['perYear', 'fixed'],
    'layout.sortBy.order': ['desc', 'asc'],
    'layout.sortBy.field': columns,
    'data.entity': columns,
    'data.time': columns,
    'data.scoreField': columns,
    'animation.ease': EASE_TYPES,
    'interaction.hover.highlight': ['self', 'sameRegion', 'none'],
    'interaction.hover.groupField': columns,
    'legend.position': ['left'],
    'legend.type': ['keyFlower'],
  }
  if (table[path]) return table[path]

  const eigen = binnenTemplate(spec, path)
  const hints = TEMPLATE_HINTS[templateKey(spec)]
  if (eigen && hints?.options) {
    const eigenTabel = hints.options(columns)
    if (eigenTabel[eigen]) return eigenTabel[eigen]
  }
  if (key === 'field') return columns
  if (key === 'scale') return SCALE_TYPES_LIST
  return null
}

const COLOR = /^#[0-9a-f]{3,8}$/i
const isColorList = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => COLOR.test(x))
const isNumberPair = (v) => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite)

/** Paden die je niet in een inspector wilt: tekst, afgeleide structuur. */
const SKIP = new Set([
  'meta',
  'data.fields',
  'data.labels',
  'interaction.controls',
  // Structurele koppelingen aan de dataset. Die horen niet tussen de
  // styling: één klik op een andere kolom en de hele tuin klapt in, terwijl
  // ze alleen samen met data.fields en data.labels zinvol te wijzigen zijn.
  'data.entity',
  'data.time',
  'data.scoreField',
])

/**
 * Het pad minus zijn sectie, als leesbaar kruimelspoor. Alleen de laatste
 * sleutel tonen zou in "Ordening" twee keer `columns`, twee keer `width`
 * en twee keer `show` opleveren - allemaal iets anders. Het pad zelf is
 * hier het duidelijkst, en het leert je meteen de spec kennen.
 */
function labelFor(path) {
  return path.split('.').slice(1).join(' · ')
}

function boundsFor(key, value, path, spec) {
  const eigen = binnenTemplate(spec, path)
  const eigenGrenzen = eigen ? TEMPLATE_HINTS[templateKey(spec)]?.bounds?.[eigen] : null
  const [min, max, step] = eigenGrenzen ?? BOUNDS_BY_PATH[path] ?? BOUNDS[key] ?? []
  if (min !== undefined) return { min, max, step }
  // Onbekend getal: een bereik rond de huidige waarde, zodat de slider
  // tenminste bruikbaar is in plaats van verkeerd.
  const span = Math.max(Math.abs(value) * 2, 10)
  return { min: 0, max: Math.round(span), step: span > 40 ? 1 : 0.1 }
}

/**
 * Loopt de spec af en levert een platte lijst velden met hun soort.
 * Encodings worden als één samengesteld veld teruggegeven; de compound
 * editor maakt daar drie controls van.
 */
export function describeSpec(spec) {
  const fields = []

  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      const here = path ? `${path}.${key}` : key
      if (SKIP.has(here)) continue
      const eigenPad = binnenTemplate(spec, here)
      if (eigenPad && TEMPLATE_HINTS[templateKey(spec)]?.skip?.includes(eigenPad)) continue

      const options = optionsFor(here, key, spec)

      // `null` betekent "niet ingevuld" - bijvoorbeeld layout.header.note of
      // legend.annotate.size, allebei ontsnappingsluiken voor een afgeleide
      // tekst. Overslaan zou ze onbereikbaar maken; leeg tonen niet.
      if (value === null) {
        fields.push({ path: here, key, label: labelFor(here), kind: 'text', value: '' })
        continue
      }
      if (value === undefined) continue
      if (isEncoding(value)) {
        fields.push({ path: here, key, label: labelFor(here), kind: 'encoding', value })
      } else if (typeof value === 'boolean') {
        fields.push({ path: here, key, label: labelFor(here), kind: 'boolean', value })
      } else if (typeof value === 'number') {
        fields.push({ path: here, key, label: labelFor(here), kind: 'number', value, ...boundsFor(key, value, here, spec) })
      } else if (typeof value === 'string') {
        const base = { path: here, key, label: labelFor(here), value }
        if (COLOR.test(value)) fields.push({ ...base, kind: 'color' })
        else if (options) fields.push({ ...base, kind: 'enum', options })
        else fields.push({ ...base, kind: 'text' })
      } else if (isColorList(value)) {
        fields.push({ path: here, key, label: labelFor(here), kind: 'colorList', value })
      } else if (isNumberPair(value)) {
        fields.push({ path: here, key, label: labelFor(here), kind: 'numberPair', value, ...boundsFor(key, value[1], here, spec) })
      } else if (Array.isArray(value)) {
        continue
      } else if (typeof value === 'object') {
        walk(value, here)
      }
    }
  }

  walk(spec, '')
  return fields
}

/** De velden gegroepeerd op hun bovenste spec-sectie, in spec-volgorde. */
export function groupFields(fields) {
  const groups = new Map()
  for (const field of fields) {
    const section = field.path.split('.')[0]
    if (!groups.has(section)) groups.set(section, [])
    groups.get(section).push(field)
  }
  return [...groups]
}
