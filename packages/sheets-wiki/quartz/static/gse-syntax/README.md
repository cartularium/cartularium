# gse-syntax

This repository contains a TextMate grammar for **Google Sheets formulae**, published as a VSCode extension and designed for reuse in environments like **Shiki** and **Obsidian**.

It follows [leonidasIIV’s](https://github.com/leonidasIIV/vsc_sheets_formula_extension) convention of using `gse` as the file extension and language ID.

This grammar adds comprehensive support for modern functions and features.

## Usage in Obsidian

This grammar can be used to syntax highlight Google Sheets formulae in Obsidian when used in conjunction with [Shiki Highlighter](https://publish.obsidian.md/hub/02+-+Community+Expansions/02.05+All+Community+Expansions/Plugins/shiki-highlighter).

Start by installing Shiki Highlighter. Then, under `Settings -> Community plugins -> Shiki Highlighter`, set `Custom languages folder location` to a directory containing [`gse.tmLanguage.json`](https://raw.githubusercontent.com/Astral1119/gse-syntax/refs/heads/main/syntaxes/gse.tmLanguage.json). Restart Obsidian, and code blocks with the `gse` tag will highlight accordingly.
