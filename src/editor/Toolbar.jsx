import { useRef, useState } from 'react'
import { downloadSpec, downloadSvg, readSpecFile } from './persist'

const button = {
  fontFamily: 'inherit',
  fontSize: 11,
  cursor: 'pointer',
  padding: '0.3rem 0.6rem',
  borderRadius: 3,
  border: '1px solid rgba(26,26,46,0.35)',
  background: 'transparent',
  color: '#1a1a2e',
}

/**
 * Opslaan, openen, exporteren.
 *
 * De spec is het product: hem downloaden is het archief. localStorage is
 * alleen een vangnet tegen een herlaad, en dat onderscheid staat ook in
 * de meldingen, zodat niemand denkt dat zijn werk veilig is omdat het
 * "vanzelf onthouden" wordt.
 */
export default function Toolbar({ spec, history, canvasRef }) {
  const fileInput = useRef(null)
  const [message, setMessage] = useState(null)
  const [bezig, setBezig] = useState(false)

  const say = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(null), 8000)
  }

  const open = (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // zelfde bestand nog eens kunnen kiezen
    if (!file) return
    readSpecFile(file)
      .then((loaded) => {
        history.replace(loaded)
        say(`${file.name} geladen — Cmd-Z maakt het ongedaan`)
      })
      .catch((error) => say(`Laden mislukt: ${error.message}`))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 11 }}>
      {message && (
        <span style={{ opacity: 0.7, marginRight: '0.4rem', fontFamily: spec.theme.fontBody }}>
          {message}
        </span>
      )}

      <button type="button" style={button} onClick={() => say(`${downloadSpec(spec)} opgeslagen`)}>
        Spec opslaan
      </button>

      <button type="button" style={button} onClick={() => fileInput.current?.click()}>
        Spec openen
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        onChange={open}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        style={button}
        onClick={() => {
          const svg = canvasRef.current?.querySelector('svg')
          if (!svg) return say('Geen tekening gevonden')
          say(`${downloadSvg(svg, spec)} geëxporteerd`)
        }}
      >
        SVG exporteren
      </button>

      {/*
        Alleen tijdens ontwikkelen: dit leunt op een eindpunt in de
        Vite-server, want een browser kan zelf geen pakket bouwen. In een
        gebouwde versie bestaat die server niet, en dan hoort de knop er ook
        niet te staan.
      */}
      {import.meta.env?.DEV &&
        [
          ['Pakket', false],
          ['Pakket + code', true],
        ].map(([naam, broncode]) => (
          <button
            key={naam}
            type="button"
            style={{ ...button, opacity: bezig ? 0.5 : 1 }}
            disabled={bezig}
            onClick={() => {
              setBezig(true)
              say('Pakket bouwen…')
              fetch('/__pakket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spec, broncode }),
              })
                .then((r) => r.json())
                .then((uit) =>
                  say(uit.ok ? `${uit.zip} klaar` : `Mislukt: ${uit.fout}`)
                )
                .catch((fout) => say(`Mislukt: ${fout.message}`))
                .finally(() => setBezig(false))
            }}
          >
            {naam}
          </button>
        ))}
    </div>
  )
}
