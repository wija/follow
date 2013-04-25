#!/bin/bash
cat \
../src/header_includes.html \
../src/styles.css \
../src/head_body_between.html \
../src/layout.html \
../src/main.js \
../src/CountryList.js \
../src/loadDataset.js \
../src/Map.js \
../src/Timelines.js \
../src/Table.js \
../src/Controls.js \
../src/closing_script_tag.html \
../src/footer.html \
> ../index.html
