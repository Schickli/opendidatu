#!/bin/bash

set -euo pipefail

curl --fail --location --compressed -o tiles.json https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/tiles.json
curl --fail --location -o demo.mbtiles https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/ch.swisstopo.base.vt.mbtiles
curl --fail --location --compressed -o style.json https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json
curl --fail --location --compressed -o sprite.json https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite.json
curl --fail --location -o sprite.png https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite.png
curl --fail --location --compressed -o sprite@2x.json https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite@2x.json
curl --fail --location -o sprite@2x.png https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite@2x.png