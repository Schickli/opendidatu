#!/bin/bash

curl -o tiles.json https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/tiles.json
curl -o demo.mbtiles https://vectortiles.geo.admin.ch/tiles/ch.swisstopo.base.vt/v1.0.0/ch.swisstopo.base.vt.mbtiles
curl -o style.json https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json
curl -o sprite.json https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite.json
curl -o sprite.png https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite.png
curl -o sprite@2x.json https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite@2x.json
curl -o sprite@2x.png https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/sprite/sprite@2x.png