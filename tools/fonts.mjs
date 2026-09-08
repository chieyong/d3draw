/**
 * Haalt de webfonts op en zet ze als data-URI in de export.
 *
 * Reden: de gebakken pagina laadde de fonts bij Google, dus ging het
 * IP-adres van elke bezoeker naar een derde partij. Voor een Nederlandse
 * klant is dat een AVG-punt, en het maakt het bestand bovendien afhankelijk
 * van een internetverbinding. Ingebakken fonts lossen allebei op.
 *
 * Alleen de latijnse subset: de andere blokken (cyrillisch, Vietnamees,
 * latin-ext) verdubbelen de omvang voor tekens die hier niet voorkomen.
 *
 * Zonder netwerk faalt dit niet - dan levert het lege CSS op en valt de
 * pagina terug op systeemfonts.
 */
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const LATIJNS = 'U+0000-00FF'

export async function inlineFonts(families) {
  const query = families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`).join('&')
  const url = `https://fonts.googleapis.com/css2?${query}&display=swap`

  let css
  try {
    const response = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!response.ok) throw new Error(`status ${response.status}`)
    css = await response.text()
  } catch (error) {
    return { css: '', ingebakken: 0, reden: error.message }
  }

  const blokken = css.split('@font-face').slice(1).map((b) => `@font-face${b.split('}')[0]}}`)
  const latijns = blokken.filter((b) => b.includes(LATIJNS))

  let ingebakken = 0
  const uit = []
  for (const blok of latijns) {
    const bron = blok.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (!bron) continue
    try {
      const bytes = Buffer.from(await (await fetch(bron, { headers: { 'User-Agent': UA } })).arrayBuffer())
      uit.push(blok.replace(bron, `data:font/woff2;base64,${bytes.toString('base64')}`))
      ingebakken += 1
    } catch {
      // Dit blok slaan we over; de rest kan nog wel.
    }
  }
  return { css: uit.join('\n'), ingebakken, reden: null }
}
