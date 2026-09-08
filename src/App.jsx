import { useState } from 'react'
import tuinSpec from './spec/happiness-garden.json'
import bumpSpec from './spec/it-gebruik-bump.json'
import ridgeSpec from './spec/montagetempo-ridge.json'
import { useData } from './data/useData'
import Editor from './editor/Editor'

/**
 * Host-laag. Kiest welke spec je bewerkt en laadt de dataset die díe spec
 * noemt (`data.source`). Twee grafiektypes op dezelfde motor.
 *
 * Wil je alleen de visualisatie zonder bewerkmogelijkheden, dan vervang je
 * <Editor> door <Chart spec={...} data={...} /> uit de renderer.
 */
const SPECS = {
  flower: { naam: 'The Happiness Garden', spec: tuinSpec },
  bump: { naam: 'De digitale kloof', spec: bumpSpec },
  ridge: { naam: 'Het tempo van de montage', spec: ridgeSpec },
}

const start = () => {
  const gevraagd = new URLSearchParams(window.location.search).get('spec')
  return SPECS[gevraagd] ? gevraagd : 'flower'
}

export default function App() {
  const [keuze, setKeuze] = useState(start)
  const spec = SPECS[keuze].spec
  const { rows, status, error } = useData(spec.data.source)

  if (status === 'error') {
    return <p style={{ padding: '2rem' }}>Data laden mislukt: {String(error)}</p>
  }
  if (status !== 'ready') {
    return <p style={{ padding: '2rem' }}>Data laden\u2026</p>
  }

  return (
    <Editor
      key={keuze}
      spec={spec}
      data={rows}
      specKeuze={{ opties: SPECS, actief: keuze, kies: setKeuze }}
    />
  )
}
