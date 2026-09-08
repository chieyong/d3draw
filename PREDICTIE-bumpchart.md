# Voorspelling vóór grafiektype 2 — 8 sept 2026

Vastgelegd vóór er één regel gebouwd is, zodat we achteraf kunnen nakijken
of de architectuur deed wat hij beloofde. Niet bijwerken tijdens het bouwen.

## De claim die getoetst wordt

Dat er een tweede grafiektype bij kan zonder de renderer te verbouwen —
dat wat er staat een *platform* is en niet één grafiek met veel knoppen.

## Welke aannames de bump chart breekt

| aanname in de huidige code | houdt die stand? |
|---|---|
| één glyph per entiteit, geplaatst in een raster van cellen | **nee** — één lijn per entiteit door álle jaren, in één gedeeld assenstelsel |
| tijd is een animatie: één beeldje = één jaar | **nee** — tijd wordt een as; de slider wordt een cursor |
| de template-sectie heet `flower` | **nee** — moet configureerbaar |
| afgeleide kolommen (`$delta`, `$residual`) zijn algemeen | **nee** — die zijn bloemspecifiek; een bump chart wil `$rang` |
| encodings → schalen via `buildScales` | ja, na het loskoppelen van de sectienaam |
| view/spec-splitsing | ja — en dit is de eerste echte belasting ervan |
| `data-spec-path` als ingang op de inspector | ja |
| undo, opslaan, laden, export | ja |

## Voorspelling per bestand

**Ongewijzigd (0 regels):** `overrides.js`, `useSpecHistory.js`,
`usePicking.js`, `persist.js`, `Field.jsx`, `Inspector.jsx`, `Editor.jsx`,
`useTween.js`, `useTimeline.js`, `ErrorBoundary.jsx`, `SpecProblems.jsx`,
`Tooltip.jsx`, `Select.jsx`, `TimeSlider.jsx`, `highlight.js`, `useView.js`.
Samen ~1.050 regels.

**Kleine generalisatie (sectienaam of tabel losmaken):** `scales.js`,
`validate.js`, `captions.js`, `inspect.js`. Ik schat 10 tot 30 regels elk.

**Vervangen of nieuw:** `geometry.js`, `Flower.jsx`, `anchorLabels.js`,
`Legend.jsx`, `Compare.jsx` (~500 regels, blijven bestaan voor de bloem
maar doen niet mee aan de bump chart), plus nieuwe tegenhangers.

**Het grootste slachtoffer:** `Garden.jsx` (327 regels). Ik verwacht dat die
uiteenvalt in een *host* — data, schalen, view, klok, fit, foutafhandeling,
controls — en een *template* die weet hoe je deze grafiek tekent.

## Wat ik verwacht te ontdekken

Dat de naad tussen platform en template **niet** ligt waar de mappen nu
liggen (`renderer` vs `editor`), maar dwars door `renderer` heen: een deel
is grafiekonafhankelijk, een deel hoort bij de bloem. Dat is precies wat de
review "het schema-per-template" noemde en bewust uitstelde tot dit moment.

## Concrete meetlat achteraf

1. Hoeveel regels in de lijst "ongewijzigd" zijn tóch aangeraakt?
2. Draaien de 57 bestaande tests nog zonder wijziging?
3. Blijft de gebakken export van de bloem byte-voor-byte gelijk?
4. Werkt de inspector op de bump chart zonder dat er iets aan
   `describeSpec` verandert behalve de tabellen?

Faalt 1 of 3, dan is het platform nog geen platform.
