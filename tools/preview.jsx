/**
 * Rendert de renderer server-side naar een SVG-bestand, zodat je kunt
 * controleren wat de app écht tekent zonder een browser te openen.
 *
 *   npm run preview                -> preview/happiness-garden.svg
 *   npm run preview -- perField    -> preview/happiness-garden-perField.svg
 *
 * Handig om twee spec-varianten naast elkaar te leggen, en om later een
 * render vast te leggen bij een stap die je af hebt.
 */
import fs from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { csvParse, autoType } from 'd3'
import Chart from '../src/renderer/Chart'

// npm run preview -- src/spec/it-gebruik-bump.json
const specPad = process.argv.find((a) => a.endsWith('.json')) ?? 'src/spec/happiness-garden.json'
const spec = JSON.parse(fs.readFileSync(specPad, 'utf8'))
const data = csvParse(fs.readFileSync(`public/${spec.data.source}`, 'utf8'), autoType)

// npm run preview -- perField        andere domain-modus
// npm run preview -- 2015            ander startjaar
const arg = process.argv.slice(2).find((a) => !a.endsWith('.json'))
if (arg && /^\d{4}$/.test(arg)) spec.preview[spec.data.time] = Number(arg)
else if (arg) spec.flower.contour.radius.domain = { mode: arg, from: 0 }

// Sinds de tijdslider levert de renderer een <div> met de SVG erin, dus
// dit is een HTML-bestand en geen SVG. De slider is hier een stilstaand
// plaatje: dit is een momentopname, geen draaiende app.
const markup = renderToStaticMarkup(<Chart spec={spec} data={data} />)
fs.mkdirSync('./preview', { recursive: true })
const naam = spec.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const out = `preview/${naam}${arg ? '-' + arg : ''}.html`
fs.writeFileSync(
  out,
  `<!doctype html><meta charset="utf-8"><title>${spec.meta.title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Mono&display=swap">
<body style="margin:0;padding:1.5rem;background:${spec.theme.background}">${markup}</body>`
)
console.log(out)
