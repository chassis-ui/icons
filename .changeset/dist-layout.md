---
'@chassis-ui/icons': minor
---

**Breaking.** The output of a set is in `dist/`, as the output of `chassis-ui/tokens` and
`chassis-ui/assets` is: `icons/<font>.*` is `dist/web/<font>.*`, and `svgs/<name>.svg` is
`dist/svgs/<name>.svg`. The files are the same, byte for byte. The build writes `main`,
`style` and `sass` with the new paths, `files` as `dist`, and `exports` as `"."`,
`"./dist/*"` and `"./package.json"`, and removes the entries of `files` and `exports` about
`icons/` and `svgs/`. `dist/icons.json` is new: the index of the set, with its font name, class
prefix, frame, styles and pairs, and each icon with its code point, its style and its name
without the style, one line per icon and no version. `archive` writes
`<font>-web-<version>.zip`, with `icons.json`, `svgs/`, `web/` and the page of the set in
`preview/`. `verify` reads the code points of a tag made before `dist/` from
`icons/<font>.json`. A repository made earlier runs the build, removes `icons/` and `svgs/`, and
commits `dist/`; a project that uses its files takes them from `dist/`.
