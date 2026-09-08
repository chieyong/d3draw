# D3draw

Een spec-gedreven motor voor maatwerk datavisualisaties in React + D3, met
een Illustrator-achtige editor eromheen. Drie grafiektypes draaien op
dezelfde motor.

| type | grafiek | dataset |
|------|---------|---------|
| `flower` | radiale contour per land, geanimeerd over de jaren | World Happiness Report (voorbeelddata) |
| `bump` | rangorde over tijd, één lijn per bedrijfstak | CBS — ICT-gebruik bij bedrijven (voorbeelddata) |
| `ridge` | verdeling per decennium, gestapeld | Cinemetrics — montagetempo (voorbeelddata) |

**Alle datasets zijn synthetisch**, gemodelleerd op de genoemde bronnen. Ze
hebben de structuur van de echte publicaties zodat je die kunt inladen.

## Het idee

Alles wat visueel is komt uit een JSON-spec. Een eigenschap is óf een vaste
waarde óf een encoding — `{ field, scale, domain, range }`. De inspector
wordt uit die spec *afgeleid*: een getal wordt een slider, een kleur een
kleurkiezer, een encoding een veld-dropdown plus schaal plus bereik. Voeg je
een sleutel toe aan de spec, dan staat hij vanzelf in het paneel.

De renderer is het product: hij accepteert alleen `spec` en `data`, kent de
editor niet, en is als één HTML-bestand te leveren.

Zie [`spec-schema-happiness-garden.md`](spec-schema-happiness-garden.md)
voor het ontwerp — sectie 0 legt uit wat platform is en wat template.

## Commando's

```
npm run dev       de editor (?spec=flower | bump | ridge)
npm test          100 tests op de pure functies
npm run smoke     24 controles in een echte browser
npm run preview   rendert een spec server-side naar preview/
npm run bake      standalone HTML naar export/, zonder editor
npm run bundle    hele codebase in één bestand, voor review
```

`npm run preview` en `npm run bake` nemen een spec-pad:
`npm run bake -- src/spec/montagetempo-ridge.json`

## Exporteren

`npm run bake` levert **één HTML-bestand** met React, d3, de renderer, de
spec, de data en de fonts erin. Geen bouwstap, geen server, geen internet —
dubbelklikken werkt, ook offline. Ongeveer 310 kB.

```
npm run bake -- src/spec/mijn-spec.json            met titel erboven
npm run bake -- src/spec/mijn-spec.json --embed    zonder titel, voor in een artikel
```

**Inbedden in een pagina.** Het bestand meldt zijn eigen hoogte aan de
pagina die het inbedt, zodat de iframe kan meegroeien. Plak dit ernaast:

```html
<iframe id="viz" src="mijn-visualisatie-embed.html"
        style="width:100%;border:0;display:block"></iframe>
<script>
  addEventListener('message', (e) => {
    if (e.data?.type !== 'd3draw:hoogte') return
    document.getElementById('viz').style.height = e.data.hoogte + 'px'
  })
</script>
```

**Smalle schermen.** `layout.fit.minWidth` in de spec zet een ondergrens op
de breedte. Daaronder scrollt de pagina horizontaal in plaats van door te
schalen — want als de hele tekening krimpt, krimpt de tekst mee, en een
label van 11px wordt op een telefoon 2,8px. Haal de sleutel weg als je
liever hebt dat alles in beeld past, ook al is het klein. Voor deze drie
visualisaties is er geen goede uitkomst onder de ~800px: ze zijn er te dicht
voor.

## Structuur

```
src/renderer/   de motor: host (Chart), gedeelde onderdelen, drie templates
src/editor/     inspector, undo, opslaan, canvas-selectie — kent geen enkel type
src/spec/       één JSON per visualisatie
public/         de datasets (data.source in de spec verwijst hiernaar)
tools/          preview, bake, bundle, rooktest
tests/          vitest
```

De projectafspraken staan in [`CLAUDE.md`](CLAUDE.md). De externe review van
6 september en de twee voorspellingen die vóór het bouwen van grafiektype 2
en 3 zijn vastgelegd, staan als losse documenten in de wortel — die zijn
bewust niet bijgewerkt na afloop.
