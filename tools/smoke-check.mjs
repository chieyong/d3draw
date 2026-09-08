/** Leest de uitkomst uit de DOM-dump en beoordeelt hem. */
import fs from 'node:fs'

const dom = fs.readFileSync(process.argv[2], 'utf8')
const match = dom.match(/<pre id="rooktest">(.*?)<\/pre>/s)
if (!match) {
  console.error('Geen uitkomst gevonden — laadde de pagina wel?')
  process.exit(1)
}
const uit = JSON.parse(
  match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
)

const controles = [
  ['24 bloemen getekend', uit.bloemen === 24, uit.bloemen],
  ['geen foutmelding in beeld', uit.geen_foutmelding],
  ['afspeelknop laat de tijd lopen', uit.afspelen_loopt],
  ['knop wisselt naar pauze', uit.knop_zegt_pauze],
  ['pauze bevriest de tijd', uit.pauze_bevriest],
  ['ordening wisselen houdt alle bloemen', uit.ordening_gewisseld],
  ['klik op een ankerpunt selecteert', uit.selectie_werkt],
  ['spec opslaan levert geldige JSON', uit.spec_opslaan],
  ['bump: 16 lijnen getekend', uit.bump_lijnen === 16, uit.bump_lijnen],
  ['bump: geen foutmelding', uit.bump_geen_fout],
  ['bump: legenda toont de lijndikte', uit.bump_legenda],
  ['bump: klik op een lijn selecteert', uit.bump_selectie],
  ['bump: hover dimt een ander cluster', uit.bump_hover_dimt],
  ['bump: clustergenoot blijft vol', uit.bump_cluster_blijft_vol],
  ['bump: tooltip toont de naam', uit.bump_tooltip],
  ['bump: vastzetten dimt ook clustergenoten', uit.bump_vastgezet],
  ['bump: cursor aanwezig na verschuiven', uit.bump_cursor],
  ['ridge: 11 verdelingen getekend', uit.ridge_ruggen === 11, uit.ridge_ruggen],
  ['ridge: geen foutmelding', uit.ridge_geen_fout],
  ['ridge: klik op een verdeling selecteert', uit.ridge_selectie],
  ['ridge: tooltip toont de samenvatting', uit.ridge_tooltip],
  ['ridge: hover dimt de andere decennia', uit.ridge_dimt],
  ['slepen verzet de spec-waarde', uit.sleep_werkt, `${uit.sleep_voor} → ${uit.sleep_na}`],
  ['een sleepbeweging is één undo-stap', uit.sleep_een_stap, `${uit.sleep_stappen} stappen`],
  ['undo zet hem terug', uit.sleep_undo],
  ['geen consolefouten', (uit.consolefouten ?? []).length === 0, (uit.consolefouten ?? []).join(' | ')],
  ['geen uitzondering', !uit.uitzondering, uit.uitzondering],
]

let fout = 0
for (const [naam, goed, extra] of controles) {
  if (!goed) fout += 1
  console.log(`  ${goed ? '✓' : '✗'} ${naam}${!goed && extra ? '  → ' + extra : ''}`)
}
console.log(`\n${controles.length - fout} geslaagd, ${fout} gefaald`)
process.exit(fout ? 1 : 0)
