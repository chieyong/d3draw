import { useMemo } from 'react'
import ErrorBoundary from './ErrorBoundary'
import SpecProblems from './SpecProblems'
import { validateSpec, hasErrors } from './validate'
import { templateKey } from './template'
import { TEMPLATES, TEMPLATE_TYPES } from './templates'

/**
 * De publieke ingang: <Chart spec={...} data={...} />.
 *
 * De host. Hij kijkt of de spec op deze data past, kiest het grafiektype,
 * en zet er een vangnet omheen. Wat er getekend wordt weet hij niet — dat
 * is aan de template.
 *
 * `data` is de VOLLEDIGE dataset, alle jaren. Niet de rijen van één jaar:
 * de schaaldomeinen moeten over alle jaren berekend worden, en een
 * template die alleen het huidige jaar kreeg kan die regel niet naleven.
 */
export default function Chart({ spec, data }) {
  const problems = useMemo(() => validateSpec(spec, data), [spec, data])

  if (hasErrors(problems)) {
    return <SpecProblems problems={problems} theme={spec?.theme} />
  }

  const Template = TEMPLATES[templateKey(spec)]
  if (!Template) {
    return (
      <SpecProblems
        theme={spec.theme}
        problems={[
          {
            level: 'error',
            path: 'template',
            message: `Onbekend grafiektype "${templateKey(spec)}". Beschikbaar: ${TEMPLATE_TYPES.join(', ')}.`,
          },
        ]}
      />
    )
  }

  // Een ondergrens op de breedte. Zonder dat schaalt de hele tekening mee
  // op een smal scherm - tekst incluis - en wordt een label van 11px op een
  // telefoon 2,8px. Liever horizontaal scrollen op ware grootte dan iets
  // tonen wat niemand kan lezen. De inbeddende pagina regelt het scrollen.
  const minWidth = spec.layout?.fit?.minWidth

  return (
    <ErrorBoundary theme={spec.theme}>
      <SpecProblems problems={problems} theme={spec.theme} />
      {minWidth ? (
        <div style={{ minWidth }}>
          <Template spec={spec} data={data} />
        </div>
      ) : (
        <Template spec={spec} data={data} />
      )}
    </ErrorBoundary>
  )
}
