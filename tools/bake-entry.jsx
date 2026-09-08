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

const data = csvParse(csv, autoType)

createRoot(document.getElementById('root')).render(
  <div style={{ background: spec.theme.background, minHeight: '100vh', padding: '1.5rem' }}>
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
    <Chart spec={spec} data={data} />
  </div>
)
