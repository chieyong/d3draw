/**
 * De uitkomst van validateSpec in beeld. Fouten blokkeren het tekenen,
 * waarschuwingen niet - die staan erbij zodat je ze ziet zonder dat de
 * tuin verdwijnt.
 */
export default function SpecProblems({ problems, theme }) {
  if (problems.length === 0) return null
  // Bewuste uitzondering op "alles uit de spec": deze melding moet ook
  // kunnen tekenen wanneer juist de spec stuk of onvolledig is.
  const ink = theme?.ink ?? '#1a1a2e'

  return (
    <div
      role="alert"
      style={{
        fontFamily: `${theme?.fontBody ?? 'monospace'}, ui-monospace, monospace`,
        fontSize: 12,
        lineHeight: 1.6,
        color: ink,
        background: theme?.background ?? '#fdf6ec',
        border: '1px solid rgba(26,26,46,0.25)',
        borderRadius: 4,
        padding: '0.9rem 1.1rem',
        marginBottom: '0.75rem',
      }}
    >
      <strong>
        {problems.filter((p) => p.level === 'error').length > 0
          ? 'De spec past niet op deze data'
          : 'Let op'}
      </strong>
      <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem' }}>
        {problems.map((problem) => (
          <li key={`${problem.level}-${problem.path}-${problem.message}`} style={{ opacity: 0.85 }}>
            <code>{problem.path || 'spec'}</code> — {problem.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
