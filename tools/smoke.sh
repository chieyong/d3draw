#!/bin/bash
# Rooktest: drijft de gebouwde app in een echte browser.
#
# Vitest dekt de pure functies, maar niet de bedrading - of een klik op de
# afspeelknop die knop ook bereikt, bijvoorbeeld. Precies dat ging stuk toen
# de editor klikken op het canvas ging opvangen: de knop zat binnen hetzelfde
# blok en kreeg de klik nooit. Geen enkele unit-test kon dat zien.
#
# Chrome wordt vanuit de shell gestart en niet vanuit Node: vanuit Node keert
# het proces niet terug.
set -e
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8123

[ -f dist/index.html ] || { echo "Geen dist/ - draai eerst npm run build"; exit 1; }
[ -x "$CHROME" ] || { echo "Chrome niet gevonden op $CHROME"; exit 1; }

node tools/smoke-page.mjs                      # schrijft dist/rooktest.html
(cd dist && python3 -m http.server $PORT >/dev/null 2>&1) &
SERVER=$!
disown $SERVER 2>/dev/null || true   # anders meldt bash het afsluiten als fout
# `|| true` is hier geen slordigheid: met `set -e` breekt de opruiming af op
# een mislukte kill, en díe status wordt dan de exitcode van het hele script.
trap 'kill $SERVER 2>/dev/null || true; rm -f dist/rooktest.html /tmp/rooktest-dom.html || true' EXIT
sleep 2

# Ruim budget: het scenario heeft ~23 seconden paginatijd nodig, maar de
# virtuele klok van Chrome loopt sneller op dan die paginatijd. Met 45
# seconden strandde de test halverwege — zonder foutmelding, want dan wordt
# de pagina simpelweg gedumpt terwijl het scenario nog loopt.
"$CHROME" --headless --disable-gpu --dump-dom --virtual-time-budget=120000 \
  "http://localhost:$PORT/rooktest.html" > /tmp/rooktest-dom.html 2>/dev/null

# De uitkomst expliciet doorgeven. Zonder dit bepaalt de opruimactie in de
# EXIT-trap de exitcode, en meldt de test een fout terwijl alles slaagde -
# of erger, andersom.
set +e
node tools/smoke-check.mjs /tmp/rooktest-dom.html
uitkomst=$?
set -e
exit $uitkomst
