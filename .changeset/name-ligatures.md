---
'@chassis-ui/icons': minor
---

With `"ligatures": true` in `chassis.build`, the font draws each icon for its name too, as a
ligature: `<i class="<prefix>"><name></i>`. The stylesheets get the class `<prefix>`, which
sets the font and its ligatures on the element, and the README of the set shows the name in
the font. The code points and the class of each icon stay. `init` writes the setting as
`false`, and a repository without it builds as before.

Without the setting, the output of a set does not change. The build asks Fantasticon for the
SVG font only, and makes the TTF, WOFF and WOFF2 of it with svg2ttf, ttf2woff and ttf2woff2,
the tools and the options of Fantasticon, which write the same fonts byte for byte.
