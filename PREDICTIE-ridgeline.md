# Voorspelling vóór grafiektype 3 — 8 sept 2026

Vastgelegd vóór er één regel gebouwd is. Niet bijwerken tijdens het bouwen.

## Wat er getoetst wordt

Type 2 bewees dat een andere *vorm* op dezelfde motor kan. Maar de bump
chart had dezelfde **datavorm** als de bloem: entiteit × tijd × meetwaarden.
De ridgeline breekt die vorm: 430 films, elk één meting op één moment, en de
grafiek toont **verdelingen per groep** in plaats van iets per entiteit.

## Welke aannames dit breekt

| aanname | houdt die stand? |
|---|---|
| één zichtbare vorm per entiteit | **nee** — de vorm is een decennium, niet een film |
| er is een tijdas of een klok | **nee** — geen animatie, geen cursor, geen tijdslider |
| afgeleide data is een kolom per rij (`derive.js`) | **nee** — een dichtheid is een aggregaat per groep |
| `layout.sortBy` bepaalt de ordening | deels — de volgorde is het decennium zelf |
| encodings → schalen via `buildScales` | ja |
| validatie, undo, opslaan, SVG-export, gebakken export | ja |
| de inspector werkt zonder wijziging aan `describeSpec` | ja, mits een `TEMPLATE_HINTS`-blok |
| picking via `data-spec-path` | ja |

## De twee scherpe voorspellingen

**1. `highlight.js` breekt.** `opacityOf` leest `row[spec.data.entity]` — het
gaat ervan uit dat de aanwijsbare eenheid gelijk is aan de entiteit uit de
data. Hier is de aanwijsbare eenheid een decennium en de entiteit een film.
Ik verwacht dat dit bestand moet wijzigen, en dat de juiste oplossing is dat
de *template* zegt wat zijn aanwijsbare eenheid is.

**2. `Tooltip` breekt níet.** `tooltipRows` leest velden uit een object; als
de template een samenvattingsrij aanlevert (mediaan, aantal films, snelste
en traagste) werkt hij ongewijzigd. Dat is de test of die laag echt over
"een rij" gaat en niet over "een rij uit de dataset".

## Voorspelling per bestand

**Ongewijzigd:** `Chart.jsx`, `validate.js`, `scales.js`, `derive.js`,
`overrides.js`, `template.js`, `useSpecHistory`, `usePicking`, `persist`,
`Field`, `Inspector`, `Editor`, `Tooltip`, `ErrorBoundary`, `SpecProblems`,
`captions.js`, en alles van de bloem en de bump chart.

**Wijzigt:** `templates.js` (één regel), `inspect.js` (een hints-blok),
`highlight.js` (zie hierboven), en waarschijnlijk `useView.js` opnieuw —
die ging al twee keer uit van iets wat niet elk type heeft.

**Nieuw:** een `RidgeChart.jsx` en een `ridge-geometry.js` met de
dichtheidsberekening. Schatting 400 tot 500 regels.

## Meetlat achteraf

1. Blijven de 80 tests groen zonder wijziging?
2. Blijven de bloem en de bump chart byte-identiek gerenderd?
3. Hoeveel bestanden uit de lijst "ongewijzigd" zijn tóch aangeraakt?
4. Werkt de inspector zonder wijziging aan `describeSpec`?
5. Werkt `npm run bake` op het derde type zonder aanpassing aan de tool?

Punt 5 faalde bij type 2 (de dataset stond hardcoded in het bakscript). Als
hij nu wél werkt, is dat het bewijs dat die reparatie de juiste was.
