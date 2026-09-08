/**
 * Een control is niets anders dan een UI-element dat één spec-pad
 * aanstuurt - dezelfde mechaniek als de inspector, alleen zichtbaar voor
 * de eindgebruiker. `binds` zegt welk pad.
 */
export default function Select({ spec, control, value, options, onChange }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: spec.theme.fontBody,
        fontSize: 12,
        color: spec.legend?.color ?? spec.theme.ink,
      }}
    >
      {control.label}
      <select
        value={value}
        onChange={(event) => onChange(control.binds, event.target.value)}
        style={{
          fontFamily: 'inherit',
          fontSize: 12,
          color: 'inherit',
          background: 'transparent',
          border: '1px solid currentColor',
          borderRadius: 3,
          padding: '0.3rem 0.4rem',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
