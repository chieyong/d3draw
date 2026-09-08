/**
 * Een tekenvlak met marges die niet kunnen instorten.
 *
 * Stond eerst alleen in bump-geometry. De ridgeline had precies hetzelfde
 * nodig, dus het is geen bump-code maar platformcode: elke grafiek met een
 * gedeeld assenstelsel heeft marges waarin tekst staat, en die marges mogen
 * nooit zoveel ruimte vragen dat er niets overblijft.
 */
const MIN_VLAK = 120

function passend(voor, na, totaal) {
  if (totaal - voor - na >= MIN_VLAK) return [voor, na]
  const ruimte = Math.max(0, totaal - MIN_VLAK)
  const som = voor + na
  return som > 0 ? [(voor / som) * ruimte, (na / som) * ruimte] : [0, 0]
}

/**
 * `minima` zegt hoeveel elke marge minstens nodig heeft voor wat erin
 * getekend wordt - jaartallen boven, een cursorjaar onder, namen opzij.
 * Wat er precies past hangt van de tekstlengte af en dat weet deze functie
 * niet; het is een ondergrens, geen garantie.
 */
export function plotBox(fit, plot, minima = {}) {
  const [left, right] = passend(
    Math.max(plot.left, minima.left ?? 0),
    Math.max(plot.right, minima.right ?? 0),
    fit.width
  )
  const [top, bottom] = passend(
    Math.max(plot.top, minima.top ?? 0),
    Math.max(plot.bottom, minima.bottom ?? 0),
    fit.height
  )

  return {
    left,
    top,
    width: fit.width - left - right,
    height: fit.height - top - bottom,
    outerWidth: fit.width,
    outerHeight: fit.height,
  }
}
