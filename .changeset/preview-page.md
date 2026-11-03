---
'@chassis-ui/icons': minor
---

**Breaking.** `icons/preview.html`, the page of svg-sprite, is gone, and `chassis-icons preview`
writes the page of a set into `preview/`, from the output: `index.html`, its stylesheet and its
script, and the files of `dist/web/` and `dist/svgs/` that it draws and links. With `--serve` it
serves the folder at `http://localhost:4325/`, or at the port of `--port`. The page is drawn
with Chassis CSS, which it takes from jsDelivr at a fixed version and with SRI hashes: a search,
a filter of the styles and a theme switch, every icon drawn from the sprite, and on a click a
drawer with the icon at size, examples of it in Chassis components, its SVG file to download,
and the code of the sprite symbol, the font class and the embedded SVG, highlighted and with a
copy button. Opened from the file system, it draws the icons with the font. The page is not
output: it is not committed, published or compared by `verify`, and the archive of a release
holds it. `init` writes the script `preview` and a `.gitignore` that names `preview/`: in a
repository made earlier, run `chassis-icons init --check`, add the script, and replace the line
`icons/preview.html` of `.gitignore` with `preview/`.
