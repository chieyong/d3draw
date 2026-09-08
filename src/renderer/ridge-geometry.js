import { area, curveBasis, deviation, group, ascending, descending, max, median, min, quantile } from 'd3'
import { scaleFor } from './scales'
import { plotBox } from './plot'

/**
 * De ridgeline: één verdeling per groep, van boven naar beneden gestapeld.
 *
 * Het verschil met de twee bestaande types zit in de datavorm. Bloem en
 * bump chart tekenen iets per entiteit; hier is elke rij één losse meting
 * en is de getekende vorm een *groep* van metingen. De grafiek toont dus
 * niet een waarde maar een verdeling, en die moet eerst berekend worden.
 */

function minimum(spec) {
  const { axis, labels } = spec.ridge
  return {
    top: 10,
    bottom: axis?.show ? axis.tickLength + axis.size * 2 + 16 : 8,
    left: labels?.show ? labels.size * 4 : 8,
    right: 20,
  }
}

export function ridgePlot(spec) {
  return plotBox(spec.layout.fit, spec.ridge.plot, minimum(spec))
}

/** De as die de metingen op het vlak plaatst. */
export function valueScale(spec, area_) {
  return scaleFor({ ...spec.ridge.axis, range: [0, area_.width] })
}

/**
 * De bandbreedte volgens de vuistregel van Silverman, in pixels.
 *
 * Een vast getal in de spec leek eerst goed genoeg, maar dat is het niet:
 * de juiste gladheid hangt af van hoeveel metingen er zijn en hoe ver ze
 * uit elkaar liggen, en dat verschilt per groep en verandert zodra het vlak
 * van maat verandert. Met een vast getal las je bij dertig films de ruis als
 * structuur - elke film kreeg zijn eigen bultje.
 *
 * De spreiding wordt genomen als de kleinste van de standaardafwijking en
 * de kwartielafstand; dat maakt hem ongevoelig voor een enkele uitschieter.
 */
export function bandwidth(punten, factor = 1) {
  const n = punten.length
  if (n < 2) return 1
  const gesorteerd = [...punten].sort((a, b) => a - b)
  const iqr = quantile(gesorteerd, 0.75) - quantile(gesorteerd, 0.25)
  const spreiding = Math.min(deviation(punten) || Infinity, iqr / 1.349 || Infinity)
  const h = 1.06 * (Number.isFinite(spreiding) ? spreiding : 1) * n ** -0.2
  return Math.max(1, h * factor)
}

/**
 * Kerndichtheid, berekend in pixels in plaats van in seconden.
 *
 * Dat is bewust: de as mag logaritmisch zijn, en een bandbreedte in
 * seconden betekent dan onderaan iets heel anders dan bovenaan. In
 * pixelruimte is de gladheid overal gelijk - precies wat je ziet.
 */
export function density(values, x, { smoothing = 1, samples }) {
  const punten = values.map(x)
  const bw = bandwidth(punten, smoothing)
  const [x0, x1] = x.range()
  const stap = (x1 - x0) / (samples - 1)
  const noemer = punten.length * bw * Math.sqrt(2 * Math.PI)

  const kromme = []
  for (let i = 0; i < samples; i += 1) {
    const px = x0 + i * stap
    let som = 0
    for (const p of punten) {
      const u = (px - p) / bw
      som += Math.exp(-0.5 * u * u)
    }
    kromme.push({ x: px, y: noemer > 0 ? som / noemer : 0 })
  }
  return kromme
}

/**
 * Alle groepen met hun verdeling, hun plek en een samenvatting.
 *
 * De samenvatting is geen sier: de tooltip van het platform verwacht "een
 * rij", en een groep ís geen rij uit de dataset. Door er hier één te maken
 * (mediaan, aantal, snelste, traagste) werkt die laag ongewijzigd.
 */
export function ridges(data, spec, area_) {
  const { ridge } = spec
  const veld = ridge.axis.field
  const x = valueScale(spec, area_)

  const richting = ridge.group.order === 'desc' ? descending : ascending
  const groepen = [...group(data, (row) => row[ridge.group.field])]
    .sort((a, b) => richting(a[0], b[0]))

  // De stapeling moet precies passen: de bovenste piek raakt de bovenrand,
  // de onderste basislijn de onderrand. Met n groepen, een piekhoogte van
  // (1 + overlap) keer de rijafstand en n-1 tussenruimtes volgt daaruit
  // rijafstand = hoogte / (n + overlap). Mijn eerste poging liet de onderste
  // rug 42px buiten het vlak vallen.
  const n = Math.max(1, groepen.length)
  const rijHoogte = area_.height / (n + ridge.overlap)
  const piekHoogte = rijHoogte * (1 + ridge.overlap)

  const ruw = groepen.map(([naam, rijen], i) => {
    const waarden = rijen.map((row) => row[veld]).filter(Number.isFinite)
    return {
      naam,
      rijen,
      index: i,
      basis: area_.top + piekHoogte + rijHoogte * i,
      kromme: density(waarden, x, ridge),
      samenvatting: {
        [ridge.group.field]: naam,
        aantal: rijen.length,
        mediaan: Math.round(median(waarden) * 100) / 100,
        snelste: min(waarden),
        traagste: max(waarden),
      },
    }
  })

  // Eén hoogteschaal over alle groepen: dan zie je dat latere decennia
  // smaller én hoger zijn. Per groep normaliseren zou alleen de vorm laten
  // zien en juist verbergen dat de spreiding kleiner werd.
  const piek = max(ruw, (g) => max(g.kromme, (p) => p.y)) || 1

  return {
    x,
    rijHoogte,
    groepen: ruw.map((g) => ({ ...g, hoogte: (waarde) => (waarde / piek) * piekHoogte })),
  }
}

/** Het gevulde vlak onder één verdelingskromme. */
export function ridgePath(groep) {
  return area()
    .x((p) => p.x)
    .y0(groep.basis)
    .y1((p) => groep.basis - groep.hoogte(p.y))
    .curve(curveBasis)(groep.kromme)
}
