---
'@chassis-ui/icons': minor
---

**Breaking.** The build writes `icons/<font>.html`, the page of the set, in place of
`icons/preview.html`, the page of svg-sprite. The page shows every icon drawn from the sprite
with its name, filters them by name, and opens on a click a panel with the class, the code
point, the `<use>` of the sprite symbol and the path of the SVG file. It links `<font>.css` and
`<font>.svg` beside it with relative paths and loads nothing else, so it opens from the file
system, from a static host and from `node_modules`. It is a file of the font name: `files`
publishes it, `archive` holds it and `verify` compares it, so commit it with the output. The
`.gitignore` that `init` writes no longer names `icons/preview.html`: remove that line, and the
file, from a repository made earlier.
