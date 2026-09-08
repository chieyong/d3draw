import { tooltipRows } from './captions'

/**
 * HTML boven de SVG, niet een <text> erin: tekst met regels en getallen
 * uitlijnen is in HTML triviaal en in SVG handwerk, en de tooltip mag
 * bovendien buiten het canvas uitsteken.
 */
export default function Tooltip({ spec, row, x, y }) {
  const style = spec.interaction.hover.tooltip.style
  const rows = tooltipRows(spec, row)

  const glass = style === 'glass'
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        // De muisaanwijzer mag zijn eigen tooltip niet raken, anders
        // flikkert de hover aan en uit.
        pointerEvents: 'none',
        transform: 'translate(12px, 12px)',
        zIndex: 2,
        minWidth: 190,
        padding: '0.6rem 0.75rem',
        borderRadius: 6,
        fontFamily: spec.theme.fontBody,
        fontSize: 11,
        lineHeight: 1.5,
        color: spec.legend?.color ?? spec.theme.ink,
        background: glass ? (spec.theme.tooltip?.background ?? spec.theme.background) : spec.theme.background,
        backdropFilter: glass && spec.theme.tooltip ? `blur(${spec.theme.tooltip.blur}px)` : undefined,
        border: '1px solid rgba(26, 26, 46, 0.18)',
        boxShadow: '0 4px 14px rgba(26, 26, 46, 0.12)',
      }}
    >
      {rows.map((line, i) => (
        <div
          key={line.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            fontWeight: i === 0 ? 500 : 400,
            opacity: i === 0 ? 1 : 0.85,
            marginBottom: i === 0 ? '0.35rem' : 0,
          }}
        >
          <span>{line.label}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{line.value}</span>
        </div>
      ))}
    </div>
  )
}
