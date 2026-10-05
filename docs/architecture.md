# Chassis Icons architecture

How the build of an icon set works, why it is built this way, and what it promises to write. It is for contributors who change the build in `packages/icons/build/` or the output in `packages/icons/`, and for a team that wants to know what it adopted. How to set up the repository, run the checks and open a pull request is in [CONTRIBUTING.md](../.github/CONTRIBUTING.md).

Paths below are relative to `packages/icons/` unless they start with the repository root. `source/`, the folder of the SVG files, is at the root. `<font>` is `name` of the configuration, `<prefix>` its `prefix`, and `<name>` the name of an icon.

## The build in one picture

```text
package.json ──────────┐  chassis.build: name, prefix, frame, styles, pairs, formats, header
source/<name>.svg ─────┤  only read, never written
codepoints.json ───────┘  the code points the set has given out, and the retired ones
        │
        ▼
config.js            reads and checks the configuration; the only module that knows a set
        │
        ▼ step svgs
optimize.js          SVGO: one file per icon, with the root attributes of the set
                     → svgs/<name>.svg, and removes a file whose source is gone
        │
        ▼ step sprite                          (reads svgs/)
sprite.js            svg-sprite: one <symbol> per file
                     → icons/<font>.svg, icons/preview.html
        │
        ▼ step font                            (reads svgs/ and codepoints.json)
codepoints.js        keeps, gives and retires code points → codepoints.json
font.js              Fantasticon: the font in each format; Handlebars: the stylesheets;
                     clean-css: the minified CSS
                     → icons/<font>.{woff2,woff,ttf}, .css, .min.css, .scss, .json
        │
        ▼ step package
manifest.js          the fields of package.json that name the files, and the README
                     → package.json, README.md
```

`node build/cli.js build --dry-run` runs the whole build into a temporary folder and lists the files of the package that it would change.

## The modules

Each module of `build/` does one thing, and takes what it needs as arguments.

| Module           | What it does                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `cli.js`         | The command line: `build`, `verify`, `lint-source`, `init`. Parses the options and returns an exit code    |
| `config.js`      | Reads `chassis.build`, fills in the defaults, refuses a setting it does not know, and resolves the folders |
| `names.js`       | Lists the icons of a folder in a fixed order, and splits a name into what it shows and its style           |
| `optimize.js`    | The one SVGO configuration, in two forms: a file of `svgs/`, and a symbol of the sprite. Writes `svgs/`    |
| `sprite.js`      | Builds the sprite and the preview page with svg-sprite                                                     |
| `codepoints.js`  | The registry: reads it, brings it up to date with the icons of the set, and checks it                      |
| `font.js`        | Draws the font with Fantasticon, renders the stylesheets from the templates, minifies the CSS              |
| `manifest.js`    | The fields of `package.json` that follow from the configuration, and the README of the package             |
| `build.js`       | Runs the steps, in the folders of the package or in any others; `compareWithBuild` and `init`              |
| `lint-source.js` | Checks whether each file of the source folder can be an icon of the set                                    |
| `verify.js`      | Compares the committed output with a fresh build, the code points with an earlier state, and the contracts |
| `logger.js`      | The one logger. A module never writes to the console itself                                                |
| `templates/`     | `css.hbs` and `scss.hbs`, the stylesheets of the font, and `readme.hbs`, the README of the package         |

The scripts of the root `build/` belong to the repository and not to the build of a set: `check-changeset.js` asks for a changeset, `sync-version-refs.js` copies the version, and `release-notes.js` and `release-archives.js` make the notes and the archive of a release.

## Design decisions

### The build names no set

A team that adopts the repository changes `source/` and the configuration, never the build. So no module of `build/`, no test, no workflow and no script of the root names a font, a prefix, an icon or a package. `config.js` is the only module that reads `package.json` for the settings, and every other module takes a `Config`. What a consumer of one set relies on, such as the names of the icons that the Chassis sites read, is data in `chassis.checks.json`.

The tests hold the build to this. They build the fixture, the set of another team with another font name, prefix, frame, styles and formats, and the journey test replaces the shipped set with the fixture and searches the output for anything of the set that was there.

### The source is only read

The build reads `source/` and writes everything else. Before the workspace layout, the build optimized the SVG files in place and removed their colors, so a failed run or a file in two colors changed the only copy of the artwork. With a source folder of its own, the output is a function of the source and the configuration, and `verify` can compare the two.

### The output is committed, and a fresh build equals it

`svgs/`, `icons/`, `codepoints.json`, `README.md` and the fields of `package.json` are committed. The site, Vercel and Chassis Assets read the committed files, and npm publishes them as they are. `verify` builds into a temporary folder and fails on any difference, so a commit cannot hold an output that its source does not build.

This needs a build that writes the same bytes on every machine. The names are sorted by code unit and not by locale, and SVGO, svg-sprite and Fantasticon get a fixed configuration. CI builds on Linux, byte for byte, what a contributor committed on macOS.

### An icon keeps its code point

A page that shows an icon by its code point, and a stylesheet that a browser has cached, must keep working after an icon is added or removed. So the code points are not derived from the order of the files. `codepoints.json` is the registry:

```json
{
  "icons": { "<name>": "f101" },
  "retired": ["f243"]
}
```

`allocate` in `codepoints.js` brings it up to date with the icons of `svgs/`. An icon that is in both keeps its code point and its place. The code point of an icon that is gone moves to `retired`, and no later icon gets it. A new icon gets the first code point, from `startCodepoint`, that no icon has or had. The registry is written by the build and committed; `init` removes it, so that the first icon of a new set gets the first code point.

`icons/<font>.json` is output only: the same code points, as numbers, for a consumer. It holds no retired entry, so that a consumer that walks the file meets icons only.

### One build, in any folders

`build()` takes the folders it writes to. The command `build` writes to the folders of the package. `--dry-run` and `verify` call `compareWithBuild`, which runs the same build into a temporary folder, without writing the registry, and compares. There is one build, and a check cannot differ from it.

### The package describes itself from the configuration

The files of `icons/` are named after the font, so the fields of `package.json` that point at them depend on the configuration. The `package` step writes `main`, `style`, `sass`, `files`, `exports` and `sideEffects`, and keeps an entry of `files` or `exports` that is not about `icons/` or `svgs/`. It writes `package.json` only when one of these fields changes, and then with an indentation of two spaces.

The README of the package is written from `templates/readme.hbs` for the same reason: its examples name the package, the font, the prefix and an icon of the set. The template names nothing else.

### Tools are called through their APIs

SVGO, svg-sprite, Fantasticon and clean-css are called as libraries, in one Node.js process. A whole build of the default set takes about two seconds. Replacing one of the tools is a task of its own, with a comparison of the output before and after.

## Configuration

`config.js` reads the `chassis.build` block of `package.json`. The settings and their defaults are in the [README](../README.md#configuration). `resolveConfig` refuses, with a message that names the setting: a block that is missing, a setting it does not know, a `name` or `prefix` that is not in kebab-case, a `frame` that is not a whole number above zero, a style that is named twice, a pair of fewer than two styles or of a style that `styles` does not list, a format other than `woff2`, `woff` and `ttf`, a `startCodepoint` outside the Private Use Area, and a `header` line that would end the comment.

`source` and `checks` are resolved from the folder of the package. The output folders are fixed: `svgs/`, `icons/` and `codepoints.json` beside `package.json`.

## Output contract

What the build writes for any set. A consumer may rely on everything in this section, and a change to it is a breaking change of the build.

### `svgs/<name>.svg`

One file per file of the source folder, with the same name. The root element has these attributes, in this order: `xmlns`, `width` and `height` of the frame, `fill="currentcolor"`, `class="<prefix>-<name>"`, and `viewBox="0 0 <frame> <frame>"`. Every other `fill` and every `clip-rule` attribute is removed, so the icon takes the color of the text around it. The file is indented by two spaces, keeps the path data as it was drawn, and ends without a line break.

### `icons/<font>.svg`

The sprite: one `<symbol>` per icon, in the order of the names, with `id="<name>"`, the class `<prefix>-<name>` and the `viewBox` of the frame. The path data of a symbol is rewritten in its shortest form, which is the one difference between the two forms of the SVGO configuration. The file has no XML declaration.

### `icons/<font>.woff2`, `.woff` and `.ttf`

The icon font, in each format of `formats`. Its family name is `<font>`, and each icon is the glyph of its code point in the Private Use Area.

### `icons/<font>.css` and `icons/<font>.min.css`

The stylesheet of the font, in this order:

1. A comment with the lines of `header`, which the minified file keeps.
2. An `@font-face` rule for the family `<font>`, with one `url()` per format in the order of `formats`. Each address is relative, `./<font>.<format>`, so the stylesheet loads the font from its own folder, and ends in `?<hash>`, the MD5 hash of the font, so that a browser asks for a changed font again.
3. Inside `@layer content`, the rule that sets the font on `::before` of every element whose class starts with `<prefix>-`.
4. One rule per icon, `.<prefix>-<name>::before { content: "\<code point>"; }`, outside the layer, in the order of the registry.

### `icons/<font>.scss`

The same stylesheet for Sass. `$<font>-font`, `$<font>-font-dir`, `$<font>-font-file`, `$<font>-font-hash` and `$<font>-font-src` are `!default` values, so a project that serves the font from another folder sets `$<font>-font-dir`. `$<font>-map` maps each name to its code point, and the classes are written from it.

### `icons/<font>.json`

One entry per icon, the name and its code point as a number, in the order of the registry.

### `codepoints.json`

The registry: `icons`, the code point of each icon as four hexadecimal digits, in the order the icons were added, and `retired`, ascending. It is committed and not published.

### `package.json` and `README.md`

`main` and `style` are `icons/<font>.css`, `sass` is `icons/<font>.scss`, and `files` is `icons/<font>.*` and `svgs/*.svg`, followed by the entries of the team. `exports` has `"."`, which is the SCSS under the condition `sass` and the CSS under `style` and `default`, then `"./icons/*"`, `"./svgs/*"` and `"./package.json"`, followed by the keys of the team. `sideEffects` is `*.css` and `*.scss`. The README is `templates/readme.hbs` with the values of the manifest and the configuration.

### `icons/preview.html`

The page that svg-sprite writes for the sprite. It is not a part of the contract: Git ignores it, `verify` and the tests skip it, and `files` leaves it out of the package.

## Contracts with the siblings

How the siblings take a set, found in their sources. A set that keeps the output contract is a drop-in for all four.

| Consumer           | What it reads                                                                                                                                                     | How a team points it at its own set                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Chassis CSS        | An SVG file by name: `svg-icon("<name>")` returns `url($icon-url-prefix + <name> + $icon-url-suffix)`, `/static/icons/svgs/` and `.svg` by default.               | `$icon-url-prefix`, or serve `svgs/` at that address             |
| Chassis React      | `<Icon name>`: the sprite symbol `#<name>` in the file of `sprite`, or with `font` the class `<fontPrefix><name>`. Its own icons are named by purpose in `icons`. | `IconProvider`: `sprite`, `fontPrefix`, `icons`                  |
| `@chassis-ui/docs` | `/static/icons/chassis-icons.css` and `/static/icons/chassis-icons.svg#<name>`, copied from the `icons/` folder of the installed package.                         | The `sprite` prop of `Icon`; otherwise the Chassis set           |
| Chassis Assets     | The two output folders as they are, copied to `source/<brand>/<app>/icons/icons/` and `svgs/`, then renamed per platform for the web, iOS and Android.            | A brand copies the output of its own build, under the same names |

The default set, `@chassis-ui/icons`, promises more than its shape, because its consumers name it:

- The package root holds `icons/` and `svgs/`, and `icons/` holds `chassis-icons.{css,min.css,scss,json,svg,woff,woff2}`.
- The class prefix is `cx-`, and the font family `chassis-icons`.
- The names of its icons. `@chassis-ui/docs` draws its own interface with some of them, Chassis React has others as its defaults, and the Figma libraries use the set by name. `chassis.checks.json` lists the names that the two packages read, and `verify` fails when one is missing.
- `release.yml` by that file name, which is the trusted publisher of the package on npmjs.com, and the check names `Lint`, `Type Check`, `Build` and `Site`, which the ruleset of `main` requires.
- The site at `chassis-ui.com/icons`, built by Vercel with `pnpm site:build` into `_site/`.

While the version is `0.x`, a change to one of these is a minor bump whose changeset starts with `**Breaking.**`.

## The site

`packages/site/` shows the set of the repository, and it names no set either. It reads the same two things as a consumer: the configuration and the output.

```text
packages/icons/package.json ──┐  chassis.build, and the name and the version of the package
packages/icons/icons/ ────────┤  the stylesheets, the sprite, the font, <font>.json
packages/icons/svgs/ ─────────┘  one file per icon
        │
        ▼
src/libs/set.ts          reads the set with config.js and names.js of the build
        │
        ├─▶ src/content.config.ts   the `icons` collection: one entry per file of svgs/, with
        │                           its SVG markup and its code point
        ├─▶ src/libs/astro.ts       `virtual:icon-set`: the font name, the prefix, the frame,
        │                           the package and the addresses of the set
        └─▶ public/icons/static/set/   the two folders, as the package holds them
```

A page of an icon is an entry of the collection, so the site has a page for each icon of the output and no file per icon. A page or a component reads the set from `virtual:icon-set`, since it is bundled and cannot read the files itself, and draws an icon of the set with `SetIcon.astro`. `exampleIcon` of `config.yml` names the icon of the examples, the first icon of the set when it is left out, and the site does not build with a name that the set does not have.

The interface of the site is drawn by `@chassis-ui/docs` with the Chassis set, as on every Chassis site: `/static/icons/` holds `icons/` of the installed `@chassis-ui/icons`. The package of the workspace has the same name, so the site asks for the published one with an npm alias. The set of the repository is served from a path of its own, `/icons/static/set/`, under the path that chassis-ui.com routes to this site. For the default set the two are versions of one set, and for the set of an adopter they are two sets.

The documentation pages are the MDX files of `content/docs/`, in the `docs` collection of every Chassis site, under `/icons/docs/`.

## Checks

Each check has a command, and CI runs all of them.

| Command                   | Checks                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm icons:lint:source`  | `source/`: only SVG files, kebab-case names that end in a style, the frame, one color, no stroke, no raster, gradient, pattern or script, the pairs  |
| `pnpm icons:verify`       | A fresh build equals the committed output; no icon moved from the code point it had at the last tag; no two icons share one; the contract icons      |
| `pnpm icons:test`         | Vitest, on the fixture: the golden output, the steps, the code points, the configuration, the manifest, what npm packs, the journey of an adopter    |
| `pnpm icons:lint:package` | publint on what npm would publish                                                                                                                    |
| `pnpm icons:lint`         | ESLint on `build/`, `test/` and the root `build/`, with no warning allowed                                                                           |
| `pnpm icons:typecheck`    | TypeScript `checkJs` on `build/`                                                                                                                     |
| `pnpm changeset:check`    | The commits since a base come with a changeset when they change `source/`, `build/`, `icons/` or `svgs/`                                             |
| `pnpm site:test`          | Vitest, on a copy of the repository: the site of the default set and of the fixture, the icons that each page draws, and the links between the pages |
| `pnpm icons:test:golden`  | Not a check: writes `test/golden/` again from a build of the fixture                                                                                 |

`verify` reads the code points of the last tag from `icons/<font>.json` at that tag. A repository without a tag, or a tag without that file, is reported as a note and not as a problem. [`test/README.md`](../packages/icons/test/README.md) describes the tests, the fixture and the golden output.

## Releases

A version is made on `develop` with Changesets and released by a push of its commit to `main`. `release.yml` reads the package from `package.json`, publishes it to npm unless it is private or npm has the version, and creates the GitHub release with the archive `<font>-<version>.zip` unless the tag exists. The steps, the prerelease mode and what the workflow reads are in [CONTRIBUTING.md](../.github/CONTRIBUTING.md#releases).

## Known oddities

Kept on purpose, or until a phase of the roadmap removes them. Do not fix one without a changeset that says what breaks.

- **Two forms of one icon.** A file of `svgs/` keeps the path data as it was drawn, and a symbol of the sprite has it in its shortest form. A file is read and edited by people; the sprite is downloaded.
- **The classes of the icons are outside the layer.** The rule that sets the font is inside `@layer content`, and the rules that set the `content` of each icon are not.
- **Two files of code points.** `codepoints.json` has hexadecimal digits and the retired code points, and `icons/<font>.json` has numbers and the icons only. The first is the record that the build keeps, the second is output.
- **The registry is in the order of arrival.** The classes of the stylesheets and the entries of `icons/<font>.json` follow the registry, so an icon that was added later is after the others, and not in its place in the alphabet. The sprite and `svgs/` are in the order of the names.
- **A class on every SVG file.** The root of `svgs/<name>.svg` and each symbol of the sprite carry `class="<prefix>-<name>"`, which is also the class that draws the icon with the font.
- **The sprite declares `xmlns:xlink`**, which no symbol uses. svg-sprite writes it.
- **The files of `svgs/` end without a line break**, and Prettier leaves the output alone.
- **`clip-rule` is removed with `fill`.** A drawing that needs `clip-rule` to look right has to be redrawn without it.
- **`main` is a stylesheet.** `main`, `style` and `sass` are kept beside `exports` for tools that read them. Node.js cannot import the package, and nothing in it is JavaScript.
- **The package importer of Sass refuses the path without an extension.** `icons/` holds a `.css` and a `.scss` of the font name, so `pkg:<package>/icons/<font>` is ambiguous. `pkg:<package>` and the path with `.scss` are not.
- **The default set starts with two retired code points.** `f243` and `f245` were the code points of two duplicates that 0.4.0 removes.
- **The site of the default set loads its font twice.** The interface loads the stylesheet of the installed package, and the pages of the set load the one of the repository. Both name the family and the classes of one set, and the second wins.
- **The categories and the tags of an icon page are derived.** The category is the first word of the name, and the tags are `icon`, the style and `svg`, until the set has curated metadata.
- **The test of the site copies the repository into `.cache/`.** Astro reads a file of a linked package by its path only when that path and the site have a folder in common, which the temporary folder of a machine does not have with the repository.

## History

The build was a set of scripts around SVGO, svg-sprite and Fantasticon, each with the font name and the prefix written in it, and the icons were optimized in place. In October 2026 it was rewritten in the phases of [ref/ROADMAP.md](../ref/ROADMAP.md), which holds the findings that started it, the principles, the decisions and a log of every session: the workspace layout with `source/` at the root, the configured command line with its tests, and the manifest and the release that name no package. The output of the default set did not change by a byte through the rewrite, but for the two duplicates that were removed and the hash of the font in the SCSS.
