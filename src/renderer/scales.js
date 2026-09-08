import { scaleLinear, scaleSqrt, scaleLog, scaleOrdinal, max, min } from 'd3'
import { templateSpec } from './template'

const SCALE_TYPES = {
  linear: scaleLinear,
  sqrt: scaleSqrt,
  log: scaleLog,
  ordinal: scaleOrdinal,
}

/** Ordinaal werkt anders: het domein is de lijst unieke waarden. */
const isOrdinal = (encoding) => encoding.scale === 'ordinal'

/** Een spec-waarde is óf vast (getal/kleur) óf een encoding-object. */
/** Welke schaaltypes de renderer kent. De inspector leest deze lijst. */
export const SCALE_TYPES_LIST = Object.keys(SCALE_TYPES)

export function isEncoding(value) {
  return value !== null && typeof value === 'object' && 'range' in value
}

/**
 * Loopt een spec-tak af en roept `visit(encoding, pad)` aan voor elke
 * encoding die hij vindt. Eén plek die weet hoe je encodings opspoort;
 * daarop leunen de schalen, de interpolatie en de validatie.
 */
export function walkEncodings(node, path, visit) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return
  for (const [key, value] of Object.entries(node)) {
    const here = path ? `${path}.${key}` : key
    if (isEncoding(value)) visit(value, here)
    else walkEncodings(value, here, visit)
  }
}


/**
 * Bepaalt het domein uit een lijst waarden.
 *
 * `from: 0`     -> [0, max]   nul blijft nul; alleen de bovengrens beweegt
 * `from: "min"` -> [min, max] benut het volle bereik, maar is instabiel:
 *                  één land toevoegen of weglaten verandert elke vorm.
 */
function domainFrom(values, { from = 0 } = {}) {
  const lower = from === 'min' ? min(values) : 0
  return [lower, max(values)]
}

function buildScale(encoding, domain) {
  if (encoding.scale === 'log' && domain[0] <= 0) {
    throw new Error(
      `Schaal "log" kan niet bij een domein dat op ${domain[0]} begint. ` +
        `Zet domain.from op "min" of kies een andere schaal.`
    )
  }
  const create = SCALE_TYPES[encoding.scale] ?? scaleLinear
  // Clampen, altijd. Bij domeinen die uit de data komen verandert dit
  // niets - daar ligt per definitie niets buiten. Het telt bij handgezette
  // domeinen zoals [1, 3.2] op de steel: een waarde eronder extrapoleert
  // anders naar een negatieve straal, en dat is ongeldige SVG die stil
  // faalt in plaats van een foutmelding te geven.
  return create().domain(domain).range(encoding.range).clamp(true)
}

/**
 * Bouwt één schaal voor een encoding die naar één kolom kijkt (stem.radius).
 * De waarden komen uit ALLE rijen, dus over alle jaren: anders ademt de
 * schaal mee tijdens de animatie en verliest de kijker zijn referentiekader.
 */
function scaleForField(encoding, data) {
  if (isOrdinal(encoding)) {
    const categorieen = Array.isArray(encoding.domain)
      ? encoding.domain
      : [...new Set(data.map((row) => row[encoding.field]))]
    const schaal = scaleOrdinal().domain(categorieen).range(encoding.range)
    return (row) => schaal(row[encoding.field])
  }

  const values = data.map((row) => row[encoding.field])
  const scale = Array.isArray(encoding.domain)
    ? buildScale(encoding, encoding.domain)
    : buildScale(encoding, domainFrom(values, encoding.domain))
  return (row) => scale(row[encoding.field])
}

/**
 * Bouwt de straal-schaal voor de contour. Die kijkt niet naar één kolom maar
 * naar `$value`: de waarde van het ankerpunt dat op dat moment getekend wordt.
 * Daarom twee modi:
 *
 * - "shared"   : één domein over alle zes de velden samen. De zes kolommen
 *                zijn bijdragen aan de ladderscore in dezelfde eenheid, dus
 *                de lengtes zijn onderling vergelijkbaar en het oppervlak
 *                van de bloem zegt iets over de score.
 * - "perField" : elk veld zijn eigen bovengrens. Vormen worden gevarieerder,
 *                maar de lengtes zijn niet meer onderling vergelijkbaar.
 *
 * Retourneert, net als scaleForField, een functie die een rij aanneemt:
 * (rij, veldindex) -> straal. De aanroeper hoeft de kolomnaam niet te kennen.
 */
function scaleForAnchors(encoding, data, fields) {
  if (Array.isArray(encoding.domain)) {
    const scale = buildScale(encoding, encoding.domain)
    return (row, fieldIndex) => scale(row[fields[fieldIndex]])
  }

  const { mode = 'shared' } = encoding.domain ?? {}

  if (mode === 'perField') {
    const perField = fields.map((field) =>
      buildScale(encoding, domainFrom(data.map((row) => row[field]), encoding.domain))
    )
    return (row, fieldIndex) => perField[fieldIndex](row[fields[fieldIndex]])
  }

  const allValues = data.flatMap((row) => fields.map((field) => row[field]))
  const shared = buildScale(encoding, domainFrom(allValues, encoding.domain))
  return (row, fieldIndex) => shared(row[fields[fieldIndex]])
}

/**
 * Alle schalen van de visualisatie, één keer gebouwd uit spec + volledige
 * dataset, gekeyd op hun spec-pad.
 *
 * Bewust géén lijst met `stem.radius`, `contour.radius` enzovoort bij naam:
 * die tabel zou bij elke nieuwe encoding in de spec bijgewerkt moeten
 * worden, en bij een tweede template opnieuw. Nu levert elke encoding die
 * in de template-sectie staat vanzelf een schaal op.
 *
 * Dit is ook de naad waar een latere "gebakken" export op aansluit: daar
 * worden deze functies vervangen door ingevulde constanten.
 */
export function buildScales(spec, data) {
  const scales = {}
  walkEncodings(templateSpec(spec), '', (encoding, path) => {
    scales[path] =
      encoding.field === '$value'
        ? scaleForAnchors(encoding, data, spec.data.fields)
        : scaleForField(encoding, data)
  })
  return scales
}

/**
 * Een kale d3-schaal uit een {scale, domain, range}-blok.
 *
 * De andere schaal-functies leveren "geef een rij, krijg een waarde" - dat
 * is wat een encoding is. Een as is iets anders: die moet een wíllekeurige
 * waarde kunnen omzetten, ook eentje die in geen enkele rij voorkomt (het
 * midden van een verdeling bijvoorbeeld). Vandaar deze aparte ingang.
 */
export function scaleFor({ scale = 'linear', domain, range }) {
  const create = SCALE_TYPES[scale] ?? scaleLinear
  return create().domain(domain).range(range).clamp(true)
}

/**
 * De schaal op een pad, of - als daar een vaste waarde staat in plaats van
 * een encoding - een functie die die waarde teruggeeft. Zo blijft "vast óf
 * gekoppeld" zichtbaar op de plek waar de waarde gebruikt wordt.
 */
export function scaleAt(scales, path, fixed) {
  return scales[path] ?? (() => fixed)
}
