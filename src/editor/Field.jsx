import { SCALE_TYPES_LIST } from '../renderer/editor-api'

const row = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }
const nameStyle = {
  flex: '0 0 9.5rem',
  opacity: 0.75,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const input = {
  fontFamily: 'inherit',
  fontSize: 11,
  color: 'inherit',
  background: 'transparent',
  border: '1px solid rgba(26,26,46,0.25)',
  borderRadius: 3,
  padding: '0.15rem 0.3rem',
}

function Num({ field, value, onChange }) {
  return (
    <>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, minWidth: 0 }}
      />
      <input
        type="number"
        value={value}
        step={field.step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...input, width: '3.6rem' }}
      />
    </>
  )
}

/**
 * Eén regel in de inspector. Welke control het wordt, is bepaald door
 * `kind` uit describeSpec() - de spec beslist, niet dit bestand.
 */
export default function Field({ field, labels, onChange }) {
  const { path, kind, value, label } = field
  const name = label

  if (kind === 'encoding') {
    // Een encoding is drie controls: waaraan hangt het, hoe schaalt het,
    // en tussen welke grenzen. Precies de tabel uit sectie 4.
    const columns = Object.keys(labels ?? {})
    const isColor = typeof value.range?.[0] === 'string'
    return (
      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ ...row, marginBottom: '0.25rem' }}>
          <span style={{ ...nameStyle, opacity: 1, fontWeight: 500 }}>{name}</span>
          <select
            value={value.field}
            onChange={(e) => onChange(`${path}.field`, e.target.value)}
            style={{ ...input, flex: 1, minWidth: 0 }}
          >
            {[value.field, ...columns.filter((c) => c !== value.field)].map((c) => (
              <option key={c} value={c}>
                {labels?.[c] ?? c}
              </option>
            ))}
          </select>
          <select
            value={value.scale}
            onChange={(e) => onChange(`${path}.scale`, e.target.value)}
            style={{ ...input, width: '4.2rem' }}
          >
            {SCALE_TYPES_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={row}>
          <span style={nameStyle} />
          {isColor ? (
            value.range.map((color, i) => (
              <input
                key={i}
                type="color"
                value={color}
                onChange={(e) => {
                  const next = [...value.range]
                  next[i] = e.target.value
                  onChange(`${path}.range`, next)
                }}
                style={{ ...input, width: '2.4rem', padding: 0, height: '1.4rem' }}
              />
            ))
          ) : (
            value.range.map((n, i) => (
              <input
                key={i}
                type="number"
                value={n}
                step={0.5}
                onChange={(e) => {
                  const next = [...value.range]
                  next[i] = Number(e.target.value)
                  onChange(`${path}.range`, next)
                }}
                style={{ ...input, width: '4rem' }}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <label style={row} title={path}>
      <span style={nameStyle}>{name}</span>
      {kind === 'number' && <Num field={field} value={value} onChange={(v) => onChange(path, v)} />}
      {kind === 'boolean' && (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(path, e.target.checked)}
          style={{ marginRight: 'auto' }}
        />
      )}
      {kind === 'color' && (
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(path, e.target.value)}
          style={{ ...input, width: '2.8rem', padding: 0, height: '1.4rem', marginRight: 'auto' }}
        />
      )}
      {kind === 'enum' && (
        <select
          value={value}
          onChange={(e) => onChange(path, e.target.value)}
          style={{ ...input, flex: 1, minWidth: 0 }}
        >
          {field.options.map((o) => (
            <option key={o} value={o}>
              {labels?.[o] ?? o}
            </option>
          ))}
        </select>
      )}
      {kind === 'text' && (
        <input
          type="text"
          value={value}
          // Sommige sleutels accepteren een getal óf een woord:
          // layout.fixedYear is "mean" of een jaartal. Een tekstveld levert
          // altijd een string, dus "2019" zou nooit matchen met year 2019 en
          // de tuin zou stilletjes leeg blijven. Ziet het eruit als een
          // getal, dan slaan we het op als getal.
          onChange={(e) => {
            const tekst = e.target.value.trim()
            const getal = Number(tekst)
            onChange(path, tekst !== '' && Number.isFinite(getal) ? getal : e.target.value)
          }}
          style={{ ...input, flex: 1, minWidth: 0 }}
        />
      )}
      {kind === 'numberPair' &&
        value.map((n, i) => (
          <input
            key={i}
            type="number"
            value={n}
            step={field.step}
            onChange={(e) => {
              const next = [...value]
              next[i] = Number(e.target.value)
              onChange(path, next)
            }}
            style={{ ...input, width: '4rem' }}
          />
        ))}
      {kind === 'colorList' &&
        value.map((color, i) => (
          <input
            key={i}
            type="color"
            value={color}
            onChange={(e) => {
              const next = [...value]
              next[i] = e.target.value
              onChange(path, next)
            }}
            style={{ ...input, width: '1.8rem', padding: 0, height: '1.4rem' }}
          />
        ))}
    </label>
  )
}
