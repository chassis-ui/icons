---
'@chassis-ui/icons': patch
---

The font is built with `fantasticon` 4, the original of the fork `@twbs/fantasticon` that built
it before. Every glyph keeps its outline, its width and its code point. The font holds them in
another order, so `icons/chassis-icons.woff2` and `icons/chassis-icons.woff` are other files,
and the stylesheets ask for them with another hash.
