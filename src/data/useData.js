import { useEffect, useState } from 'react'
import { csv, autoType } from 'd3'

/**
 * Laadt de dataset die de spec noemt (`data.source`). d3.autoType zet getallen om naar Number en
 * laat tekstkolommen (country, iso3, region) met rust.
 *
 * Retourneert { rows, status } - nog geen afgeleide velden; die komen
 * pas in stap 4/5 ($value, $delta) in data/derive.js.
 */
export function useData(bestand) {
  const [state, setState] = useState({ rows: null, status: 'loading' })

  useEffect(() => {
    let cancelled = false
    csv(`/${bestand}`, autoType)
      .then((rows) => {
        if (!cancelled) setState({ rows, status: 'ready' })
      })
      .catch((error) => {
        if (!cancelled) setState({ rows: null, status: 'error', error })
      })
    return () => {
      cancelled = true
    }
  }, [bestand])

  return state
}
