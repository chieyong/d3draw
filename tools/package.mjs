/**
 * Bouwt één map die je naar een klant kunt sturen.
 *
 *   npm run package -- src/spec/montagetempo-ridge.json
 *   npm run package -- src/spec/montagetempo-ridge.json --zip
 *
 * De losse exportvormen bestonden al; wat ontbrak was het pakket eromheen.
 * Een klant die een los HTML-bestand krijgt weet niet of hij het mag
 * hosten, hoe hij het inbedt, waar de cijfers vandaan komen, of wat hij
 * moet doen als de data volgend jaar bijgewerkt is.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { closure } from './source-closure.mjs'

/** Welk component hoort bij welk type — nodig om de broncode te snoeien. */
const COMPONENTEN = { flower: 'Garden', bump: 'BumpChart', ridge: 'RidgeChart' }

const args = process.argv.slice(2)
const specPad = args.find((a) => a.endsWith('.json')) ?? 'src/spec/happiness-garden.json'
const zippen = args.includes('--zip')

const spec = JSON.parse(fs.readFileSync(specPad, 'utf8'))
const slug = spec.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const map = path.join('export', slug)

const run = (cmd, argv) =>
  execFileSync(cmd, argv, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' })

fs.rmSync(map, { recursive: true, force: true })
fs.mkdirSync(map, { recursive: true })

// 1 & 2 — de twee interactieve varianten
run('node', ['tools/bake.mjs', specPad])
run('node', ['tools/bake.mjs', specPad, '--embed'])
fs.renameSync(path.join('export', `${slug}.html`), path.join(map, 'visualisatie.html'))
fs.renameSync(path.join('export', `${slug}-embed.html`), path.join(map, 'visualisatie-embed.html'))

// 3 — de statische tekening, uit de server-side render geplukt
run('npm', ['run', 'preview', '--silent', '--', specPad])
const previewPad = path.join('preview', `${slug}.html`)
const html = fs.readFileSync(previewPad, 'utf8')
const svg = html
  .slice(html.indexOf('<svg'), html.indexOf('</svg>') + 6)
  .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  .replace(/width="100%"/, `width="${spec.layout.fit.width}" height="${spec.layout.fit.height}"`)
fs.writeFileSync(path.join(map, 'visualisatie.svg'), svg)

// 4 — data en spec
fs.copyFileSync(path.join('public', spec.data.source), path.join(map, 'data.csv'))
fs.writeFileSync(path.join(map, 'spec.json'), JSON.stringify(spec, null, 2) + '\n')

// 4b — broncode: een draaiend React-project met alleen wat dit type nodig heeft.
// Altijd meegeleverd: het is een deelverzameling van wat je toch al maakt, en
// wat je uiteindelijk deelt bepaal je bij het versturen, niet hier.
{
  const bron = path.join(map, 'broncode')
  const component = COMPONENTEN[spec.template]
  if (!component) {
    console.error(`Onbekend type "${spec.template}"; broncode-export overgeslagen.`)
  } else {
    fs.mkdirSync(path.join(bron, 'src', 'renderer'), { recursive: true })
    fs.mkdirSync(path.join(bron, 'public'), { recursive: true })

    for (const [bestand, inhoud] of closure(spec.template, component)) {
      fs.writeFileSync(path.join(bron, 'src', 'renderer', path.basename(bestand)), inhoud)
    }

    fs.copyFileSync(path.join('public', spec.data.source), path.join(bron, 'public', spec.data.source))
    fs.writeFileSync(path.join(bron, 'src', 'spec.json'), JSON.stringify(spec, null, 2) + '\n')

    fs.writeFileSync(path.join(bron, 'package.json'), JSON.stringify({
      name: slug,
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
      dependencies: { d3: '^7.9.0', react: '^18.3.1', 'react-dom': '^18.3.1' },
      devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.7' },
    }, null, 2) + '\n')

    fs.writeFileSync(path.join(bron, 'vite.config.js'),
      "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\n" +
      "export default defineConfig({ plugins: [react()] })\n")

    fs.writeFileSync(path.join(bron, 'index.html'),
      `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${spec.meta.title}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(spec.theme.fontDisplay)}:wght@400;600&family=${encodeURIComponent(spec.theme.fontBody)}&display=swap" />
  </head>
  <body style="margin: 0">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`)

    fs.writeFileSync(path.join(bron, 'src', 'main.jsx'),
      `import { createRoot } from 'react-dom/client'
import { csv, autoType } from 'd3'
import Chart from './renderer/Chart'
import spec from './spec.json'

/**
 * De hele visualisatie is <Chart spec data />. De spec bepaalt alles wat je
 * ziet: kleuren, schalen, ordening. Draai aan spec.json en de grafiek volgt.
 */
csv(\`/\${spec.data.source}\`, autoType).then((data) => {
  createRoot(document.getElementById('root')).render(
    <div style={{ background: spec.theme.background, minHeight: '100vh', padding: '1.5rem' }}>
      <Chart spec={spec} data={data} />
    </div>
  )
})
`)

    const kern = { flower: 'geometry.js', bump: 'bump-geometry.js', ridge: 'ridge-geometry.js' }[spec.template]
    fs.writeFileSync(path.join(bron, 'README.md'),
      `# ${spec.meta.title} — broncode

${spec.meta.subtitle}

\`\`\`
npm install
npm run dev
\`\`\`

Drie afhankelijkheden: React, react-dom en d3. Verder niets.

## Waar wat staat

| pad | wat |
|---|---|
| \`src/spec.json\` | **hier draai je aan de knoppen** — kleuren, schalen, ordening |
| \`public/${spec.data.source}\` | de data |
| \`src/renderer/${kern}\` | het d3-rekenwerk: schalen, curves, posities |
| \`src/renderer/scales.js\` | vertaalt een encoding uit de spec naar een d3-schaal |
| \`src/renderer/Chart.jsx\` | de ingang: valideert de spec en kiest het grafiektype |

Alles wat visueel is komt uit \`spec.json\`. Een eigenschap is óf een vaste
waarde óf een *encoding* — \`{ field, scale, domain, range }\` — die een
kolom uit de data op een visuele eigenschap afbeeldt. D3 rekent, React
tekent: er staat nergens een \`d3.select\` op DOM die React beheert.

Deze map bevat alleen de bestanden die dít grafiektype nodig heeft
(${closure(spec.template, component).size} stuks). De motor waaruit dit
gegenereerd is kent er meer.
`)
  }
}

// 5 — de leesmij, in de vormgeving van de visualisatie zelf
const voorbeelddata = /voorbeeld|sample|synth/i.test(spec.meta.source ?? '')
const t = spec.theme
const kb = (p) => `${Math.round(fs.statSync(path.join(map, p)).size / 1024)} kB`

fs.writeFileSync(
  path.join(map, 'LEESMIJ.html'),
  `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${spec.meta.title} — leesmij</title>
<style>
  body { max-width: 46rem; margin: 0 auto; padding: 3rem 1.5rem 6rem;
         background: ${t.background}; color: ${t.ink};
         font-family: "${t.fontBody}", ui-monospace, monospace; font-size: 14px; line-height: 1.7; }
  h1 { font-family: "${t.fontDisplay}", Georgia, serif; font-weight: 600; font-size: 2.1rem; margin: 0 0 .2rem; }
  h2 { font-family: "${t.fontDisplay}", Georgia, serif; font-weight: 600; font-size: 1.35rem; margin: 2.4rem 0 .6rem; }
  .sub { opacity: .7; margin: 0 0 2rem; }
  table { border-collapse: collapse; width: 100%; margin: .5rem 0 1rem; }
  td { padding: .45rem .6rem .45rem 0; vertical-align: top; border-bottom: 1px solid rgba(0,0,0,.08); }
  td:first-child { white-space: nowrap; font-weight: 500; }
  code, pre { background: rgba(0,0,0,.05); border-radius: 3px; }
  code { padding: .1rem .3rem; }
  pre { padding: .8rem 1rem; overflow-x: auto; font-size: 12.5px; }
  .let-op { border-left: 3px solid ${t.accent}; padding: .8rem 0 .8rem 1rem; margin: 1.5rem 0; }
</style></head><body>

<h1>${spec.meta.title}</h1>
<p class="sub">${spec.meta.subtitle}</p>
${
  voorbeelddata
    ? `<div class="let-op"><strong>Let op: dit is voorbeelddata.</strong> De cijfers in deze
  visualisatie zijn realistisch gemodelleerd maar niet echt. Ze hebben de structuur van
  ${spec.meta.source}, zodat echte metingen er zonder aanpassing in passen. Publiceer dit
  niet als feitelijke informatie.</div>`
    : ''
}

<h2>Wat zit erin</h2>
<table>
  <tr><td>visualisatie.html</td><td>De interactieve versie met titel. Dubbelklikken opent hem
    in je browser — geen installatie, geen internetverbinding nodig. ${kb('visualisatie.html')}</td></tr>
  <tr><td>visualisatie-embed.html</td><td>Dezelfde grafiek zonder titel, voor als hij in een
    pagina komt waar de kop er al boven staat. ${kb('visualisatie-embed.html')}</td></tr>
  <tr><td>visualisatie.svg</td><td>De tekening als vectorbestand, voor drukwerk of om te
    openen in Illustrator. Niet interactief: de bedieningselementen en de toelichtende
    zinnen eronder zitten er niet in, de legenda wel. ${kb('visualisatie.svg')}</td></tr>
  <tr><td>data.csv</td><td>De cijfers waarop de grafiek gebaseerd is, zodat alles
    controleerbaar is. ${kb('data.csv')}</td></tr>
  <tr><td>spec.json</td><td>De instellingen: kleuren, schalen, ordening. Hiermee is de
    visualisatie later bij te werken zonder opnieuw te beginnen.</td></tr>
</table>

<h2>Op je eigen site zetten</h2>
<p>Zet <code>visualisatie.html</code> op je server en link ernaar, óf bed hem in met een
iframe. Het bestand meldt zelf hoe hoog het is, zodat het kader kan meegroeien:</p>
<pre>&lt;iframe id="viz" src="visualisatie-embed.html"
        style="width:100%;border:0;display:block"&gt;&lt;/iframe&gt;
&lt;script&gt;
  addEventListener('message', (e) =&gt; {
    if (e.data?.type !== 'd3draw:hoogte') return
    document.getElementById('viz').style.height = e.data.hoogte + 'px'
  })
&lt;/script&gt;</pre>

<h2>Breedte</h2>
<p>Deze grafiek heeft minstens <strong>${spec.layout.fit.minWidth ?? spec.layout.fit.width} pixels</strong>
breedte nodig om leesbaar te blijven. In een smallere kolom schuift hij horizontaal
in plaats van te krimpen — anders zou de tekst mee verkleinen tot ze onleesbaar wordt.
Op een telefoon is dat een compromis; laat het weten als een aparte mobiele versie
gewenst is.</p>

<h2>Herkomst van de cijfers</h2>
<p>${spec.meta.source}</p>

<h2>Bijwerken</h2>
<p>Nieuwe cijfers in dezelfde vorm als <code>data.csv</code> zijn genoeg om de visualisatie
opnieuw te maken. <code>spec.json</code> bevat alle vormgevingskeuzes, dus die blijven
ongewijzigd.</p>

</body></html>
`
)

const bestanden = fs.readdirSync(map).sort()
console.log(`${map}/`)
for (const f of bestanden) {
  const p = path.join(map, f)
  if (fs.statSync(p).isDirectory()) {
    const n = fs.readdirSync(path.join(p, 'src', 'renderer')).length
    console.log(`  ${(f + '/').padEnd(26)} React-project, ${n} renderer-bestanden`)
  } else {
    console.log(`  ${f.padEnd(26)} ${kb(f)}`)
  }
}

if (zippen) {
  const zip = `${map}.zip`
  fs.rmSync(zip, { force: true })
  execFileSync('zip', ['-rq', path.basename(zip), path.basename(map)], { cwd: 'export' })
  console.log(`\n${zip}  ${Math.round(fs.statSync(zip).size / 1024)} kB`)
}
