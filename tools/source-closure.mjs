import fs from 'node:fs'
import path from 'node:path'

/**
 * Welke renderer-bestanden één grafiektype werkelijk nodig heeft.
 *
 * Volgt de imports vanaf Chart.jsx. Het register `templates.js` verwijst
 * naar álle types, dus dat bestand wordt onderweg vervangen door een versie
 * met alleen het gevraagde type - anders sleept een broncode-export van de
 * ridgeline de bloem en de bump chart mee.
 */
const MAP = 'src/renderer'

const bestaat = (basis) =>
  ['.jsx', '.js'].map((ext) => basis + ext).find((p) => fs.existsSync(p))

export function templatesBestand(template, component) {
  return `import ${component} from './${component}'

/**
 * Gegenereerd door de broncode-export: alleen het type dat je hebt
 * geëxporteerd. Het oorspronkelijke register kent er meer.
 */
export const TEMPLATES = { ${template}: ${component} }
export const TEMPLATE_TYPES = Object.keys(TEMPLATES)
`
}

export function closure(template, component) {
  const inhoud = new Map()
  inhoud.set(
    path.join(MAP, 'templates.js'),
    templatesBestand(template, component)
  )

  const gezien = new Set()
  const wachtrij = [path.join(MAP, 'Chart.jsx')]

  while (wachtrij.length) {
    const bestand = wachtrij.shift()
    if (gezien.has(bestand)) continue
    gezien.add(bestand)

    const tekst = inhoud.get(bestand) ?? fs.readFileSync(bestand, 'utf8')
    inhoud.set(bestand, tekst)

    for (const [, ref] of tekst.matchAll(/from '(\.\/[^']+)'/g)) {
      const doel = bestaat(path.join(MAP, ref.slice(2)))
      if (doel) wachtrij.push(doel)
    }
  }

  return inhoud
}
