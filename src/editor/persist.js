import { validateSpec } from '../renderer'

const KEY = 'd3draw:spec'

/**
 * De spec bewaren en terughalen.
 *
 * Drie niveaus, bewust gescheiden:
 * - localStorage houdt je huidige sessie vast, zodat een herlaad je werk
 *   niet weggooit. Dit is een vangnet, geen archief.
 * - Een gedownload .json-bestand is het archief: dat is de spec, en de
 *   spec is het product.
 * - Een geladen bestand vervangt de spec volledig.
 *
 * localStorage kan stukgaan (privémodus, volle opslag, een browser die
 * site-data blokkeert), dus elke aanraking zit in een try/catch en faalt
 * stil terug op de spec uit het bestand.
 */

/**
 * Een bewaarde sessie samenvoegen met de spec uit het bestand.
 *
 * De sessie is een momentopname en veroudert zodra de spec nieuwe sleutels
 * krijgt. Zonder samenvoegen mist een oude sessie die sleutels, en crasht
 * een component die erop rekent - precies wat er gebeurde toen
 * `theme.tooltip` erbij kwam.
 *
 * Regel: de structuur komt uit het bestand, de waarden uit de sessie. Wat
 * de gebruiker heeft aangeraakt blijft dus staan; wat er sindsdien is
 * bijgekomen krijgt zijn standaardwaarde.
 */
export function mergeSpec(base, saved) {
  if (!saved || typeof saved !== 'object') return base
  if (Array.isArray(base) || Array.isArray(saved)) return saved
  if (typeof base !== 'object' || base === null) return saved

  const out = { ...base }
  for (const [key, value] of Object.entries(saved)) {
    out[key] =
      key in base && value !== null && typeof value === 'object' && !Array.isArray(value)
        ? mergeSpec(base[key], value)
        : value
  }
  return out
}

export function loadSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(spec) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(spec))
  } catch {
    // Vol of geblokkeerd: dan is er geen vangnet, en dat mag niet
    // betekenen dat de editor stukgaat.
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* zie boven */
  }
}

/** Downloadt tekst als bestand. Werkt voor zowel de spec als de SVG. */
export function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Pas vrijgeven nadat de browser de download heeft opgepakt.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadSpec(spec) {
  const name = `${slug(spec.meta.title)}.spec.json`
  download(name, JSON.stringify(spec, null, 2), 'application/json')
  return name
}

/**
 * Leest een gekozen .json en geeft de spec terug.
 *
 * De controle gebeurt met dezelfde validateSpec als de renderer gebruikt,
 * zonder data: die kent de editor hier nog niet. Zou dit bestand zelf
 * controleren op `spec.flower`, dan kende de editor het bloem-template bij
 * naam - precies wat regel 1 verbiedt.
 */
export function readSpecFile(file) {
  return file.text().then((text) => {
    const spec = JSON.parse(text)
    const problems = validateSpec(spec).filter((p) => p.level === 'error')
    if (problems.length > 0) {
      throw new Error(problems.map((p) => `${p.path || 'spec'} — ${p.message}`).join('; '))
    }
    return spec
  })
}

/**
 * De getekende SVG als los bestand. We serialiseren de node die er nú
 * staat, dus wat je exporteert is exact wat je ziet - inclusief het jaar
 * waar de tijdslider op staat.
 */
export function downloadSvg(node, spec) {
  const copy = node.cloneNode(true)
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copy.setAttribute('width', copy.viewBox.baseVal.width)
  copy.setAttribute('height', copy.viewBox.baseVal.height)
  const name = `${slug(spec.meta.title)}.svg`
  download(name, new XMLSerializer().serializeToString(copy), 'image/svg+xml')
  return name
}

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
