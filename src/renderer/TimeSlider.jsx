import { labelOf } from './captions'

/**
 * De tijdslider hoort bij de visualisatie, niet bij de editor: hij staat in
 * interaction.controls van de spec en gaat dus mee in de export.
 *
 * HTML in plaats van SVG. Een <input type="range"> geeft je toetsenbediening,
 * touch en schermlezer-ondersteuning gratis; een zelfgetekende slider in SVG
 * moet dat allemaal nabouwen.
 */
export default function TimeSlider({ spec, control, timeline }) {
  const { index, playing, seek, toggle, years } = timeline
  const i0 = Math.floor(index)
  const fraction = index - i0

  const reading =
    fraction < 0.02 || i0 >= years.length - 1
      ? `${years[Math.round(index)]}`
      : `${years[i0]} → ${years[i0 + 1]}`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 0',
        fontFamily: spec.theme.fontBody,
        fontSize: 12,
        color: spec.legend?.color ?? spec.theme.ink,
      }}
    >
      {control.showPlayButton && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pauzeer' : 'Speel af'}
          style={{
            fontFamily: 'inherit',
            fontSize: 12,
            cursor: 'pointer',
            border: `1px solid currentColor`,
            borderRadius: 3,
            background: 'transparent',
            color: 'inherit',
            padding: '0.3rem 0.7rem',
            minWidth: '4.5rem',
          }}
        >
          {playing ? '❙❙ pauze' : '▶ speel'}
        </button>
      )}

      <input
        type="range"
        min={0}
        max={years.length - 1}
        step={0.01}
        value={index}
        onChange={(event) => seek(Number(event.target.value))}
        aria-label={labelOf(spec, control.field)}
        // theme.accent, niet de kleur van de bloemsteel: een control uit
        // interaction.controls hoort niets van de template te weten.
        style={{ flex: 1, accentColor: spec.theme.accent }}
      />

      <span style={{ minWidth: '7.5rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {reading}
      </span>
    </div>
  )
}
