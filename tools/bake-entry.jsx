/**
 * De ingang van de gebakken export: alleen de renderer, de spec en de data.
 * Geen editor, geen inspector, geen geschiedenis.
 *
 * De CSV wordt als tekst meegebundeld in plaats van opgehaald, zodat het
 * resultaat ook vanaf file:// werkt - een klant kan het bestand openen
 * zonder server.
 */
import { createRoot } from 'react-dom/client'
import { csvParse, autoType } from 'd3'
import { Chart } from '../src/renderer'
import spec from 'virtual:spec'
import csv from 'virtual:data'
import kaal from 'virtual:embed'

const data = csvParse(csv, autoType)

/**
 * Meld de hoogte aan de pagina die dit bestand inbedt.
 *
 * Een iframe kan zijn eigen hoogte niet bepalen, dus moet de inbedder hem
 * raden - en dat gaat mis zodra de grafiek van vorm verandert. Deze melding
 * laat hem meegroeien. Wie het bestand los opent merkt er niets van.
 */
function meldHoogte() {
  if (window.parent === window) return
  const hoogte = document.documentElement.scrollHeight
  window.parent.postMessage({ type: 'd3draw:hoogte', hoogte, titel: spec.meta.title }, '*')
}
window.addEventListener('load', meldHoogte)
new ResizeObserver(meldHoogte).observe(document.documentElement)

createRoot(document.getElementById('root')).render(
  <div style={{ background: spec.theme.background, minHeight: '100vh', padding: '1.5rem', overflowX: 'auto' }}>
    {!kaal && (
      <>
    <h1
      style={{
        fontFamily: `${spec.theme.fontDisplay}, Georgia, serif`,
        fontWeight: 600,
        fontSize: '2rem',
        margin: '0 0 0.2rem',
        color: '#1a1a2e',
      }}
    >
      {spec.meta.title}
    </h1>
    <p
      style={{
        fontFamily: `${spec.theme.fontBody}, ui-monospace, monospace`,
        fontSize: '0.78rem',
        opacity: 0.7,
        margin: '0 0 1rem',
        color: '#1a1a2e',
      }}
    >
      {spec.meta.subtitle} · {spec.meta.source}
    </p>
      </>
    )}
    <Chart spec={spec} data={data} />
  </div>
)
