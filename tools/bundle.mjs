/**
 * Bundelt het hele project in één markdown-bestand voor een review door
 * iemand — of iets — zonder voorkennis.
 *
 *   npm run bundle
 *
 * Levert export/review-bundle.md plus, als Chrome beschikbaar is,
 * export/review-screenshot.png. Een reviewer die de uitkomst niet ziet,
 * kan alleen over code oordelen en niet over de visualisatie.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const outDir = 'export'
const GROUPS = [
  ['Afspraken en ontwerp', ['CLAUDE.md', 'spec-schema-happiness-garden.md']],
  ['De spec (de bron van waarheid)', ['src/spec/happiness-garden.json']],
  ['Renderer — het exporteerbare product', listDir('src/renderer')],
  ['Editor — het omhulsel', listDir('src/editor')],
  ['Host en gereedschap', ['src/App.jsx', 'src/main.jsx', 'src/data/useData.js',
                           'package.json', 'vite.config.js',
                           'tools/preview.jsx', 'tools/bake.mjs', 'tools/bake-entry.jsx']],
]

function listDir(dir) {
  return fs.readdirSync(dir).sort().map((f) => path.join(dir, f))
}

const lang = (file) =>
  ({ '.json': 'json', '.md': 'markdown', '.js': 'js', '.jsx': 'jsx' })[path.extname(file)] ?? ''

const lines = (file) => fs.readFileSync(file, 'utf8').split('\n').length

const all = GROUPS.flatMap(([, files]) => files)
const total = all.reduce((n, f) => n + lines(f), 0)

let out = `# The Happiness Garden — volledige broncode voor review

Radiale contour-visualisatie in React + D3, en de aanzet tot een
Illustrator-achtige editor eromheen. ${all.length} bestanden, ${total} regels.

**Lees eerst \`CLAUDE.md\` en \`spec-schema-happiness-garden.md\` hieronder.**
Die twee leggen de afspraken en het ontwerp vast; de code volgt daaruit.

## De drie regels waar alles op rust

1. **De spec is de bron van waarheid.** Alles wat visueel is komt uit de
   JSON-spec. Geen hardcoded kleuren, diktes of marges in componenten.
   Een encoding is óf een vaste waarde óf \`{ field, scale, domain, range }\`.
2. **De renderer is het product.** \`src/renderer/\` moet standalone werken in
   een willekeurig React-project, accepteert alleen \`spec\` en \`data\` als
   props, en heeft geen enkele afhankelijkheid van de editor. De editor mag
   de renderer kennen; andersom niet.
3. **D3 rekent, React tekent.** D3 levert schalen, generators en layouts;
   React rendert de SVG. Geen \`d3.select\` op DOM die React beheert, geen
   \`d3.transition\`.

## Waar ik specifiek een oordeel over zoek

- **Houdt regel 2 stand?** De renderer importeert alleen \`react\` en \`d3\`.
  Maar is de scheiding ook inhoudelijk schoon, of zit er editor-denken in?
- **Hoe generiek is dit werkelijk?** De architectuur claimt dat er een
  tweede grafiektype bij kan zonder verbouwing. Ruwweg 58% van de code
  noemt bloem-begrippen. Welke bestanden zouden bij een tweede type
  opengebroken moeten worden, en is dat te voorkomen?
- **De afgeleide inspector** (\`src/editor/inspect.js\`) leidt controls af uit
  de spec in plaats van ze te declareren. Waar breekt die aanpak?
- **D3-gebruik**: zijn de keuzes verdedigbaar (lineRadial, cardinal vs
  catmullRom, sqrt op stralen en linear op lijndiktes, interpoleren op data
  in plaats van op paden, archimedische spiraal in plaats van phyllotaxis)?
- **Wat ontbreekt er dat je in productie zou missen?** Er zijn geen tests,
  geen types, geen toegankelijkheid, geen foutafhandeling rond data.

## Bestanden

`

for (const [title, files] of GROUPS) {
  out += `\n### ${title}\n\n`
  for (const f of files) out += `- \`${f}\` — ${lines(f)} regels\n`
}

out += '\n---\n'

for (const [title, files] of GROUPS) {
  out += `\n## ${title}\n`
  for (const f of files) {
    out += `\n### \`${f}\`\n\n\`\`\`${lang(f)}\n${fs.readFileSync(f, 'utf8').replace(/\n$/, '')}\n\`\`\`\n`
  }
}

fs.mkdirSync(outDir, { recursive: true })
const bundlePath = path.join(outDir, 'review-bundle.md')
fs.writeFileSync(bundlePath, out)
console.log(`${bundlePath}  ${Math.round(out.length / 1024)} kB  ${all.length} bestanden  ${total} regels`)

// Een plaatje van de uitkomst, zodat de reviewer niet alleen code ziet.
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const baked = path.resolve(outDir, 'the-happiness-garden.html')
if (fs.existsSync(chrome) && fs.existsSync(baked)) {
  const shot = path.join(outDir, 'review-screenshot.png')
  execFileSync(chrome, ['--headless', '--disable-gpu', '--virtual-time-budget=6000',
                        `--screenshot=${shot}`, '--window-size=1560,900', `file://${baked}`],
               { stdio: 'ignore' })
  console.log(`${shot}  ${Math.round(fs.statSync(shot).size / 1024)} kB`)
} else {
  console.log('(screenshot overgeslagen — draai eerst `npm run bake`)')
}
