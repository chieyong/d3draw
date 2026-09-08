# D3draw — Happiness Garden

## Context
David maakt datavisualisaties (Tableau, Power BI, Illustrator) en wil
sneller en gebruiksvriendelijker maatwerk D3.js-visualisaties kunnen maken met als inspiratie het werk van Federica fragapane, Nadieh Bremer, Giorgia Lupi.
Dit project is de eerste "template" van een latere app: een Illustrator-
achtige editor voor D3-visualisaties. Zie spec-schema-happiness-garden.md
voor het ontwerp; dat document is leidend.

## Doel: exporteerbare code
De renderer (het React-component dat de spec tekent) is het eindproduct
dat straks aan klanten wordt geleverd. Daarom:
- De renderer heeft géén afhankelijkheid van de editor. Geen selectie-,
  hover-voor-inspector- of undo-logica erin. Die zit in een laag eromheen.
- De renderer accepteert alleen `spec` en `data` als props en moet
  standalone werken in een willekeurig React-project.
- Bouw vanaf stap 1 met deze scheiding; niet later ontwarren.


## Werkwijze — belangrijk
- Bouw stapsgewijs volgens sectie 5 van het schema, één stap per keer.
  Ga niet door naar de volgende stap zonder dat David dat zegt.
- Leg elke D3-keuze uit vóórdat je code schrijft (waarom lineRadial,
  waarom deze scale, waarom deze join-structuur).
- Schrijf geen code die David niet kan verklaren. Liever eenvoudiger.

## Technische regels
- React + D3 v7, Vite. D3 alleen voor berekeningen (scales, generators,
  layouts); React rendert de SVG. Geen d3.select op DOM die React beheert.
- Alles wat visueel is komt uit de spec (JSON). Geen hardcoded kleuren,
  diktes of marges in de component. Encoding-patroon: vaste waarde óf
  { field, scale, range }.
- Schaaldomeinen over alle jaren berekenen, niet per jaar.
- Data: world_happiness_sample_2015-2024.csv.

## Bekende beperking
Lijndikte per ankerpunt ($delta) in v1 als één gemiddelde dikte per bloem.

## Voor volgende iteraties
Later (v2): twee exportvormen — (1) spec + generieke renderer voor eigen
gebruik, (2) "gebakken" standalone code met ingevulde waarden voor klanten.
Nu nog niet bouwen; wel zorgen dat de architectuur dit niet blokkeert.