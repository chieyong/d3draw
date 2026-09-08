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
trap 'kill $SERVER 2>/dev/null; rm -f dist/rooktest.html /tmp/rooktest-dom.html' EXIT
sleep 2

"$CHROME" --headless --disable-gpu --dump-dom --virtual-time-budget=25000 \
  "http://localhost:$PORT/rooktest.html" > /tmp/rooktest-dom.html 2>/dev/null

node tools/smoke-check.mjs /tmp/rooktest-dom.html
