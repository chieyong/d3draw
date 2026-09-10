import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

/**
 * Een eindpunt tijdens ontwikkelen dat een klantpakket bouwt van de spec
 * die op dat moment op het scherm staat.
 *
 * Een browser kan geen npm draaien, maar tijdens `npm run dev` draait er wél
 * een Node-proces: dit. De editor stuurt zijn huidige spec hierheen -
 * inclusief wijzigingen die je nog niet hebt opgeslagen - en krijgt het pad
 * naar het pakket terug.
 *
 * Dit is gereedschap, geen product. Het zit alleen in de ontwikkelserver en
 * belandt nooit in een geëxporteerd bestand.
 */
export function pakketEindpunt() {
  return {
    name: 'd3draw-pakket',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__pakket', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end()
        }

        let body = ''
        req.on('data', (stuk) => {
          body += stuk
          if (body.length > 5e6) req.destroy()
        })
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json')
          let tijdelijk
          try {
            const { spec } = JSON.parse(body)
            tijdelijk = path.join(os.tmpdir(), `d3draw-${Date.now()}.json`)
            fs.writeFileSync(tijdelijk, JSON.stringify(spec, null, 2))

            const uitvoer = execFileSync(
              'node',
              ['tools/package.mjs', tijdelijk, '--zip'],
              { encoding: 'utf8' }
            )

            const map = uitvoer.split('\n')[0].trim().replace(/\/$/, '')
            res.end(JSON.stringify({ ok: true, map, zip: `${map}.zip`, uitvoer }))
          } catch (fout) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, fout: String(fout.message ?? fout) }))
          } finally {
            if (tijdelijk) fs.rmSync(tijdelijk, { force: true })
          }
        })
      })
    },
  }
}
