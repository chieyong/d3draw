# Spec-schema: platform en templates

> Dit document begon als het ontwerp van één grafiek, "The Happiness
> Garden". Sinds er een tweede grafiektype op dezelfde motor draait, gaat
> het over twee dingen tegelijk: het **platform** dat elke grafiek deelt, en
> de **templates** die weten hoe je er één tekent. De bestandsnaam is
> hetzelfde gebleven omdat `CLAUDE.md` ernaar verwijst.

**Drie grafieken op dezelfde motor.** `flower` is een radiale contour
chart: elk land een bloem, getekend als één doorlopende gesloten contour
door zes ankerpunten. `bump` is een rangorde over tijd: één lijn per
bedrijfstak, tijd als as. `ridge` is een gestapelde verdeling: één vorm per
decennium, en de getekende vorm is een *groep* in plaats van een entiteit.

> v2 (5 sept): losse bloembladen vervangen door één doorlopende contour;
> sectie 6 toegevoegd met de canvas-bewerkingen (Illustrator-achtig).
>
> v2.1 (5 sept): `domain` uitgebreid met expliciete modi (sectie 1);
> `legend` toegevoegd (sectie 2 en 3) plus een stap in de bouwvolgorde.
>
> v2.2 (5 sept): `data.fieldLabels` vervangen door `data.labels` (één
> labelbron voor álle kolommen); `layout.header` toegevoegd.
>
> v3.3 (8 sept): export voor inbedden — hoogtemelding aan de omliggende
> pagina, `--embed` zonder titel, en `layout.fit.minWidth` tegen
> onleesbaar krimpen.
>
> v3.2 (8 sept): aan het canvas trekken werkt — de renderer labelt wat je
> kunt vastpakken, de editor rekent de sleepafstand terug naar een
> spec-waarde.
>
> v3.1 (8 sept): derde template `ridge` beschreven (sectie 3c); sectie 0
> bijgewerkt met de bestandsindeling van drie types.
>
> v3.0 (8 sept): document herzien — het gaat nu over een platform met twee
> templates in plaats van over één grafiek. Sectie 0 legt de scheiding uit,
> sectie 3b beschrijft de bump chart.
>
> v2.19 (8 sept): tweede grafiektype. `spec.template` noemt het type en de
> sectie; `Chart` is de host, `Garden` de bloem-template. Ordinale schalen,
> `data.derived` en `data.source` toegevoegd.
>
> v2.18 (6 sept): `frameAt` klemt de jaar-index binnen de tijdlijn; een
> teruggehaalde sessie wordt mét de data gevalideerd.
>
> v2.17 (6 sept): afspeelknop gerepareerd — de picking-laag van de editor
> ving ook klikken op de bedieningselementen van de renderer af. Rooktest
> toegevoegd (`npm run smoke`).
>
> v2.16 (6 sept, na review): legendatekst afgeleid uit de schaal;
> `fill.color` en lege sleutels bereikbaar in de inspector; SVG met
> `role="img"`, titel en toetsenbordbediening; fonts ingebakken in de export.
>
> v2.15 (6 sept, na review): 42 tests (`npm test`); de plaatsing per jaar
> uit de animatielus gehaald.
>
> v2.14 (6 sept, na review): twee handmatige tabellen weg — schalen en
> interpolatievelden worden nu uit de encodings zelf afgeleid; de publieke
> API van de renderer teruggebracht tot drie symbolen.
>
> v2.13 (6 sept, na review): spec en view gescheiden. De spec is wat de
> maker besluit (undo, export); de view is waar de kijker naar kijkt
> (ordening, jaar, pins) en gaat nooit de spec in.
>
> v2.12 (6 sept, na review): schalen clampen; `validateSpec` + error
> boundary; `theme.ink`, `theme.tooltip` en `interaction.click.strokeWidth`
> toegevoegd zodat er geen kleuren of diktes meer in de componenten staan.
>
> v2.11 (6 sept): spec opslaan/openen, SVG-export en een gebakken
> standalone HTML (`npm run bake`).
>
> v2.10 (6 sept): canvas als ingang op de inspector — de renderer labelt
> elk getekend element met `data-spec-path`, de editor vangt de klik op.
>
> v2.9 (6 sept): inspector gebouwd in `src/editor/`; de renderer publiceert
> zijn eigen keuzelijsten (`CURVE_TYPES`, `EASE_TYPES`, `LAYOUT_TYPES`,
> `SCALE_TYPES_LIST`) zodat de inspector niets kan aanbieden dat hij niet kent.
>
> v2.8 (6 sept): alles past nu binnen `layout.fit`; spiraal van phyllotaxis
> naar archimedisch; `byRegion` vult planken; `spiral.guide` toegevoegd.
>
> v2.7 (6 sept): `spiral` en `byRegion` gebouwd; `layout.spiral.spacing` en
> `byRegion.labelHeight` toegevoegd; controls kunnen spec-paden overschrijven.
>
> v2.6 (6 sept): `interaction.hover.groupField` en `interaction.click.colors`
> toegevoegd; vergelijkmodus neemt de plek van de sleutelbloem in.
>
> v2.5 (5 sept): de steel codeert `$residual` in plaats van de score;
> `data.scoreField` toegevoegd.
>
> v2.4 (5 sept): `contour.ghost` toegevoegd (schaduwcontour van een
> referentiejaar); `$delta` is nu een echte afgeleide kolom.
>
> v2.3 (5 sept): `layout.reorder` toegevoegd — verspringen de rasterplekken
> per jaar mee met de ranglijst, of staan ze vast? `fixedYear` accepteert
> ook `"mean"`; het bijschrift volgt `reorder`.

Dataset: `world_happiness_sample_2015-2024.csv` (24 landen × 10 jaar).
Structuur volgt het World Happiness Report (Gallup World Poll); de
waarden zijn synthetisch maar realistisch. Echte data: worldhappiness.report.

---

## 0. Platform of template?

`spec.template` noemt het grafiektype én de sleutel waaronder de
instellingen van dat type staan: bij `"flower"` is dat `spec.flower`, bij
`"bump"` is dat `spec.bump`. Alles daarbuiten is platform.

| in de spec | van wie |
|---|---|
| `meta`, `data`, `theme`, `animation`, `interaction`, `preview` | platform |
| `layout` | platform, maar niet elk type gebruikt alles ervan |
| `flower`, `bump`, … | de template die `template` noemt |

En in de code:

| laag | bestanden |
|---|---|
| **host** | `Chart.jsx` (valideert, kiest, vangt fouten), `validate.js`, `scales.js`, `derive.js`, `overrides.js`, `template.js`, `templates.js` |
| **gedeelde onderdelen** | `useTimeline`, `useView`, `useTween`, `usePointer`, `plot.js`, `highlight`, `captions`, `Tooltip`, `TimeSlider`, `Select`, `ErrorBoundary`, `SpecProblems` |
| **template "flower"** | `Garden.jsx`, `Flower.jsx`, `geometry.js`, `layout.js`, `timeline.js`, `anchorLabels.js`, `Legend.jsx`, `Compare.jsx` |
| **template "bump"** | `BumpChart.jsx`, `bump-geometry.js` |
| **template "ridge"** | `RidgeChart.jsx`, `ridge-geometry.js` |
| **editor** | alles in `src/editor/` — kent geen enkel grafiektype bij naam |

De regel die deze indeling afdwingt: **host-code mag geen template bij naam
kennen.** Bij het bouwen van het tweede type bleken drie bestanden dat toch
te doen — de tijdslider haalde zijn kleur uit `flower.stem.fill`, de editor
importeerde `Garden` rechtstreeks, en `useView` ging ervan uit dat elke
grafiek een `layout.type` heeft. Dat waren precies de drie plekken waar de
naad verkeerd lag.

---

## 1. Het kernpatroon: vast of gekoppeld

Elke visuele eigenschap is één van twee dingen:

```jsonc
// vast
"strokeColor": "#2c2c2c"

// gekoppeld aan data
"strokeWidth": { "field": "population_millions", "scale": "sqrt", "range": [0.4, 3] }
```

Een *encoding*-object heeft altijd:

| sleutel   | betekenis                                                        |
|-----------|------------------------------------------------------------------|
| `field`   | kolomnaam in de dataset                                          |
| `scale`   | `linear` · `sqrt` · `log` · `ordinal` · `quantize`               |
| `domain`  | zie hieronder; standaard berekend over de hele dataset (alle jaren!) |
| `range`   | getallen (lengte, dikte, opacity) óf kleuren (gradient)          |

### `domain`: drie vormen

```jsonc
"domain": { "mode": "shared", "from": 0 }     // standaard
"domain": { "mode": "perField", "from": 0 }
"domain": [0, 1.8]                            // ontsnappingsluik
```

- **`mode`** geldt alleen bij `field: "$value"`, waar één encoding voor alle
  ankerpunten samen geldt. `shared` legt één domein over alle velden: de
  lengtes zijn dan onderling vergelijkbaar. `perField` geeft elk veld zijn
  eigen bovengrens: elk ankerpunt benut het volle bereik, maar lengtes
  onderling vergelijken kan niet meer.
- **`from`** is `0` of `"min"`. `0` houdt nul op nul en is stabiel: alleen
  de bovengrens beweegt. `"min"` benut het volle bereik maar is instabiel —
  één entiteit toevoegen of weglaten verandert de vorm van álle andere.
  Voor deze dataset is dat gemeten: Kenia weglaten verschuift bij `perField`
  de straal van vrijgevigheid bij Finland van 68px naar 72px, terwijl
  `shared` onveranderd blijft.

Regel voor de component: het domein wordt over **alle jaren** berekend,
anders "ademt" de schaal mee tijdens de animatie en verliest de kijker
het referentiekader. Daarom krijgt de renderer de volledige dataset en
kiest hij zélf het jaar; met alleen de rijen van één jaar kán hij deze
regel niet naleven.

**Straal en oppervlak.** Een bloem wordt op oppervlak gelezen, en oppervlak
schaalt kwadratisch met de straal. `scale: "sqrt"` op een straal-encoding
maakt het oppervlak evenredig met de waarde; `linear` maakt het kwadratisch
en overdrijft grote waarden. Voor `contour.radius` en `stem.radius` is
`sqrt` daarom de standaard.

---

## 2. Het schema — template "flower"

Een radiale *contour chart*: elk land is een bloem, getekend als één
doorlopende gesloten contour door zes ankerpunten (de geluksfactoren). De
tuin groeit en verandert over de jaren 2015–2024.

```jsonc
{
  "meta": {
    "title": "The Happiness Garden",
    "subtitle": "Hoe 24 landen bloeien, 2015–2024",
    "source": "World Happiness Report (sample)"
  },

  "data": {
    "entity": "country",          // wat is één bloem
    "time":   "year",             // waarover wordt geanimeerd
    "scoreField": "happiness_score",  // de totaalscore; nodig voor $residual
    "fields": [                   // ankerpunten van de contour, in deze volgorde
      "gdp_per_capita",
      "social_support",
      "healthy_life_expectancy",
      "freedom",
      "generosity",
      "perceived_absence_of_corruption"
    ],
    "labels": {                   // leesbare naam per kolom, één bron
      "country": "Land",
      "region": "Regio",
      "year": "Jaar",
      "happiness_score": "Geluksscore",
      "rank_in_year": "Plek in de ranglijst",
      "population_millions": "Bevolking (mln)",
      "gdp_per_capita": "Welvaart",
      "social_support": "Sociale steun",
      "healthy_life_expectancy": "Gezonde jaren",
      "freedom": "Vrijheid",
      "generosity": "Vrijgevigheid",
      "perceived_absence_of_corruption": "Vertrouwen"
    }
  },

  "layout": {
    "type": "grid",               // grid · spiral · byRegion · scatter
    "columns": 6,
    "sortBy": { "field": "happiness_score", "order": "desc" },
    "reorder": "fixed",           // perYear · fixed
    "fixedYear": "mean",          // "mean" · een jaartal; alleen bij fixed
    "cellSize": 150,
    "fit": { "width": 1520, "height": 820 },   // alles moet hierin passen
    "spiral": {
      "spacing": 0.82,            // afstand tussen buren, x cellSize
      "guide": { "show": true, "stroke": "#2d6a4f", "width": 1.2, "opacity": 0.28 }
    },
    "header": {                   // bijschrift bóven het raster
      "show": true,
      "height": 44,
      "fontSize": 12,
      "note": null                // null = afleiden uit sortBy
    },
    "byRegion": { "groupField": "region", "gap": 34, "labelHeight": 24,
                  "columns": 9 }
  },

  "legend": {
    "show": true,
    "type": "keyFlower",        // uitvergroot voorbeeldexemplaar met labels
    "sample": "median",         // median · <landnaam>
    "position": "left",
    "scale": 1.6,
    "gap": 14,                  // afstand ankerpunt -> label
    "fontSize": 11,
    "color": "#1a1a2e",
    "box": { "width": 430, "height": 420 },
    "annotate": {
      "anchors": true,          // de zes veldnamen uit data.labels
      "stem": "Geluksscore",
      "size": "Oppervlak ≈ som van de zes factoren"
    }
  },

  "flower": {
    "stem": {                     // de "steel": het onverklaarde deel
      "radius": { "field": "$residual", "scale": "sqrt",
                  "domain": [1, 3.2], "range": [3, 14] },
      "fill":   { "field": "region", "scale": "ordinal",
                  "range": ["#2d6a4f", "#e07a5f", "#3d405b", "#f2cc8f", "#81b29a", "#c0392b"] },
      "opacity": 0.9
    },
    "contour": {
      "anchors":  "$fields",       // één ankerpunt per veld uit data.fields
      "radius":   { "field": "$value", "scale": "linear", "range": [6, 70] },
      "curve":    "curveCardinalClosed",     // ...Closed: begin en eind sluiten
      "tension":  0.6,              // 0 = hoekig, 1 = vloeiend rond
      "fill": {
        "type": "gradient",         // solid · gradient
        "direction": "radial",      // centrum → rand
        "stops": { "field": "happiness_score", "scale": "linear",
                   "range": ["#fdf6ec", "#e07a5f"] }
      },
      "strokeWidth": { "field": "$delta", "scale": "linear", "range": [0.5, 3] },
      "strokeColor": "#1a1a2e",
      "opacity": 0.85,
      "blendMode": "multiply",
      "ghost": {                    // contour van een referentiejaar
        "show": true,
        "reference": "first",       // first · last · mean · <jaartal>
        "stroke": "#1a1a2e",
        "strokeWidth": 0.75,
        "opacity": 0.45,
        "dash": [3, 3]
      },
      "spokes": {                   // dunne lijnen centrum → ankerpunt
        "show": true, "color": "#1a1a2e", "opacity": 0.25, "dash": [2, 3]
      },
      "anchorDots": { "show": true, "radius": 2 }
    },
    "label": {
      "show": true,
      "field": "country",
      "font": "DM Mono",
      "size": 10,
      "offset": 8,
      "minScale": 0.72            // daaronder labels verbergen
    },
    "rankBadge": {                // kleine ring/getal: plek in de ranglijst dat jaar
      "show": true,
      "field": "rank_in_year"
    }
  },

  "animation": {
    "playAlong": "year",
    "durationPerStep": 900,
    "ease": "easeCubicInOut",
    "loop": false,
    "entry": { "type": "grow", "stagger": 40 },      // grow · fade · drawOn · none
    "interpolate": ["contour.radius", "stem.radius", "contour.fill", "layout.position"]
  },

  "interaction": {
    "hover": {
      "highlight": "sameRegion",  // self · sameRegion · none
      "groupField": "region",     // waarop "sameRegion" groepeert
      "dimOthersTo": 0.22,
      "tooltip": {
        "fields": ["country", "region", "happiness_score", "$residual", "$values"],
        "style": "glass"
      }
    },
    "click": {
      "action": "pinCompare",
      "max": 3,
      "colors": ["#2d6a4f", "#e07a5f", "#3d405b"],
      "strokeWidth": 2,           // contour in het vergelijkpaneel
      "stemStrokeWidth": 1.5      // de steel-ringen daar
    },
    "controls": [
      { "type": "timeSlider", "field": "year", "showPlayButton": true, "position": "bottom" },
      { "type": "select", "binds": "layout.type", "label": "Ordening",
        "options": ["grid", "byRegion", "spiral"],
        "optionLabels": { "grid": "Raster (ranglijst)", "byRegion": "Per regio",
                          "spiral": "Spiraal" } },
      { "type": "toggle", "binds": "flower.contour.strokeWidth", "label": "Toon verandering t.o.v. vorig jaar" }
    ]
  },

  "theme": {
    "background": "#fdf6ec",
    "ink": "#1a1a2e",             // alle tekst en lijnen die geen eigen kleur hebben
    "tooltip": { "background": "rgba(253, 246, 236, 0.82)", "blur": 6 },
    "fontDisplay": "Cormorant Garamond",
    "fontBody": "DM Mono",
    "filters": { "glow": false, "grain": 0.04 }
  }
}
```

---

## 3. Toelichting op de bijzondere sleutels

- **`$residual`** — de score min de som van de zes factoren. De steel
  codeerde eerst de totaalscore, maar dat is bijna hetzelfde als wat het
  oppervlak van de bloem al zegt: gemeten correleert de steelstraal 0,92
  met de som van de zes. De score werd dus twee keer gecodeerd en het
  residu nul keer, terwijl dat per land flink verschilt (1,02 tot 3,15) en
  verklaart waarom Costa Rica hoog in de ranglijst staat met een kleine
  bloem. Nu leest de bloem als "wat verklaart de score" en de steel als
  "wat blijft er onverklaard".

  Het lost ook een geometrisch probleem op. Met de score als bron stak de
  steel in 142 van de 240 rijen voorbij het kortste ankerpunt; het bereik
  inkorten kon niet, want het kortste ankerpunt in de hele dataset is
  11,7px en dan blijft er van een bereik niets over. Het residu is een
  kleinere grootheid en past wél binnen de contour.

  De steel is de ene plek waar `domain` een **expliciete array** is in
  plaats van `{ from: 0 }`, en dat verdient uitleg. Het residu komt nooit
  onder 1,02; met een nulbasis gaat een derde van het bereik op aan
  waarden die niet voorkomen, en dan variëren de stippen nog maar van 7,6
  tot 11,0px — nauwelijks te zien. Met `[1, 3.2]` lopen ze van 3,2 tot
  13,8px: een oppervlakverhouding van 19× in plaats van 2×. Een
  handgezet domein is nog steeds stabiel (het verschuift niet als er een
  land bijkomt, anders dan `from: "min"`), maar het is wél een aanname die
  je moet noemen zodra het over andere data gaat. Het maximum van 14 is
  niet vrij gekozen: daarboven zou de steel bij sommige landen door de
  contour breken.

- **`$value` / `$delta`** — *afgeleide* velden: de waarde van het huidige
  ankerpunt, en de verandering t.o.v. het vorige jaar. Zo geldt één encoding
  voor alle zes ankerpunten. `$delta` op `strokeWidth` betekent: de contour
  wordt dikker waar een factor dit jaar sterk bewoog. Omdat D3 één pad tekent,
  wordt dit in de praktijk gedaan met een *variabele-breedte-pad* (twee
  offset-contouren, gevuld) of, eenvoudiger in v1, met een gemiddelde delta
  per bloem. Kies in v1 het eenvoudige; noteer het als bekende beperking.
- **`contour.ghost`** — de reden dat dit bestaat is gemeten: een jaarstap
  verplaatst een ankerpunt gemiddeld 1px op een bereik van 62px, en over
  tien jaar is de mediane verschuiving 2,8px. Eén contour die 3px opschuift
  is onzichtbaar; twee lijnen die 3px uit elkaar liggen zijn prima
  zichtbaar. De schaduwcontour verandert de vraag van "waar staat dit land"
  naar "waar is het vandaan gekomen", en dat is de vraag waar deze dataset
  wél antwoord op geeft. Hij wordt bóven de vulling getekend, niet
  erachter: een referentielijn die je alleen buiten de bloem ziet, laat
  alleen groei zien en verzwijgt krimp.

- **Schaaltype per encoding** — `sqrt` hoort bij grootheden die je als
  *oppervlak* leest (straal, bubbels): dan is het oppervlak evenredig met
  de waarde. Een lijndikte lees je niet als oppervlak maar als dikte, dus
  daar is `linear` juist. Concreet gemeten op `$delta` in 2024: `sqrt`
  perst alle diktes samen tussen 1,25 en 2,84px, `linear` spreidt ze over
  0,72 tot 2,69px — en dunne lijnen zien er dan ook dun uit.

- **`fill` met gradient** — de binnenste stop begint bij de rand van de
  *steel*, niet in het middelpunt. De steel dekt de binnenste derde van de
  bloem af; ligt de lichte stop daaronder, dan zie je van het kleurverloop
  alleen het donkere eind en encodeert de gradient niets meer.

- **`curve` + `tension`** — de Fragapane-look zit in deze twee knoppen, maar
  let op: elke curve-familie in D3 heeft zijn eigen vorm-parameter, met een
  eigen betekenis en een eigen richting. `tension` in de spec loopt van
  0 = hoekig naar 1 = vloeiend rond, en wordt per familie vertaald:

  | `curve`                 | D3-parameter        | doet                                    |
  |-------------------------|---------------------|-----------------------------------------|
  | `curveCardinalClosed`   | `.tension(1 - t)`   | de echte vorm-knop: zeshoek ↔ bol       |
  | `curveCatmullRomClosed` | `.alpha(1 - t)`     | parametrisatie, géén tension            |
  | `curveLinearClosed`     | —                   | rechte lijnen; negeert `tension`        |

  `curveCatmullRom.alpha()` is nadrukkelijk *geen* tension: het regelt hoe
  de afstand tussen punten meeweegt (0 = uniform, 0,5 = centripetaal,
  1 = chordaal) en maakt een vorm nooit hoekig. Bij zes gelijk verdeelde
  hoeken is het effect klein. Waar het wél voor dient: centripetaal (~0,5)
  voorkomt doorschieten wanneer één ankerpunt veel langer is dan zijn
  buren — bij cardinal met lage spanning hapt de contour daar naar binnen.
  Vandaar dat beide families beschikbaar blijven.
- **`stops` op `fill`** — een gradient waarvan het kleurbereik aan data
  hangt: een lang blad (hoge waarde) loopt door naar het einde van de
  gradient, een kort blad blijft in de lichte tinten. Zo encodeert de
  gradient de waarde twee keer (lengte + kleur), wat de leesbaarheid op
  afstand enorm helpt.
- **`animation.interpolate`** — een expliciete lijst van wat er
  geïnterpoleerd wordt bij een jaarstap. Alles wat er níet in staat,
  springt. Dit is bewust: transities overal maken een chart wollig.

  De renderer interpoleert hiervoor de **data**, niet de paden: bij een
  tussenstand wordt per land een tussenrij berekend, die daarna door
  dezelfde schalen en dezelfde `lineRadial` gaat als een echte rij.
  `d3.interpolateString` op de `d`-attributen zou hier ook werken (het
  puntenaantal is gelijk), maar dan interpoleer je het eindresultaat in
  plaats van de oorzaak, en moeten steel, positie, gradient en `$delta`
  elk hun eigen interpolatie krijgen — met kans dat ze uit de pas lopen.

  Posities vormen de uitzondering: die worden per jaar berekend en dan
  geïnterpoleerd. Sorteren op de gemengde waarde zou twee landen van plek
  laten wisselen precies wanneer hun scores elkaar kruisen, en dat is een
  sprong midden in de beweging.
- **`layout.reorder`** — bij `perYear` wordt de volgorde elk jaar opnieuw
  bepaald: de tuin ís dan de ranglijst van dat jaar, en bloemen schuiven
  tijdens de animatie naar hun nieuwe plek. Bij `fixed` staan de plekken
  vast op `fixedYear` en verandert alleen de vorm van de bloemen.
  De afweging is gemeten: bij de stap 2015 → 2016 wisselen 16 van de 24
  landen van plek. Dat is veel gelijktijdige beweging, en de kijker kan
  daardoor juist het spoor kwijtraken van wat er in de bloemen zélf
  verandert. `fixed` ruilt die informatie in voor rust; de rangorde is dan
  nog af te lezen via `rankBadge`.

- **`layout.type`** — hetzelfde bloemveld kan als grid (ranking), als
  spiraal (van gelukkigst in het midden naar buiten) of gegroepeerd per
  regio getoond worden. Het wisselen daartussen is zelf een animatie: de
  posities van de oude en de nieuwe ordening worden in elkaar overgevloeid,
  terwijl de wáárden onveranderd blijven. Tijdens de wissel verandert er
  dus niets aan wat een bloem zegt, alleen aan waar hij staat.

  De spiraal is **archimedisch** met constante booglengte: de straal groeit
  lineair met de hoek, en de hoekstap wordt per punt berekend als
  afstand / straal. Phyllotaxis (het zonnebloempatroon) was de eerste
  poging en pakt dichter, maar zet met de gulden hoek opeenvolgende items
  137 graden uit elkaar: de volgorde wordt dan onzichtbaar, terwijl juist
  die volgorde hier de betekenis draagt. Bij de archimedische variant
  liggen buren in de ranglijst ook naast elkaar op de curve, en daarom kun
  je die curve tekenen — zie `spiral.guide`. Hij bleek bovendien veel
  compacter: 987px in plaats van 1527px voor dezelfde 24 bloemen.

  `byRegion` vult **planken**: groepen worden van links naar rechts naast
  elkaar gezet tot de plank vol is. Een eigen volle band per groep zou een
  groep van één land naast acht cellen leegte zetten en het geheel vier
  planken hoger maken. `byRegion.columns` bepaalt de plankbreedte, en dat
  getal is niet vrijblijvend: gemeten over 6 t/m 12 kolommen geeft 9 de
  gunstigste verhouding (4 planken, 1482×898, schaalfactor 0,74).
- **Schalen clampen.** Elke schaal krijgt `.clamp(true)`. Bij domeinen die
  uit de data komen verandert dat niets — daar ligt per definitie niets
  buiten. Het telt bij handgezette domeinen zoals `[1, 3.2]` op de steel:
  een waarde eronder extrapoleert anders naar een *negatieve* straal, en
  dat is ongeldige SVG die stil faalt in plaats van te klagen.

- **`validateSpec(spec, data)`** — controleert vóór het tekenen of elke
  kolom bestaat, of encoding-velden numeriek zijn, en of een `log`-schaal
  geen domein vanaf nul krijgt. Gooit nooit; levert een lijst problemen.
  Fouten blokkeren het tekenen en komen in beeld, waarschuwingen staan
  erbij zonder de tuin weg te halen. Zonder deze controle wordt een
  tikfout in een veldnaam `undefined` → `NaN` → een pad met "NaN" erin,
  en dat rendert als *niets* — de duurste soort fout.

  De editor gebruikt dezelfde functie bij het openen van een spec-bestand,
  dan zonder data. Zou de editor zelf op `spec.flower` controleren, dan
  kende hij het bloem-template bij naam.

- **`theme.ink`** — de kleur van alle tekst en lijnen die geen eigen kleur
  in de spec hebben. Twee plekken houden een ingebakken terugval: de
  foutmelding en het validatiepaneel. Dat is bewust — die moeten juist
  kunnen tekenen wanneer de spec stuk of onvolledig is.

- **`data.labels`** — één afbeelding van kolomnaam naar leesbare naam, voor
  de hele visualisatie: de ankerlabels in de legenda, het bijschrift boven
  het raster, straks de tooltip en de inspector. De volgorde van de zes
  ankerpunten komt uit `data.fields`, dus `labels` hoeft geen volgorde te
  dragen en kan ook kolommen bevatten die niet als ankerpunt dienen.

- **`layout.header`** — het bijschrift boven het raster wordt *afgeleid* uit
  `layout.sortBy`, `layout.reorder` en `data.labels`, niet ingetypt. Zet iemand in de
  inspector de sortering op een ander veld, dan verandert de zin mee. Een
  vaste tekst zou blijven staan en gaan liegen — het soort fout dat niemand
  opmerkt omdat er iets plausibels staat. `note` is het ontsnappingsluik
  voor wie tóch een eigen zin wil; dan vervalt de afleiding.

- **`legend`** — zonder legenda is een bloem zes naamloze richtingen; de
  kijker kan de vorm dan niet lezen en de *maker* kan niet beoordelen of
  een encoding-keuze klopt. `type: "keyFlower"` volgt de oplossing van
  Fragapane en Lupi: geen aparte legenda naast de grafiek, maar één
  uitvergroot exemplaar uit de dataset zelf, met de zes factornamen aan hun
  ankerpunt. Je leest hem één keer en daarna lees je de hele tuin.
  `annotate.size` is geen sier: het oppervlak is de som van de zes factoren
  en dat is iets ánders dan de ladderscore waarop gesorteerd wordt. Zonder
  die zin leest iemand de tuin verkeerd. De zin wordt daarom *afgeleid* uit
  `contour.radius`: bij een sqrt-schaal vanaf nul klopt "oppervlak ≈ som",
  bij `linear` niet (dan groeit het oppervlak kwadratisch) en bij
  `perField` al helemaal niet. Een ingetypte zin zou blijven staan zodra
  iemand aan de schaal draait, en een legenda die liegt is erger dan geen
  legenda. `annotate.size` blijft bestaan als ontsnappingsluik. De legenda hoort binnen de
  renderer, niet in het editor-omhulsel — anders krijgt een klant de export
  zonder uitleg.

- **`interaction`** — hover, tooltip en pin-compare horen binnen de
  renderer, net als de tijdslider: ze staan in de spec en gaan mee in de
  export. Wat er *niet* in hoort is hover-voor-de-inspector en selectie
  om te bewerken; die zijn van het editor-omhulsel. Het onderscheid is dat
  de renderer zijn interactietoestand voor zichzelf houdt en niets naar
  buiten teruggeeft.

  Vastgezette bloemen winnen van hover: zodra je iets vastzet is dat je
  vergelijking, en een muis die er toevallig overheen beweegt hoort die
  niet te overschrijven. Boven `max` valt de oudste eruit — dat leest beter
  dan een klik die niets doet.

  De vergelijkmodus neemt de plek van de sleutelbloem in. Dat is dezelfde
  ruimte met dezelfde functie: uitleggen wat je ziet. De contouren worden
  daar zonder vulling getekend — drie gevulde vormen over elkaar geven
  modder in plaats van een vergelijking — en de stelen als concentrische
  ringen, want juist het onverklaarde deel onderscheidt twee landen vaak
  het duidelijkst.

- **`tooltip.fields`** — `$values` klapt uit naar de zes ankerpunten met
  hun label uit `data.labels`. Anders zou je die zes met de hand moeten
  herhalen en kunnen ze uit de pas raken met `data.fields`.

- **`layout.fit`** — het doosje waar het geheel in moet passen. Na het
  plaatsen wordt de tuin uniform geschaald tot hij erin past; de legenda en
  de kop nemen hun deel er vanaf. Dat gebeurt bewust *ná* het plaatsen: elke
  plaatsing rekent in zijn eigen natuurlijke maat en hoeft niets van het
  scherm te weten.

  **Typografie schaalt niet mee.** Een label van 11px is bij schaal 0,5
  onleesbaar, dus labels houden hun maat uit de spec en verdwijnen onder
  `flower.label.minScale`. Verbergen is eerlijker dan onleesbaar afdrukken —
  de naam blijft beschikbaar via de tooltip.

- **`controls[].binds`** — een control is een UI-element dat één pad
  aanstuurt. Maar let op wélk pad: een control stuurt de **view** aan, niet
  de spec.

  De spec is wat de maker heeft besloten — die zit in undo en wordt
  geëxporteerd. De view is waar de kijker nu naar kijkt: de gekozen
  ordening, het jaar op de slider, de vastgezette bloemen. De view wordt
  uit de spec geïnitialiseerd (`layout.type` is de *standaard*) en daarna
  door de renderer beheerd. Hij gaat nooit terug de spec in.

  Daarom doet ongedaan maken niets als de kijker de ordening wisselt, en
  levert "Spec opslaan" de standaard op en niet wat er toevallig op het
  scherm stond. Wijzigt de máker `layout.type` in de inspector, dan
  verandert de spec én volgt de view.

  `VIEW_BINDS` in `useView.js` bepaalt welke paden een control mag
  aansturen. Een binding naar een ander pad zou de spec moeten wijzigen, en
  dat mag de renderer niet; `validateSpec` geeft er een waarschuwing over.

- **De jaar-index klemmen.** `frameAt` zoekt een plaatsing op met
  `Math.floor(index)`. Die index en de lijst plaatsingen worden door
  verschillende hooks bijgewerkt, dus hij kan er één render lang buiten
  vallen — bijvoorbeeld als het aantal jaren krimpt terwijl de slider nog
  op de oude stand staat. Zonder grens is dat een crash op
  `undefined.placed`; nu levert het het laatste beschikbare jaar op.

  In dezelfde geest wordt een teruggehaalde sessie nu **mét de data**
  gevalideerd en niet alleen structureel. Dat een spec de juiste vorm heeft,
  zegt niets over of zijn kolommen bestaan.

- **Plaatsen buiten de animatielus.** Waar elke bloem staat hangt af van de
  data, de ordening en de sortering — niet van waar de tijdslider staat.
  `placeAllYears` rekent dat één keer uit; `frameAt` doet per beeldje alleen
  nog opzoeken en mengen. Gemeten over 600 beeldjes: 4 tot 6 keer sneller.

  Wel met de juiste verhoudingen erbij. Bij 216 bloemen kost het rekenwerk
  0,12ms per beeldje en het tekenen 15ms — het rekenen is dus onder één
  procent van het werk. De winst is echt maar klein; wie deze visualisatie
  wil opschalen moet aan het aantal getekende elementen werken, niet aan de
  berekening.

- **Geen tabellen van pad naar veld.** Twee plekken hielden een handmatige
  lijst bij: welke schalen er gebouwd worden (`stem.radius`,
  `contour.radius`, …) en welke kolommen meemengen bij een jaarstap. Zulke
  tabellen moeten bij elke nieuwe encoding bijgewerkt worden, en dat gaat
  een keer mis — een encoding die de tabel niet kent, springt dan stilletjes
  in plaats van te interpoleren, zonder foutmelding.

  Beide lopen nu de template-sectie af met `walkEncodings` en leveren per
  spec-pad wat ze nodig hebben. Voeg je morgen een encoding toe aan de
  spec, dan krijgt die vanzelf een schaal én doet die vanzelf mee in de
  animatie. Gecontroleerd: een nieuwe encoding op
  `contour.anchorDots.radius` levert zonder één regel code een schaal op en
  wordt meegemengd.

  Waar een vaste waarde staat in plaats van een encoding is er geen schaal;
  `scaleAt(scales, pad, vasteWaarde)` valt daarop terug. Zo blijft "vast óf
  gekoppeld" zichtbaar op de plek waar de waarde gebruikt wordt.

- **Toegankelijkheid.** De SVG heeft `role="img"` met een `<title>` en een
  `<desc>`; die laatste is samengesteld uit dezelfde afgeleide zinnen als
  het bijschrift en de legenda, dus hij kan niet uit de pas raken met wat
  er getekend wordt. Elke bloem is met Tab bereikbaar, toont dan zijn
  tooltip, en Enter of spatie zet hem vast. Zonder dat was pin-compare
  alleen met een muis te bedienen.

- **Fonts in de export.** De gebakken pagina haalde de webfonts bij Google,
  waardoor het IP-adres van elke bezoeker naar een derde partij ging — voor
  een Nederlandse klant een AVG-punt, en het maakte het bestand afhankelijk
  van een internetverbinding. De fonts worden nu tijdens het bakken
  opgehaald en als data-URI ingebakken (alleen de latijnse subset; dat
  scheelt de helft). Zonder netwerk faalt het bakken niet maar valt de
  export terug op systeemfonts, met een waarschuwing.

- **Twee API's.** `renderer/index.js` exporteert alleen `Garden`,
  `validateSpec` en `hasErrors` — wat een klant met een geleverde
  visualisatie kan doen. Alles wat een bewerkomgeving nodig heeft om de
  renderer te *bevragen* (welke curves, easings, ordeningen en schaaltypes
  kent hij; wat is een encoding; hoe wijzig je een spec-pad) staat in
  `renderer/editor-api.js`. Wie daaruit importeert bouwt gereedschap, geen
  visualisatie. Zonder die scheiding groeit de publieke API stilletjes mee
  met elke interne behoefte, en dan is elke interne wijziging een
  breuk voor de klant.

- **Structuurdelen bij een spec-wijziging.** `withOverrides` kopieert
  alleen de takken op weg naar de gewijzigde sleutel. Dat is niet alleen
  netter: met een volledige kloon is na een kleurwijziging óók
  `spec.flower` en `spec.data` een nieuw object, en dan herberekent elke
  `useMemo` die daarop let zich voor niets — afgeleide kolommen en alle
  schalen, bij elke schuif. Gemeten: drie kleurwijzigingen op rij laten
  `withDerived` en `buildScales` elk één keer draaien in plaats van vier.

- **`layout.header`, vervolg** — het bijschrift beschrijft ook wáár de
  eerste plek ligt, en dat verschilt per ordening: "linksboven" bij een
  raster, "in het midden" bij een spiraal, "binnen elke groep" per regio.
  Ook dat wordt afgeleid, niet ingetypt.

---

## 3b. Het schema — template "bump"

Rangorde over tijd: één lijn per entiteit, tijd als as in plaats van als
animatie. Zelfde datavorm als de bloem — entiteit × tijd × meetwaarden —
zodat elk verschil in de code aantoonbaar over de *grafiek* gaat.

```jsonc
{
  "template": "bump",
  "preview": { "jaar": 2024 },        // waar de cursor begint

  "data": {
    "source": "it-gebruik-bedrijfstakken_2015-2024.csv",
    "entity": "bedrijfstak",
    "time": "jaar",
    "derived": ["$gemiddelde"],       // welke afgeleide kolommen dit type wil
    "fields": ["cloud", "e_facturering", "ict_specialisten",
               "online_verkoop", "big_data", "ai_toepassing"]
  },

  "layout": {
    "fit": { "width": 1520, "height": 820 },
    "sortBy": { "field": "$gemiddelde", "order": "desc" }
  },

  "bump": {
    "plot": { "top": 70, "right": 300, "bottom": 50, "left": 270 },
    "line": {
      "curve": "curveBumpX",          // curveBumpX · curveMonotoneX · curveLinear
      "width": { "field": "werkzame_personen", "scale": "sqrt",
                 "domain": { "from": 0 }, "range": [1.5, 9] },
      "color": { "field": "cluster", "scale": "ordinal",
                 "range": ["#2d6a4f", "#e07a5f", "#3d405b", "#c9a227", "#81b29a", "#9d4edd"] },
      "opacity": 0.85,
      "hitWidth": 16                  // onzichtbaar trefvlak; een lint van 1,5px is niet te raken
    },
    "dots":   { "show": true, "radius": 3.2, "strokeWidth": 1.4 },
    "cursor": { "show": true, "reveal": true, "width": 1.2, "opacity": 0.55,
                "dotRadius": 5.5, "yearSize": 13 },
    "labels": { "show": true, "size": 11, "offset": 12 },
    "axis":   { "show": true, "size": 11, "opacity": 0.7,
                "gridOpacity": 0.12, "tickLength": 8 },
    "legend": { "show": true, "size": 11, "swatch": 9 }
  }
}
```

**Wat dit type deelt met de bloem.** De encodings en hun schalen, de
afgeleide kolommen, de klok (`useTimeline` en de tijdslider), het dimmen en
vastzetten (`highlight.js`), de tooltip, de validatie, undo, opslaan en de
export. Alleen `bump-geometry.js` en `BumpChart.jsx` zijn van hemzelf.

**De rangorde wordt berekend, niet gelezen.** Er zit een kolom
`rang_in_jaar` in de data, maar die wordt genegeerd: de plek volgt uit
`sortRows` met `layout.sortBy` — dezelfde functie die het bloemenraster
sorteert. Daardoor kun je op elk veld een bump chart maken, en betekent
"eerste plek" hetzelfde als daar.

**De cursor volgt de curve, niet een rechte lijn.** `curveBumpX` tekent per
segment een bezier met beide controlepunten op de horizontale helft. Zou de
cursorstip lineair interpoleren, dan lag hij naast het lint — het meest
zichtbaar midden in een kruising, precies waar je kijkt. Door dezelfde
parameter voor x en y te gebruiken ligt de stip er exact op (gemeten:
afwijking nul). Bij `curveMonotoneX` is het een benadering; die curve hangt
van de buurpunten af en is niet per segment te evalueren.

---

## 3c. Het schema — template "ridge"

De verdeling van een meting per groep, gestapeld. Het eerste type met een
**andere datavorm**: bloem en bump chart tekenen iets per entiteit over de
tijd, hier is elke rij één losse meting en is de getekende vorm een groep.
Geen klok, geen animatie, geen cursor — tijd is de stapelrichting.

```jsonc
{
  "template": "ridge",

  "data": {
    "source": "montagetempo-films_1920-2024.csv",
    "entity": "film",                 // één rij = één film = één meting
    "time": "jaar",
    "derived": [],                    // dit type wil geen afgeleide kolommen
    "fields": ["gemiddelde_shotlengte"]
  },

  "layout": { "fit": { "width": 1180, "height": 860 } },

  "ridge": {
    "plot":  { "top": 30, "right": 60, "bottom": 70, "left": 110 },
    "group": { "field": "decennium", "order": "asc" },
    "axis":  { "field": "gemiddelde_shotlengte", "scale": "log",
               "domain": [0.8, 60], "ticks": [1, 2, 3, 5, 8, 12, 20, 32, 50],
               "label": "seconden per shot — logaritmisch",
               "show": true, "size": 11, "opacity": 0.75,
               "gridOpacity": 0.10, "tickLength": 6 },
    "fill":  { "field": "decennium", "scale": "linear",
               "domain": [1920, 2020], "range": ["#2d6a4f", "#e07a5f"] },
    "fillOpacity": 0.85,
    "strokeWidth": 1.6,
    "overlap": 1.4,                   // hoever een vorm over zijn buurman valt
    "smoothing": 1.0,                 // factor op de berekende bandbreedte
    "samples": 220,
    "labels": { "show": true, "size": 12, "offset": 14 }
  }
}
```

**`axis` is geen encoding.** Hij heeft geen `range`, en dat is het verschil:
een encoding zegt "geef een rij, krijg een waarde", maar een as moet een
*willekeurige* waarde kunnen omzetten — ook eentje die in geen enkele rij
voorkomt, zoals het midden van een verdeling. Daarvoor is `scaleFor` in
`scales.js`; het bereik komt van het tekenvlak, niet uit de spec.

**De bandbreedte wordt berekend, niet opgegeven.** Eerst stond er een vast
getal in pixels. Dat is niet robuust: de juiste gladheid hangt af van hoeveel
metingen er zijn en hoe ver ze uit elkaar liggen, en dat verschilt per groep
en verandert zodra het vlak van maat verandert. Met een vast getal las je
bij dertig films de ruis als structuur — elke film kreeg zijn eigen bultje,
elf toppen per decennium. Nu is het de vuistregel van Silverman met een
`smoothing`-factor als knop: één top per decennium, en het blijft kloppen
bij ander formaat of meer data. De dichtheid wordt in *pixelruimte*
berekend, want de as mag logaritmisch zijn en een bandbreedte in seconden
betekent dan onderaan iets anders dan bovenaan.

**De stapeling moet exact passen.** Met `n` groepen, een piekhoogte van
(1 + `overlap`) keer de rijafstand en `n − 1` tussenruimtes volgt daaruit
rijafstand = hoogte / (n + overlap). De eerste versie klopte niet en liet de
onderste vorm 42px buiten het vlak vallen; er zijn nu tests die vastleggen
dat de bovenste piek de bovenrand raakt en de onderste basislijn de
onderrand, bij elke overlap.

**De aanwijsbare eenheid is de groep, niet de entiteit.** `opacityOf` in
`highlight.js` las `row[spec.data.entity]` — dat gaat ervan uit dat je
aanwijst wat de data als entiteit ziet. Hier wijs je een decennium aan
terwijl de entiteit een film is. De template geeft dat nu door; het platform
weet er niets van. Dit was de plek waar de naad opnieuw verkeerd lag, en de
enige plek bij dit type.

**De tooltip werkt ongewijzigd**, doordat de template een samenvattingsrij
aanlevert (aantal, mediaan, snelste, traagste). Dat is het bewijs dat die
laag over "een object met velden" gaat en niet over "een rij uit de
dataset".

---

## 4. Wat de inspector hieruit genereert

| spec-type                          | UI-element                                  |
|------------------------------------|---------------------------------------------|
| getal                              | slider / number input                       |
| kleur                              | color picker                                |
| encoding met numerieke range       | veld-dropdown + schaal-dropdown + range-slider |
| encoding met kleur-range           | veld-dropdown + gradient-editor             |
| enum (`shape`, `layout.type`)      | segmented control                           |
| `field` in `data.fields`           | drag-and-drop lijst uit de kolomnamen       |
| `tension`, `opacity`               | slider met live preview                     |

Elke wijziging in de inspector → nieuwe spec → component rendert opnieuw.
Dat is de hele loop.

**De inspector wordt afgeleid, niet gebouwd.** `describeSpec()` loopt de
spec af en bepaalt per waarde welke control erbij hoort: een getal wordt
een slider, een `#`-string een kleurkiezer, een object met een `range` een
encoding-editor. Voeg je morgen een sleutel toe aan de spec, dan staat hij
vanzelf in het paneel. Zou je de inspector met de hand samenstellen, dan
lopen spec en inspector onvermijdelijk uit elkaar.

Twee dingen zijn *niet* afleidbaar en staan daarom in tabellen:

- **Grenzen.** Uit de waarde `0.85` valt niet af te lezen dat opacity van
  0 tot 1 loopt, en uit `170` niet dat `cellSize` tussen 60 en 300 hoort.
- **Keuzelijsten.** Welke curves, easings, layouts en schaaltypes bestaan,
  weet alleen de renderer. Die publiceert ze daarom zelf
  (`CURVE_TYPES`, `EASE_TYPES`, `LAYOUT_TYPES`, `SCALE_TYPES_LIST`), en de
  inspector leest die lijsten. Zo kan het paneel niets aanbieden dat de
  renderer niet kan tekenen.

De labels zijn het spec-pad zonder zijn sectie (`spiral · guide · opacity`).
Alleen de laatste sleutel tonen zou in één sectie drie keer `show` en twee
keer `columns` opleveren — allemaal iets anders. Zo leert het paneel je
bovendien de spec kennen.

---

## 4b. Een volgend grafiektype toevoegen

Wat er nodig is, in volgorde:

1. Een sectie in de spec onder een eigen naam, plus `"template": "<naam>"`.
2. Een component die `{ spec, data }` aanneemt en tekent, en een regel in
   `templates.js`.
3. Grenzen en keuzelijsten voor de eigen sleutels in `TEMPLATE_HINTS`
   (`src/editor/inspect.js`). Sla dit niet over: zonder grenzen verzint de
   inspector twee keer de huidige waarde, en dat is voor een marge of een
   opacity onzin.
4. Eventueel een afgeleide kolom in `derive.js`, en die opnemen in
   `data.derived`.

Wat je **niet** hoeft aan te raken: validatie, schalen, undo, opslaan,
laden, SVG-export, de gebakken export, de tooltip, het dimmen en vastzetten,
de picking-laag, of de inspector zelf.

Wat het twee keer werkelijk kostte:

| | nieuwe regels | gewijzigd in bestaande bestanden |
|---|---|---|
| type 2 (`bump`) | 636 | 3 bestanden, vijf regels |
| type 3 (`ridge`) | 358 | 2 bestanden |

Bij type 2 waren de drie plekken: de tijdslider haalde zijn kleur uit de
bloem, de editor importeerde `Garden` bij naam, en `useView` ging ervan uit
dat elke grafiek een `layout.type` heeft. Bij type 3 waren het er twee:
`highlight.js` (de aanwijsbare eenheid) en `scales.js` (een as is geen
encoding). Elke keer was het host-code die stilzwijgend één template kende.

Wat er dan nog niet is: een vergelijkpaneel (`Compare` bestaat alleen voor
de bloem — bij de bump chart en de ridgeline ís vastzetten de vergelijking),
en een legenda-mechaniek die niet per type opnieuw bedacht hoeft te worden.
De bloem heeft een sleutelbloem, de bump chart een rij swatches, de
ridgeline niets.

---

## 5. Eerste bouwvolgorde (voorstel)

1. Één bloem, één jaar, alles vast — `d3.lineRadial()` met een gesloten
   curve op zes (hoek, straal)-punten. Dit is de kern; speel met `tension`
   (zie de tabel in sectie 3 voor wat die per curve-familie doet).
2. Encodings voor `contour.radius` en `stem.radius`.
3. Grid-layout met 24 bloemen.
4. Legenda (`keyFlower`) en het bijschrift boven het raster. Bewust vóór
   de animatie: zolang de zes richtingen geen naam hebben en de volgorde
   niet benoemd is, is elke keuze over encodings een smaakoordeel in
   plaats van iets wat je kunt nakijken.
5. Tijdslider + interpolatie (let op: paden met gelijk aantal punten
   interpoleren netjes; dat is hier gegarandeerd).
6. Gradient-fill en `$delta`-contour (eenvoudige variant).
7. Hover, tooltip, pin-compare.
8. Layout-wissel (grid → byRegion → spiral).
9. Inspector-paneel over het geheel.

---

## 6. Canvas-bewerkingen (Illustrator-achtig) — v1

Uitgangspunt: **alles wat je op het canvas doet, schrijft naar de spec.**
Er is nooit een "losse" wijziging die de data-koppeling omzeilt.

### Wel in v1

| bewerking op canvas                          | wat er in de spec verandert                    |
|----------------------------------------------|------------------------------------------------|
| bloem aanklikken                             | selectie → inspector toont `flower.*` ✔        |
| ankerpunt aanklikken                         | selectie → inspector toont dat veld + encoding ✔ |
| aan een ankerpunt trekken                    | `contour.radius.range[1]` (alle bloemen mee!) ✔ |
| steel groter/kleiner trekken                 | `stem.radius.range`                            |
| hele bloem verslepen                         | `layout.overrides[country] = {x, y}`           |
| label verslepen                              | `label.offset` / `label.anchor`                |
| tekst plaatsen (annotatie)                   | `annotations[]`: `{ text, x, y, year? }`       |
| lijn/pijl tekenen (annotatie)                | `annotations[]`: `{ type: "arrow", from, to }` |
| hover over element                           | aanwijzer verandert; inspector-highlight volgt bij klik ✔ |
| kleur kiezen via eyedropper op een bloem     | kopieert die encoding naar de selectie         |
| Cmd-Z / Cmd-Shift-Z                          | spec-history (elke spec-versie = één stap) ✔   |

Eén sleepbeweging aan een slider is één stap, geen honderd: bewerkingen aan
hetzelfde pad binnen 0,7 seconde vervangen de bovenste stap in plaats van
er een toe te voegen. De bronspec wordt nooit gemuteerd — elke bewerking
levert een kopie op, en dat is precies wat undo mogelijk maakt.

### Bewust niet in v1

- Vrij tekenen van vormen zonder data-koppeling (wel als *annotatie*,
  niet als datalaag).
- Per-bloem uitzonderingen op encodings ("alleen Finland dikker") —
  mogelijk via `overrides`, maar dat is een v2-discussie: het staat
  op gespannen voet met de regel dat de spec de bron van waarheid is.
- Bezier-handles op de contour zelf; de vorm wordt bepaald door data + `tension`.

### Hoe het canvas de inspector bereikt

> **Grens:** de editor vangt alleen klikken áf die binnen de `<svg>` vallen.
> De renderer heeft ook eigen bedieningselementen — de afspeelknop, de
> ordening-dropdown — en die staan binnen hetzelfde blok. Zonder die grens
> slikt de editor die klikken op en doet de afspeelknop niets meer. Dat is
> precies wat er gebeurde; het bleef vijf reviewfases onopgemerkt omdat geen
> enkele unit-test de bedrading raakt. Vandaar `npm run smoke`, dat de
> gebouwde app in een echte browser bedient.


De renderer mag geen selectielogica bevatten en geen callbacks teruggeven —
anders is hij niet meer los te leveren. De oplossing is dat hij **labelt
wat hij tekent**: elk element krijgt een `data-spec-path` (en waar zinvol
`data-spec-field` en `data-spec-entity`). Dat is een label, geen logica.

De editor vangt de klik op zijn eigen omhullende element op en leest via
`closest('[data-spec-path]')` het dichtstbijzijnde label. Daardoor wint de
fijnste treffer vanzelf: klik je op een ankerpunt, dan krijg je dat punt
plus zijn veld; klik je ernaast op de contour, dan de contour; klik je in
de lege ruimte binnen de bloem, dan de bloem als geheel. Er hoeft geen
enkele hitbox geordend te worden.

De selectie wordt zichtbaar gemaakt met een CSS-regel die de editor
injecteert, niet met een extra element in de renderer. In SVG werkt
`outline` niet, maar `filter: drop-shadow` wel — en die tast de vorm zelf
niet aan.

Klikken betekent in de spec al iets (`pinCompare`), dus de editor heeft
twee modi: in **Bewerken** is de klik van de editor en wordt hij tegen-
gehouden voordat de renderer hem ziet; in **Bekijken** gedraagt alles zich
zoals bij de eindgebruiker.

### Hoe slepen bij de spec komt

Bij een klik hoeft de editor alleen te weten wélk pad erbij hoort. Bij een
sleep moet hij pixels terugrekenen naar een spec-waarde, en dat vraagt
meetkunde die in de template zit. De renderer labelt daarom niet alleen wat
een element aanstuurt, maar ook hoe je eraan kunt trekken:

| attribuut | betekenis |
|---|---|
| `data-drag-origin` | het lokale nulpunt van deze groep is het middelpunt van radiale gebaren |
| `data-drag` | het soort gebaar (`"radial"`) |
| `data-drag-target` | het spec-pad dat mee moet schalen |

De editor meet dan alleen nog een verhouding: hoeveel keer verder is de muis
van dat middelpunt dan waar hij begon? Die factor gaat op de spec-waarde, en
`history.set` doet de rest. Geen callbacks, geen meetkunde in de editor.

Twee dingen die het gebaar bruikbaar maken. De grijpvlakken zijn onzichtbaar
en ruimer dan de stippen zelf — een stip van 2,5px is niet te pakken. En een
sleep eindigt met een klik; die wordt ingeslikt, anders verzet hij de
selectie naar het punt dat je net verplaatst hebt.

Eén sleepbeweging is één ongedaan-maken, doordat `useSpecHistory`
opeenvolgende bewerkingen aan hetzelfde pad samenvoegt. Nagemeten in de
rooktest: slepen van 66 naar 99, teller op één wijziging, en Cmd-Z zet hem
terug op 66.

Alleen de bloem heeft dit nu. De bump chart en de ridgeline hebben nog geen
sleepbare punten; dat is een kwestie van dezelfde drie attributen toevoegen.

### De mentale regel

In Illustrator manipuleer je het *object*. Hier manipuleer je de *regel*
die alle objecten tekent. Trek je één ankerpunt naar buiten, dan schaal je
de hele tuin. Dat is geen beperking maar de reden dat dit interactief kan
zijn: dezelfde regel wordt tien jaar lang opnieuw toegepast.

---

## 6b. Bewaren en exporteren

Drie niveaus, bewust gescheiden:

| vorm | wat het is | waarvoor |
|------|------------|----------|
| localStorage | vangnet tegen een herlaad | je eigen sessie, geen archief |
| `.spec.json` | **de spec is het product** | archiveren, doorgeven, versiebeheer |
| `.svg` | de tekening zoals hij nu staat | afmaken in Illustrator, drukwerk |
| `npm run bake` → `.html` | renderer + spec + data in één bestand | de klant, zonder bouwstap |

**Inbedden.** Het gebakken bestand meldt zijn hoogte aan de omliggende
pagina (`postMessage`), zodat een iframe kan meegroeien; een iframe kan zijn
eigen hoogte niet bepalen en de inbedder zou hem anders moeten raden. Met
`--embed` blijft de titel weg, want op een redactiepagina staat die er al.

**`layout.fit.minWidth`** is een ondergrens op de breedte. Zonder die grens
schaalt de hele tekening mee op een smal scherm — tekst incluis — en wordt
een label van 11px op een telefoon 2,8px. Mét die grens scrollt de pagina
horizontaal op ware grootte. Geen van beide is prettig; deze grafieken zijn
te dicht voor een telefoon, en de spec maakt die keuze expliciet in plaats
van er stilzwijgend één te maken.

De gebakken HTML bundelt de data als tekst in plaats van hem op te halen,
zodat het bestand ook vanaf `file://` werkt. Er zit geen editor in: geen
inspector, geen geschiedenis, geen localStorage. `npm run bake -- mijn.spec.json`
bakt een geëxporteerde spec in plaats van die uit de repo.

De SVG-export serialiseert de node die er op dat moment staat, dus je
exporteert exact wat je ziet — inclusief het jaar waar de tijdslider op
staat, en inclusief de `data-spec-path`-labels, die in een SVG-editor als
laagnamen bruikbaar blijven.

---

## 6c. Grenzen horen bij de sleutel, niet bij de waarde

Twee keer dezelfde fout gemaakt, dus het staat hier apart. De inspector
verzint grenzen voor een getal dat hij niet kent: twee keer de huidige
waarde. Voor `opacity` of een marge is dat onzin — bij `plot.top = 0`
worden de jaartallen op een negatieve y getekend en vallen ze buiten het
canvas.

Elke nieuwe template hoort daarom zijn eigen `bounds` op te geven, met paden
*binnen* de sectie. En de geometrie hoort een tweede grendel te hebben: bij
`plotArea` worden marges die samen niet passen evenredig teruggebracht, zodat
een schuif die te ver gaat een klein vlak oplevert in plaats van een
omgeklapte grafiek.

## 6d. Waarom de bump chart wél een afspeelknop mag hebben

Een cursor die over een afgeronde grafiek veegt is beweging zonder
informatie: er ontvouwt zich niets, want alles staat er al. Bij een raster
van bloemen is afspelen zinvol omdat elk beeldje andere data toont; bij een
bump chart niet.

`cursor.reveal` lost dat op: de linten worden alleen getekend tot waar de
cursor staat, en de namen aan de rechterkant lopen mee en tonen de rangorde
op dát moment. Daarmee vertelt de knop het verhaal in de volgorde waarin het
gebeurde, in plaats van een aanwijsstok over een eindresultaat te schuiven.
Zet `reveal` uit en de slider is alleen nog een leesliniaal — dan hoort
`showPlayButton` ook uit.

## 7. Ideeën voor later

- **Achtergrond voor de spiraal.** Een subtiele tuin waaruit de bloemen
  lijken op te komen, zodat het verband tussen de bloemen ook visueel
  gedragen wordt in plaats van alleen door de geleidelijn. Waarschijnlijk
  maatwerk-illustratie; laat zich slecht automatisch genereren en hoort
  daarom niet in het spec-schema thuis maar als een `theme.backdrop`-asset.
- **`$delta` per ankerpunt** in plaats van één gemiddelde per bloem, via
  een pad met variabele breedte (twee offset-contouren, gevuld).
- **Encodings vooraf uitrekenen** in de gebakken export, zodat d3-scale
  eruit kan. Nu nog niet gedaan: de animatie heeft de schalen op elk frame
  nodig, dus je wint er alleen iets mee bij een stilstaande grafiek — en
  daar is de SVG-export al de betere vorm van.
- **Eén legenda-mechaniek** in plaats van drie. Elk type bedenkt hem nu
  opnieuw: de bloem een uitvergrote sleutelbloem, de bump chart een rij
  swatches, de ridgeline geen. Wat ze delen is "leg uit wat een kleur, een
  dikte of een oppervlak betekent" — en dat is af te leiden uit de
  encodings, zoals `sizeCaption` al doet voor één geval. Pas generaliseren
  wanneer een vierde type laat zien wat er werkelijk gedeeld moet worden.
- **Echte data.** Alle drie de datasets zijn synthetisch. Ze hebben de
  structuur van hun bron (World Happiness Report, CBS ICT-gebruik bij
  bedrijven, Cinemetrics) zodat echte cijfers erin passen, maar zolang dat
  niet gebeurd is kun je er niets mee laten zien wat waar is.
