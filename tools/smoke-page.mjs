/**
 * Bouwt dist/rooktest.html: de gebouwde app plus een scenario dat hem
 * bedient. requestAnimationFrame wordt vervangen door een timer, omdat hij
 * in headless Chrome praktisch bevroren is - we testen onze eigen lus, niet
 * de compositor van de browser.
 */
import fs from 'node:fs'

const SHIM = `<script>
window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16)
window.cancelAnimationFrame = (id) => clearTimeout(id)
window.__fouten = []
const oe = console.error
console.error = (...a) => { window.__fouten.push(a.map(String).join(' ').slice(0, 160)); oe(...a) }
window.addEventListener('error', (e) => window.__fouten.push('UNCAUGHT ' + e.message))
</script>`

const SCENARIO = `<script type="module">
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const zet = (el, v) => {
  const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set
  d.call(el, v); el.dispatchEvent(new Event('change', { bubbles: true }))
}
const uit = {}
try {
  localStorage.clear()
  await wait(1500)
  const slider = () => document.querySelector('input[type=range]')
  const knop = () => [...document.querySelectorAll('button')].find((b) => /speel|pauze/.test(b.textContent))

  uit.bloemen = document.querySelectorAll('[data-spec-path="flower"]').length
  uit.geen_foutmelding = !document.querySelector('[role="alert"]')

  zet(slider(), '0'); await wait(200)
  knop().click(); await wait(1200)
  uit.afspelen_loopt = Number(slider().value) > 0.3
  uit.knop_zegt_pauze = /pauze/.test(knop().textContent)
  const bevroren = Number(slider().value)
  knop().click(); await wait(500)
  uit.pauze_bevriest = Math.abs(Number(slider().value) - bevroren) < 0.05

  const dropdown = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => o.value === 'spiral'))
  zet(dropdown, 'spiral'); await wait(1200)
  uit.ordening_gewisseld = document.querySelectorAll('[data-spec-path="flower"]').length === uit.bloemen

  document.querySelector('[data-spec-entity] [data-spec-path="flower.contour.radius"]')
    .dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await wait(400)
  uit.selectie_werkt = /Geselecteerd/.test(document.body.textContent)

  const cap = []; URL.createObjectURL = (b) => { cap.push(b); return 'x' }
  HTMLAnchorElement.prototype.click = function () {}
  ;[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Spec opslaan')).click()
  await wait(300)
  uit.spec_opslaan = !!JSON.parse(await cap[0].text()).flower

  // ---- tweede grafiektype ----
  // Na een wissel bouwt de editor opnieuw op, dus het select-element is
  // vervangen. Elke keer opnieuw opzoeken.
  const specKeuze = () => [...document.querySelectorAll('select')].find((s) =>
    [...s.options].some((o) => o.value === 'bump'))
  zet(specKeuze(), 'bump'); await wait(1600)
  uit.bump_lijnen = document.querySelectorAll('[data-spec-path="bump.line"]').length
  uit.bump_geen_fout = !document.querySelector('[role="alert"]')
  uit.bump_legenda = /lijndikte/.test(document.body.textContent)

  // klik op een lijn selecteert (bewerkmodus)
  const lijn = document.querySelector('[data-spec-entity="Onderwijs"]')
  lijn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await wait(400)
  uit.bump_selectie = /Geselecteerd/.test(document.body.textContent)

  // in bekijkmodus: hover dimt, klik zet vast
  ;[...document.querySelectorAll('button')].find((b) => b.textContent === 'Bekijken').click()
  await wait(300)
  // React leidt onPointerEnter af uit pointerover; een los verzonden
  // pointerenter komt nooit aan.
  for (const type of ['pointerover', 'pointermove']) {
    lijn.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: 500, clientY: 300 }))
  }
  await wait(300)
  // Industrie zit in een ánder cluster dan Onderwijs; Horeca in hetzelfde.
  // highlight "sameRegion" hoort de eerste te dimmen en de tweede vol te laten.
  const anders = document.querySelector('[data-spec-entity="Industrie"]')
  const clustergenoot = document.querySelector('[data-spec-entity="Horeca"]')
  uit.bump_hover_dimt = Number(anders.getAttribute('opacity')) < 0.5
  uit.bump_cluster_blijft_vol = Number(clustergenoot.getAttribute('opacity')) === 1
  // Op de glass-tooltip zelf controleren, niet op de naam: die staat toch
  // al als label in beeld.
  const tip = document.querySelector('[style*="backdrop-filter"]')
  uit.bump_tooltip = !!tip && /Onderwijs/.test(tip.textContent)
  lijn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await wait(300)
  uit.bump_vastgezet = Number(lijn.getAttribute('opacity')) === 1 &&
    Number(clustergenoot.getAttribute('opacity')) < 0.5

  // de bump-tijdslider werkt ook
  const bumpSlider = document.querySelector('input[type=range]')
  zet(bumpSlider, '3'); await wait(400)
  uit.bump_cursor = document.querySelectorAll('[data-spec-path="bump.cursor"]').length === 1

  // ---- derde grafiektype ----
  zet(specKeuze(), 'ridge'); await wait(1600)
  uit.ridge_ruggen = document.querySelectorAll('[data-spec-path="ridge.ridge"]').length
  uit.ridge_geen_fout = !document.querySelector('[role="alert"]')
  const rug = document.querySelector('[data-spec-entity="1980"]')
  rug.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await wait(400)
  uit.ridge_selectie = /Geselecteerd/.test(document.body.textContent)
  ;[...document.querySelectorAll('button')].find((b) => b.textContent === 'Bekijken').click()
  await wait(300)
  for (const type of ['pointerover', 'pointermove']) {
    rug.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: 500, clientY: 400 }))
  }
  await wait(300)
  const tip2 = document.querySelector('[style*="backdrop-filter"]')
  uit.ridge_tooltip = !!tip2 && /Mediaan/.test(tip2.textContent)
  uit.ridge_dimt = Number(document.querySelector('[data-spec-entity="1920"]').getAttribute('opacity')) < 0.5

  // ---- aan het canvas trekken ----
  zet(specKeuze(), 'flower'); await wait(1600)
  const lezen = async () => {
    const c = []; const oud = URL.createObjectURL
    URL.createObjectURL = (b) => { c.push(b); return 'x' }
    const k = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () {}
    ;[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Spec opslaan')).click()
    await wait(250); URL.createObjectURL = oud; HTMLAnchorElement.prototype.click = k
    return JSON.parse(await c[c.length - 1].text())
  }
  const voor = (await lezen()).flower.contour.radius.range[1]
  const greep = document.querySelector('[data-drag="radial"]')
  const nul = greep.closest('[data-drag-origin]').getScreenCTM()
  const mid = new DOMPoint(0, 0).matrixTransform(nul)
  const doos = greep.getBoundingClientRect()
  const start = { x: doos.x + doos.width / 2, y: doos.y + doos.height / 2 }
  const richting = Math.atan2(start.y - mid.y, start.x - mid.x)
  const r0 = Math.hypot(start.x - mid.x, start.y - mid.y)
  const doel = { x: mid.x + Math.cos(richting) * r0 * 1.5, y: mid.y + Math.sin(richting) * r0 * 1.5 }
  const ev = (t, p) => new PointerEvent(t, { bubbles: true, button: 0, pointerId: 1, clientX: p.x, clientY: p.y })
  greep.dispatchEvent(ev('pointerdown', start)); await wait(80)
  greep.dispatchEvent(ev('pointermove', doel)); await wait(250)
  greep.dispatchEvent(ev('pointerup', doel)); await wait(300)
  const na = (await lezen()).flower.contour.radius.range[1]
  uit.sleep_voor = voor
  uit.sleep_na = na
  uit.sleep_werkt = Math.abs(na / voor - 1.5) < 0.15
  // Let op: dit scenario staat in een template literal, dus backslashes
  // moeten dubbel - anders eet JavaScript ze op en wordt \\d+ het letterlijke
  // teken d.
  uit.sleep_stappen = (document.body.textContent.match(/(\\d+) wijziging/) || [])[1] ?? '?'
  uit.sleep_een_stap = uit.sleep_stappen === '1'
  ;[...document.querySelectorAll('button')].find((b) => b.title === 'Cmd-Z').click()
  await wait(400)
  uit.sleep_undo = (await lezen()).flower.contour.radius.range[1] === voor
} catch (e) {
  uit.uitzondering = e.message
}
uit.consolefouten = (window.__fouten || []).filter((f) => !/Warning|DevTools/.test(f))
const pre = document.createElement('pre'); pre.id = 'rooktest'
pre.textContent = JSON.stringify(uit)
document.body.appendChild(pre)
</script>`

const html = fs
  .readFileSync('dist/index.html', 'utf8')
  .replace('<div id="root">', SHIM + '<div id="root">')
  .replace('</body>', SCENARIO + '</body>')
fs.writeFileSync('dist/rooktest.html', html)
