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
  ['Afspraken, ontwerp en voorgeschiedenis',
    ['README.md', 'CLAUDE.md', 'spec-schema-happiness-garden.md',
     'REVIEW-2026-09-06.md', 'PREDICTIE-bumpchart.md', 'PREDICTIE-ridgeline.md']],
  ['De specs (de bron van waarheid)', listDir('src/spec')],
  ['Renderer — host, gedeelde onderdelen en drie templates', listDir('src/renderer')],
  ['Editor — het omhulsel', listDir('src/editor')],
  ['Host', ['src/App.jsx', 'src/main.jsx', 'src/data/useData.js',
            'index.html', 'package.json', 'vite.config.js']],
  ['Gereedschap', listDir('tools')],
  ['Tests', listDir('tests')],
]

function listDir(dir) {
  return fs.readdirSync(dir).sort().map((f) => path.join(dir, f))
}

const lang = (file) =>
  ({ '.json': 'json', '.md': 'markdown', '.js': 'js', '.jsx': 'jsx' })[path.extname(file)] ?? ''

const lines = (file) => fs.readFileSync(file, 'utf8').split('\n').length

const all = GROUPS.flatMap(([, files]) => files)
const total = all.reduce((n, f) => n + lines(f), 0)

let out = `# D3draw — volledige broncode voor review

Een spec-gedreven motor voor maatwerk datavisualisaties in React + D3, met
een Illustrator-achtige editor eromheen. Drie grafiektypes draaien erop.
${all.length} bestanden, ${total} regels.

**Lees eerst \`README.md\`, \`CLAUDE.md\` en
\`spec-schema-happiness-garden.md\`.** Sectie 0 van dat laatste document legt
uit wat platform is en wat template; de rest van de code volgt daaruit.

## De drie regels waar alles op rust

1. **De spec is de bron van waarheid.** Alles wat visueel is komt uit de
   JSON-spec. Een eigenschap is óf een vaste waarde óf een encoding —
   \`{ field, scale, domain, range }\`. De inspector wordt uit de spec
   *afgeleid*, niet met de hand gebouwd.
2. **De renderer is het product.** Hij accepteert alleen \`spec\` en \`data\`,
   kent de editor niet, en is als één HTML-bestand of als React-project te
   leveren. Host-code mag geen grafiektype bij naam kennen.
3. **D3 rekent, React tekent.** Geen \`d3.select\` op DOM die React beheert,
   geen \`d3.transition\`.

## Voorgeschiedenis die je moet kennen

\`REVIEW-2026-09-06.md\` is een eerdere externe review; die is in vijf fases
afgewerkt. \`PREDICTIE-bumpchart.md\` en \`PREDICTIE-ridgeline.md\` zijn vóór
het bouwen van grafiektype 2 en 3 vastgelegd, om achteraf te kunnen toetsen
of de architectuur deed wat hij beloofde. Ze zijn na afloop bewust niet
bijgewerkt. De uitkomst: type 2 kostte 636 nieuwe regels en raakte drie
bestaande bestanden, type 3 kostte er 358 en raakte er twee.

## Waar ik een oordeel over zoek

- **Klopt de naad?** Host, gedeelde onderdelen en template zijn nu drie
  lagen binnen \`src/renderer/\`. Bij elk nieuw type bleek er host-code te
  zijn die stilzwijgend één template kende. Zit daar nog meer van, en is de
  huidige indeling de juiste?
- **Wat breekt bij een vierde type?** Vooral als dat een andere datavorm
  heeft dan de drie huidige (entiteit × tijd, en losse metingen per groep).
- **De afgeleide inspector** (\`src/editor/inspect.js\`) leidt controls af uit
  de spec, met twee handmatige tabellen voor grenzen en keuzelijsten. Waar
  breekt die aanpak, en is \`TEMPLATE_HINTS\` de juiste ontsnapping?
- **D3-gebruik.** Zijn de keuzes verdedigbaar: cardinal versus catmullRom,
  sqrt op stralen en linear op lijndiktes, interpoleren op data in plaats
  van op paden, archimedisch in plaats van phyllotaxis, kerndichtheid in
  pixelruimte met Silverman-bandbreedte?
- **De exportketen.** Eén HTML-bestand met alles erin, een React-project met
  alleen wat dat type nodig heeft, en een klantpakket eromheen. Wat mist er
  voor een echte oplevering?
- **Wat zou je in productie missen?** Er zijn 100 unit-tests en 28
  browser-rooktests, maar geen types, geen toegankelijkheidsaudit, en alle
  datasets zijn synthetisch.

Wees streng. Elk bestand bevat commentaar dat uitlegt *waarom* iets zo is;
die onderbouwing staat er ook als hij fout is. Twee keer eerder bleek een
goed onderbouwde keuze toch verkeerd — \`alpha\` als tension-knop, en
phyllotaxis voor een spiraal waarin de volgorde de betekenis draagt.

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
/**
 * Eén plaatje per grafiektype. Een reviewer die alleen code ziet kan niets
 * zeggen over de visualisatie zelf, en dat is de helft van het werk.
 *
 * De bestanden komen uit een pakket (`npm run package`) of uit een losse
 * bake; welke van de twee er ligt maakt niet uit.
 */
const specs = fs.readdirSync('src/spec').filter((f) => f.endsWith('.json'))
if (!fs.existsSync(chrome)) {
  console.log('(screenshots overgeslagen — Chrome niet gevonden)')
} else {
  for (const specBestand of specs) {
    const spec = JSON.parse(fs.readFileSync(path.join('src/spec', specBestand), 'utf8'))
    const naam = spec.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const kandidaten = [
      path.resolve(outDir, naam, 'visualisatie.html'),
      path.resolve(outDir, `${naam}.html`),
    ]
    const bron = kandidaten.find((p) => fs.existsSync(p))
    if (!bron) {
      console.log(`(geen export voor ${naam} — draai \`npm run package -- src/spec/${specBestand}\`)`)
      continue
    }
    const shot = path.join(outDir, `review-${naam}.png`)
    execFileSync(chrome, ['--headless', '--disable-gpu', '--virtual-time-budget=8000',
                          `--screenshot=${shot}`, '--window-size=1560,980', `file://${bron}`],
                 { stdio: 'ignore' })
    console.log(`${shot}  ${Math.round(fs.statSync(shot).size / 1024)} kB`)
  }
}
