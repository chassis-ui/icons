---
'@chassis-ui/icons': minor
---

The package has an `exports` map. `@chassis-ui/icons` is the stylesheet of the icon font:
`icons/chassis-icons.css`, and `icons/chassis-icons.scss` for Sass. `@chassis-ui/icons/icons/*`,
`@chassis-ui/icons/svgs/*` and `@chassis-ui/icons/package.json` are the files of the package, at
the paths they had. A bundler and the package importer of Sass find all of them by name, and
`sideEffects` keeps an import of a stylesheet in a bundle. No other path of the package can
be imported, and it holds no other file. The README shows the ways to use an icon.
