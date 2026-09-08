/**
 * Bakt een standalone HTML-bestand: renderer + spec + data in één bestand,
 * zonder bouwstap voor de ontvanger.
 *
 *   npm run bake                       gebruikt src/spec/happiness-garden.json
 *   npm run bake -- mijn.spec.json     gebruikt een geëxporteerde spec
 *
 * De virtual:-modules laten de spec en de data als constante in de bundel
 * landen in plaats van als fetch. Zo werkt het bestand ook vanaf file://.
 */
import fs from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'
import { inlineFonts } from './fonts.mjs'

const specPath = process.argv[2] ?? 'src/spec/happiness-garden.json'
const outDir = 'export'

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
// De dataset komt uit de spec zelf. Stond hier eerst één bestandsnaam
// hardcoded; bij het tweede grafiektype bakte dat de verkeerde data in en
// kreeg de klant een foutmelding in plaats van een grafiek.
//
// `data.source` is het pad zoals de brówser het ziet; op schijf staat dat
// onder public/. Eén plek voor de datasets, anders lopen twee kopieën uit
// elkaar zonder dat iemand het merkt.
const dataPath = spec.data.source
if (!dataPath) {
  console.error(`${specPath} noemt geen data.source`)
  process.exit(1)
}
const csv = fs.readFileSync(`public/${dataPath}`, 'utf8')

const inline = {
  name: 'inline-spec-en-data',
  setup(build) {
    build.onResolve({ filter: /^virtual:/ }, (args) => ({ path: args.path, namespace: 'virtual' }))
    build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => ({
      contents:
        args.path === 'virtual:spec'
          ? `export default ${JSON.stringify(spec)}`
          : `export default ${JSON.stringify(csv)}`,
      loader: 'js',
    }))
  },
}

const result = await esbuild.build({
  entryPoints: ['tools/bake-entry.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [inline],
  write: false,
  logLevel: 'error',
})

const js = result.outputFiles[0].text

// Fonts inbakken in plaats van bij Google ophalen: geen bezoeker-IP naar
// een derde partij, en het bestand werkt ook zonder internet.
const fonts = await inlineFonts([spec.theme.fontDisplay, spec.theme.fontBody])
if (fonts.reden) {
  console.warn(`  let op: fonts niet ingebakken (${fonts.reden}); de export valt terug op systeemfonts`)
}
const slug = spec.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const out = path.join(outDir, `${slug}.html`)

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(
  out,
  `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${spec.meta.title}</title>
<style>${fonts.css}</style>
</head>
<body style="margin:0">
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`
)

const kb = (n) => `${Math.round(n / 1024)} kB`
console.log(`${out}  ${kb(fs.statSync(out).size)}  (spec: ${specPath}, ${fonts.ingebakken} fonts ingebakken)`)
