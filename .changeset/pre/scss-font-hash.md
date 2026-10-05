---
'@chassis-ui/icons': patch
---

`$chassis-icons-font-hash` of `icons/chassis-icons.scss` is the hash of the font of the same
build, as in `icons/chassis-icons.css`. It was a fixed value, so a Sass build kept the
cache-busting query of an older font after the font changed.
