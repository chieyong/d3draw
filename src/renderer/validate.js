import { walkEncodings } from './scales'
import { VIEW_BINDS } from './useView'
import { templateKey, templateSpec } from './template'

/**
 * Controleert de spec tegen de data vóór er iets getekend wordt.
 *
 * Gooit nooit: een lijst problemen is bruikbaar, een exceptie halverwege
 * het tekenen niet. Zonder deze controle wordt een tikfout in een veldnaam
 * `undefined` -> NaN -> een pad met "NaN" erin, en dat rendert als niets.
 * Stil niets is de duurste fout die er is.
 *
 * `data` is optioneel. Zonder data doen we alleen de structurele
 * controles - dat is wat de editor nodig heeft bij het openen van een
 * spec-bestand, waar nog geen dataset bij hoort.
 */
export function validateSpec(spec, data) {
  const problems = []
  const add = (level, path, message) => problems.push({ level, path, message })

  if (!spec || typeof spec !== 'object') {
    add('error', '', 'De spec is geen object.')
    return problems
  }
  if (!spec.data?.fields?.length) {
    add('error', 'data.fields', 'Ontbreekt: zonder velden is er geen bloem te tekenen.')
    return problems
  }

  // De template-sectie moet bestaan. Zonder die controle krijg je bij een
  // tikfout in `template` een lege grafiek zonder uitleg.
  if (!templateSpec(spec)) {
    add('error', 'template', `Sectie "${templateKey(spec)}" ontbreekt in de spec.`)
  }

  // Structurele minimumeisen. Ontbreken die, dan crasht het tekenen op een
  // ontbrekende sleutel; een leesbare melding is beter dan een exceptie.
  for (const key of ['background', 'ink']) {
    if (!spec.theme?.[key]) add('error', `theme.${key}`, 'Ontbreekt; nodig om iets te kunnen tekenen.')
  }

  const columns = data?.length ? new Set(Object.keys(data[0])) : null
  const derived = new Set(['$value', '$delta', '$residual', '$gemiddelde'])

  const knows = (field) => !columns || columns.has(field) || derived.has(field)
  const checkColumn = (field, path) => {
    if (!field) return
    if (!knows(field)) {
      add('error', path, `Kolom "${field}" bestaat niet in de dataset.`)
      return
    }
    if (!columns || derived.has(field)) return
    const bad = data.find((row) => row[field] === null || Number.isNaN(row[field]))
    if (bad) add('warning', path, `Kolom "${field}" bevat lege of niet-numerieke waarden.`)
  }

  for (const key of ['entity', 'time', 'scoreField']) {
    if (spec.data[key]) checkColumn(spec.data[key], `data.${key}`)
  }
  spec.data.fields.forEach((field, i) => checkColumn(field, `data.fields[${i}]`))

  // Elke encoding in de hele spec, waar hij ook zit.
  walkEncodings(spec, '', (encoding, path) => {
    if (encoding.field && !derived.has(encoding.field)) checkColumn(encoding.field, `${path}.field`)
    if (encoding.scale === 'log') {
      const lower = Array.isArray(encoding.domain)
        ? encoding.domain[0]
        : (encoding.domain?.from ?? 0)
      if (lower === 0 || lower <= 0) {
        add('error', `${path}.scale`, 'Schaal "log" kan niet bij een domein dat op 0 of lager begint.')
      }
    }
    if (!Array.isArray(encoding.range) || encoding.range.length < 2) {
      add('error', `${path}.range`, 'Een encoding heeft een range van minstens twee waarden nodig.')
    }
  })

  // Een control kan alleen iets aansturen wat de renderer als view-toestand
  // kent. Een binding naar een ander spec-pad zou de spec moeten wijzigen,
  // en dat mag de renderer niet - die hoort in de inspector thuis.
  for (const [i, control] of (spec.interaction?.controls ?? []).entries()) {
    if (control.binds && !VIEW_BINDS[control.binds]) {
      add(
        'warning',
        `interaction.controls[${i}].binds`,
        `"${control.binds}" is geen view-instelling; deze control doet niets. ` +
          `Beschikbaar: ${Object.keys(VIEW_BINDS).join(', ')}.`
      )
    }
  }

  return problems
}

export const hasErrors = (problems) => problems.some((p) => p.level === 'error')
