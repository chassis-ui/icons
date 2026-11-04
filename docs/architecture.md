# Chassis Icons architecture

How the build of an icon set works, why it is built this way, and what it promises to write. It is for contributors who change the builder in `packages/icons/lib/` or the files that `init` writes from `packages/icons/templates/`, and for a team that wants to know what the command does in its repository. How to set up the repository, run the checks and open a pull request is in [CONTRIBUTING.md](../.github/CONTRIBUTING.md).

`lib/`, `templates/` and `test/` below are relative to `packages/icons/`. `source/`, `dist/`, `preview/`, `codepoints.json`, `README.md` and the `package.json` with the `chassis.build` block are those of a repository of icons: the folder that the `chassis-icons` command runs on, which this repository is not. The Chassis set is such a repository, `chassis-ui/website-icons`, and the submodule `vendor/icons` of this checkout. `<font>` is `name` of the configuration, `<prefix>` its `prefix`, and `<name>` the name of an icon.

## The build in one picture

The command runs on one repository of icons, and reads three things of it.

```text
package.json ──────────┐  chassis.build: name, prefix, frame, styles, pairs, formats, header
source/<name>.svg ─────┤  only read, never written
codepoints.json ───────┘  the code points the set has given out, and the retired ones
        │
        ▼
root.js              finds the repository: --cwd <dir>, or the nearest folder upward from the
                     working directory whose package.json has a chassis block
config.js            reads and checks the configuration; the only module that knows a set
        │
        ▼ step svgs
optimize.js          SVGO: one file per icon, with the root attributes of the set
                     → dist/svgs/<name>.svg, and removes a file whose source is gone
        │
        ▼ step sprite                          (reads dist/svgs/)
sprite.js            svg-sprite: one <symbol> per file
                     → dist/web/<font>.svg
        │
        ▼ step font                            (reads dist/svgs/ and codepoints.json)
codepoints.js        keeps, gives and retires code points → codepoints.json
font.js              Fantasticon: the font in each format; Handlebars: the stylesheets;
                     clean-css: the minified CSS
                     → dist/web/<font>.{woff2,woff,ttf}, .css, .min.css, .scss, .json
set-index.js         the index of the set: the settings and every icon with its code point
                     → dist/icons.json
        │
        ▼ step ios                             (when targets names it; reads dist/svgs/)
ios.js               an asset catalog of template vector images, and a Swift enum
                     → dist/ios/<Module>.xcassets/, dist/ios/<Module>.swift
        │
        ▼ step android                         (when targets names it; reads dist/svgs/)
android.js           svg2vectordrawable: one vector drawable per icon
                     → dist/android/res/drawable/<prefix>_<name>.xml
        │
        ▼ step package
manifest.js          the fields of package.json that name the files, and the README
                     → package.json, README.md
```

The page of the set is not a step of the build. `chassis-icons preview` writes it from the output, and `archive` writes it into the archive of a release:

```text
dist/icons.json ───────┐
dist/web/ ─────────────┤
dist/svgs/ ────────────┘
        │
        ▼
preview.js           Handlebars: index.html, every icon with its name; its stylesheet and its
                     script; a copy of dist/web/ and dist/svgs/ beside them
                     → preview/, or preview/ of the archive; --serve serves it over HTTP
```

`chassis-icons build --dry-run` runs the whole build into a temporary folder and lists the files of the repository that it would change. Here, `pnpm icons --dry-run` does that on `vendor/icons`, with the build of this checkout.

## The modules

Each module of `lib/` does one thing, and takes what it needs as arguments.

| Module             | What it does                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `cli.js`           | The command line: `build`, `verify`, `lint-source`, `preview`, `archive`, `release-notes`, `init`              |
| `root.js`          | The repository of a run, from `--cwd` or found upward from the working directory, and the version of the build |
| `config.js`        | Reads `chassis.build`, fills in the defaults, refuses a setting it does not know, and resolves the folders     |
| `names.js`         | Lists the icons of a folder in a fixed order, and splits a name into what it shows and its style               |
| `optimize.js`      | The one SVGO configuration, in two forms: a file of `dist/svgs/`, and a symbol of the sprite                   |
| `sprite.js`        | Builds the sprite with svg-sprite                                                                              |
| `codepoints.js`    | The registry: reads it, brings it up to date with the icons of the set, and checks it                          |
| `font.js`          | Draws the font with Fantasticon, renders the stylesheets from the templates, minifies the CSS                  |
| `set-index.js`     | The index of the set, `dist/icons.json`, and its text: one line per icon                                       |
| `ios.js`           | The `ios` target: the asset catalog, and the Swift file and its names                                          |
| `android.js`       | The `android` target: the vector drawables, with svg2vectordrawable                                            |
| `preview.js`       | Writes the page of the set into a folder from the output and its templates, and serves a folder over HTTP      |
| `manifest.js`      | The fields of `package.json` that follow from the configuration, and the README of the package                 |
| `build.js`         | Runs the steps, in the folders of the repository or in any others; `compareWithBuild`                          |
| `lint-source.js`   | Checks whether each file of the source folder can be an icon of the set                                        |
| `verify.js`        | Builds twice, compares the committed files that the build writes, the code points and the contracts            |
| `archive.js`       | Writes `<font>-<target>-<version>.zip` of the web, with the page, and of each target, for a release            |
| `release-notes.js` | The entry of a version in `CHANGELOG.md`, without its heading, for the body of a release                       |
| `init.js`          | Writes the files of a new repository of icons from `templates/`, and checks a repository against them          |
| `logger.js`        | The one logger. A module never writes to the console itself                                                    |
| `lib/templates/`   | `css.hbs` and `scss.hbs`, the stylesheets, `readme.hbs`, the README, and `preview/`, the page of the set       |

`templates/` of the package holds what `init` writes into a repository: `AGENTS.md`, `CHANGELOG.md`, `CLAUDE.md`, `gitignore` and the workflows `workflows/ci.yml` and `workflows/release.yml`. `init` fills in the name of the package, the font, the prefix and the package manager, and writes `package.json`, `.gitignore` and `.nvmrc` from values of its own.

The scripts of the root `build/` belong to this repository and not to the build of a set: `check-changeset.js` asks for a changeset, `sync-version-refs.js` copies the version of the builder into the files that show it, and `release-notes.js` prints the changelog entry of the builder with the module of the same name.

## Design decisions

### The package is the builder, and ships no icons

`@chassis-ui/icons` is the `chassis-icons` command: `lib/`, `templates/`, its README and its changelog, and nothing else, which `manifest.test.js` holds it to. A set is a repository of icons that installs the builder as a development dependency and runs it with the scripts that `init` wrote, as a repository of tokens installs `chassis-ui/tokens`. The Chassis set is one of them, `chassis-ui/website-icons`, and this repository builds it as the submodule `vendor/icons`, so that a change to the build meets a real set before it is released: `pnpm icons:verify` builds `vendor/icons` with the build of this checkout, and the site shows it.

Every command but `init` works on one repository: `resolveRoot` in `root.js` takes `--cwd <dir>` as it is, or the nearest folder upward from the working directory whose `package.json` has a `chassis` block. The root of this workspace has none, so its `icons:*` scripts name `vendor/icons` with `--cwd`.

### The build names no set

A team that adopts the builder changes `source/` and the configuration of its repository, never the build. So no module of `lib/`, no file of `templates/`, no test, no workflow and no script of the root names a font, a prefix, an icon or a package but the builder's own. `config.js` is the only module that reads `package.json` for the settings, and every other module takes a `Config`. What a consumer of one set relies on, such as the names of the icons that the Chassis sites read, is data in the `chassis.checks.json` of that set.

The tests hold the build to this. They build the fixture, the set of another team with another font name, prefix, frame, styles and formats, and the journey test writes a repository with `init`, builds the fixture in it and compares the output with the golden output.

### init writes a repository once

`init` writes the files of a repository and then leaves them to the team. `package.json`, with the `chassis.build` block, the scripts and the dependency on the builder, and `CHANGELOG.md` hold the data of the repository: they are never written over, not with `--force`. The other files come from `templates/` with the few values that differ by repository filled in. The README is not among them, since the build writes it, and neither is `source/`: the team saves its SVG files there.

A file that `init` wrote is the repository's from then on, and a newer version of the builder changes nothing in it on install. `init --check` reports where a repository differs from what this version writes, and the scripts that its `package.json` lacks, with the exit code 1; `init --only <file…> --force` writes those files again. So taking a newer build is a bump of `@chassis-ui/icons` in `devDependencies`, an install, `build --dry-run` and the page of the set to see what changes, a build and `verify`, and `init --check` says whether the workflows or the instructions changed too.

### The source is only read

The build reads `source/` and writes everything else. Before the workspace layout, the build optimized the SVG files in place and removed their colors, so a failed run or a file in two colors changed the only copy of the artwork. With a source folder of its own, the output is a function of the source and the configuration, and `verify` can compare the two.

### The output is in `dist/`, by target

The output of a repository of icons is one folder, `dist/`, as the output of `chassis-ui/tokens` and `chassis-ui/assets` is. What every target of the build reads is at its top: `svgs/`, the optimized files, and `icons.json`, the index. Each target has a folder of its own: `web/` holds the font, its stylesheets, its glyph map and the sprite, `ios/` the asset catalog and the Swift file, and `android/` the vector drawables. The web is always built; `targets` of `chassis.build` names the others. A later target, for a platform or a framework, is a folder beside them and an archive of its own, and changes no path of the others. The registry is not in `dist/`: it is the state of the build, which the build reads as well as writes, and it is not published.

Before `dist/`, the output was `icons/` and `svgs/` at the root of the repository. The Chassis set moved to `dist/` before its first release, when no project read it from `@chassis-ui/website-icons` yet.

### The output is not committed, and the release builds it

A repository of icons commits `source/`, `codepoints.json`, `README.md`, `package.json` with the fields that the build writes, and its lockfile, and not `dist/`, as `chassis-ui/assets` does not commit its `dist/`. `dist/` is a function of the source, the registry and the version of the builder that the lockfile pins, so a committed copy holds nothing of its own. It cost merge conflicts that only a build resolves, since two branches that each add an icon both write the font, the sprite and the stylesheets, and a history that grows by the font files at every change. The release workflow builds `dist/`, publishes its files for the web to npm and attaches an archive per target, so what is released is built from source in one place. This repository builds `vendor/icons` in `pnpm vendor`, before the site reads it.

`verify` builds into a temporary folder and fails when a committed file that the build writes, the registry, the README or a field of `package.json`, is not what the source builds, so a commit cannot hold a registry that its source does not give. It builds a second time and fails when a file of `dist/` differs between the two, since a release has to be the same build wherever it runs. The names are sorted by code unit and not by locale, and SVGO, svg-sprite and Fantasticon get a fixed configuration, so a build on Linux writes, byte for byte, what one on macOS writes.

Until the targets for apps, the output was committed and `verify` compared it with a fresh build.

### An icon keeps its code point

A page that shows an icon by its code point, and a stylesheet that a browser has cached, must keep working after an icon is added or removed. So the code points are not derived from the order of the files. `codepoints.json` is the registry:

```json
{
  "icons": { "<name>": "f101" },
  "retired": ["f243"]
}
```

`allocate` in `codepoints.js` brings it up to date with the icons of `dist/svgs/`. An icon that is in both keeps its code point and its place. The code point of an icon that is gone moves to `retired`, and no later icon gets it. A new icon gets the first code point, from `startCodepoint`, that no icon has or had. The registry is written by the build and committed. A repository that `init` writes has none: the first build writes it, and the first icon of the set gets `startCodepoint`.

`dist/web/<font>.json` and `dist/icons.json` are output only: the same code points, as numbers in the glyph map of the font and as hexadecimal digits in the index, for a consumer. They hold no retired entry, so that a consumer that walks a file meets icons only.

### The index holds no version

`dist/icons.json` is what a reader of the set needs beyond the files: the font name, the prefix, the frame, the styles and the pairs, and each icon with its code point, its style and its name without the style. The page of the set and the site read it, and a later target reads it in place of the configuration. It holds neither the version of the package nor that of the build, so that a release, or a newer build that writes the same files, changes no file of the output. The lockfile of the repository says which build wrote a commit.

### The page of a set is written from the output

The page of a set, `preview/`, is a folder for a browser and not a file of the package: an `index.html`, its stylesheet and its script from `lib/templates/preview/`, and a copy of `dist/web/` and `dist/svgs/`, which it links by name. `chassis-icons preview` writes it from `dist/`, so it is not committed, not published and not compared by `verify`, and `archive` writes it into the archive of a release. A team browses its set with `preview --serve`, and a project that has the archive opens `preview/index.html`.

### One build, in any folders

`build()` takes the folders it writes to. The command `build` writes to the folders of the repository. `--dry-run` and `verify` call `compareWithBuild`, which runs the same build into a temporary folder, without writing the registry, and compares: `--dry-run` everything that a build would change in the working copy, `dist/` too, and `verify` the committed files only. There is one build, and a check cannot differ from it.

### The package describes itself from the configuration

The files of `dist/web/` are named after the font, so the fields of `package.json` that point at them depend on the configuration. The `package` step writes `main`, `style`, `sass`, `files`, `exports` and `sideEffects`, and keeps an entry of `files` or `exports` that is not about `dist/`, such as the `CHANGELOG.md` that `init` lists. An entry about `icons/` or `svgs/`, where the output was before `dist/`, goes too. It writes `package.json` only when one of these fields changes, and then with an indentation of two spaces.

The README of the package is written from `lib/templates/readme.hbs` for the same reason: its examples name the package, the font, the prefix and an icon of the set. Its last section says that the package is built with `@chassis-ui/icons`, and names the commands of the repository when `package.json` has the scripts `build`, `lint` and `verify` that `init` writes, and `preview` when it has that script too. The template names nothing else, and neither do the templates of the page of the set: they take the font name, the prefix, the frame, the styles and the icons with their code points from the index.

### The platforms are built from the files of the web

The `ios` and `android` targets start from `dist/svgs/`, the files that the web draws, so an icon looks the same on the three. An image set holds the SVG file as it is and renders as a template, and a vector drawable fills its paths black: in both, the tint of a view gives the color, as the color of the text does to `currentcolor`. An image set and a drawable are named after the icon and its class, so `bell-outline` is the image `bell-outline`, the case `bellOutline` of `<Prefix>Icon` and `R.drawable.<prefix>_bell_outline`. The conversion to a drawable is the one of `chassis-ui/tokens` for its icons, svg2vectordrawable with the same options. `chassis-ui/assets` builds icons for iOS and Android too, for the icons of an app that are in no set.

An app takes the files of its platform from the archive of a release, not from npm, which holds the files for the web only. There is no Swift package: Swift Package Manager reads its files from the Git tag, and `dist/` is not committed. The Swift file finds the catalog in the bundle of the target that it is added to, and in `Bundle.module` when it is built in a Swift package, so a Swift package of `dist/ios/` at a release tag needs no other file. The native tools are not in CI: `test/native/check.sh` compiles the output with actool, swiftc and aapt2 on a machine that has Xcode and the Android SDK.

### Tools are called through their APIs

SVGO, svg-sprite, Fantasticon, clean-css and svg2vectordrawable are called as libraries, in one Node.js process. A whole build of the Chassis set takes about two seconds. Replacing one of the tools is a task of its own, with a comparison of the output before and after.

## Configuration

`config.js` reads the `chassis.build` block of the `package.json` of the repository. The settings and their defaults are in the [README of the package](../packages/icons/README.md#configuration). `resolveConfig` refuses, with a message that names the setting: a block that is missing, a setting it does not know, a `name` or `prefix` that is not in kebab-case, a `frame` that is not a whole number above zero, a style that is named twice, a pair of fewer than two styles or of a style that `styles` does not list, a format other than `woff2`, `woff` and `ttf`, a `startCodepoint` outside the Private Use Area, a `header` line that would end the comment, and a target other than `ios` and `android`, or one named twice. The `ios` step refuses two icons whose names give one Swift case, such as `arrow-2` and `arrow2`.

`source` and `checks` are resolved from the folder of `package.json`, which is the root of the repository: `source/` and `chassis.checks.json` beside it by default, which is what `init` leaves them at. The output is fixed: `dist/` and `codepoints.json` beside `package.json`, and the page of the set in `preview/`.

## Output contract

What the build writes for any set. A consumer may rely on everything in this section, and a change to it is a breaking change of the build. Every file of the output is in `dist/`, which is not committed: the release builds it, publishes `icons.json`, `svgs/` and `web/` to npm, and attaches the archives. The registry, the manifest and the README are beside it, and are committed.

### `dist/svgs/<name>.svg`

One file per file of the source folder, with the same name. The root element has these attributes, in this order: `xmlns`, `width` and `height` of the frame, `fill="currentcolor"`, `class="<prefix>-<name>"`, and `viewBox="0 0 <frame> <frame>"`. Every other `fill` and every `clip-rule` attribute is removed, so the icon takes the color of the text around it. The file is indented by two spaces, keeps the path data as it was drawn, and ends without a line break.

### `dist/web/<font>.svg`

The sprite: one `<symbol>` per icon, in the order of the names, with `id="<name>"`, the class `<prefix>-<name>` and the `viewBox` of the frame. The path data of a symbol is rewritten in its shortest form, which is the one difference between the two forms of the SVGO configuration. The file has no XML declaration.

### `dist/web/<font>.woff2`, `.woff` and `.ttf`

The icon font, in each format of `formats`. Its family name is `<font>`, and each icon is the glyph of its code point in the Private Use Area.

### `dist/web/<font>.css` and `dist/web/<font>.min.css`

The stylesheet of the font, in this order:

1. A comment with the lines of `header`, which the minified file keeps.
2. An `@font-face` rule for the family `<font>`, with one `url()` per format in the order of `formats`. Each address is relative, `./<font>.<format>`, so the stylesheet loads the font from its own folder, and ends in `?<hash>`, the MD5 hash of the font, so that a browser asks for a changed font again.
3. Inside `@layer content`, the rule that sets the font on `::before` of every element whose class starts with `<prefix>-`.
4. One rule per icon, `.<prefix>-<name>::before { content: "\<code point>"; }`, outside the layer, in the order of the registry.

### `dist/web/<font>.scss`

The same stylesheet for Sass. `$<font>-font`, `$<font>-font-dir`, `$<font>-font-file`, `$<font>-font-hash` and `$<font>-font-src` are `!default` values, so a project that serves the font from another folder sets `$<font>-font-dir`. `$<font>-map` maps each name to its code point, and the classes are written from it.

### `dist/web/<font>.json`

The glyph map of the font: one entry per icon, the name and its code point as a number, in the order of the registry.

### `dist/icons.json`

The index of the set, written by the `font` step with the code points of the registry: `name`, `prefix`, `frame`, `styles` and `pairs` of the configuration, and `icons`, one entry per icon in the order of the names, with `name`, `codepoint` as four hexadecimal digits, and `base` and `style` when the set has styles: the name without its style, and the style. The settings are indented by two spaces, and each icon is one line. It holds no version.

### The page of the set

Not output: `chassis-icons preview` writes it into `preview/` of the repository, and `archive` into `preview/` of the archive, from `dist/`. The folder holds `index.html`, `preview.css` and `preview.js`, a copy of every file of `dist/web/`, and `svgs/<name>.svg`. `index.html` is drawn with Chassis CSS: it links `<font>.css` and the files of the page beside it, and the stylesheet and the script bundle of `@chassis-ui/css` from jsDelivr, at the version and with the SRI hashes of `CHASSIS` in `lib/preview.js`. It lists every icon with its name, in the order of the names, and its script reads the sprite `<font>.svg` beside it into the page, hidden, so that the icons are drawn from its symbols. From the file system, where a browser does not read the sprite, it draws the icons with the font instead and says so. The header has a search that keeps the icons whose name holds every word typed, a filter of the styles when the set has styles, and a switch of the theme. A click on an icon opens a Chassis drawer with the icon at size, its style, class and code point, the examples of the icon page of the site in Chassis components (headings, text, a link, buttons, icon buttons, a button group, an input group and a notification), a link to its SVG file in `svgs/`, and the code of the sprite symbol, the font class and the embedded SVG, highlighted and with a copy button, and the code point for CSS, JavaScript and HTML. It puts the name in the address as `#<name>`, which opens the drawer when the page loads with it or the address changes to it. Without the network, the page keeps its icons, its search and a plain drawer, without the styles of Chassis.

The elements of the page have ids that start with `page_`, which no icon name can, since a name is in kebab-case: the symbols of the sprite keep the name of their icon as their id.

The page carries the icons as JSON, in `<script id="page_set" type="application/json">`: `name`, `prefix`, `frame` and `styles` of the index, and `icons`, one entry per icon with `name`, `codepoint` as four hexadecimal digits, and `style` when the set has styles. `preview --serve` serves the folder at `http://localhost:4325/`, or the port of `--port`.

### `dist/ios/`

With the `ios` target. `<Module>` is the font name in PascalCase, and `<Prefix>` the prefix in PascalCase.

- `<Module>.xcassets/`: a `Contents.json`, and one image set per icon, `<name>.imageset/`, with `<name>.svg`, the file of `dist/svgs/`, and a `Contents.json` whose properties are `"preserves-vector-representation": true` and `"template-rendering-intent": "template"`. A catalog needs iOS 13 for an SVG file.
- `<Module>.swift`: `public enum <Prefix>Icon: String, CaseIterable, Sendable`, one case per icon in the order of the names, its name in camelCase, between backticks when it is a word of Swift, and its raw value the name of the icon; `UIImage(_ icon:)` and SwiftUI `Image(_ icon:)`, which draw the icon from the catalog; and a private class that finds the bundle. It type-checks in the Swift 5 and the Swift 6 language mode.

### `dist/android/res/drawable/<prefix>_<name>.xml`

With the `android` target. One vector drawable per icon, from svg2vectordrawable with `fillBlack` and three decimals: `android:width` and `android:height` of the frame in `dp`, the viewport of the frame, and each path filled `#FF000000`. The name is the class of the icon with `_` for `-`, which a resource name needs. The file ends with a line break.

### `codepoints.json`

The registry, at the root of the repository: `icons`, the code point of each icon as four hexadecimal digits, in the order the icons were added, and `retired`, ascending. It is committed and not published.

### `package.json` and `README.md`

`main` and `style` are `dist/web/<font>.css`, `sass` is `dist/web/<font>.scss`, and `files` is `dist/icons.json`, `dist/svgs` and `dist/web`, the files for the web, followed by the entries of the team. npm packs them although `.gitignore` names `dist/`, since `files` comes first. `exports` has `"."`, which is the SCSS under the condition `sass` and the CSS under `style` and `default`, then `"./dist/*"` and `"./package.json"`, followed by the keys of the team. `sideEffects` is `*.css` and `*.scss`.

The README, at the root of the repository, is `lib/templates/readme.hbs` with the values of the manifest and the configuration: what the package holds, the four ways to use an icon, and the source. The section of the source says that the package is built from the files of the repository with `@chassis-ui/icons`, and, when `package.json` has the scripts `build`, `lint` and `verify` that `init` writes, names them as the commands of the repository, with `preview` when it has that script too: with `pnpm` when a `pnpm-lock.yaml` is beside `package.json`, and with `npm run` otherwise.

## Contracts with the siblings

How the siblings take a set, found in their sources. A set that keeps the output contract is a drop-in for all four.

| Consumer           | What it reads                                                                                                                                                     | How a team points it at its own set                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Chassis CSS        | An SVG file by name: `svg-icon("<name>")` returns `url($icon-url-prefix + <name> + $icon-url-suffix)`, `/static/icons/svgs/` and `.svg` by default.               | `$icon-url-prefix`, or serve `dist/svgs/` at that address |
| Chassis React      | `<Icon name>`: the sprite symbol `#<name>` in the file of `sprite`, or with `font` the class `<fontPrefix><name>`. Its own icons are named by purpose in `icons`. | `IconProvider`: `sprite`, `fontPrefix`, `icons`           |
| `@chassis-ui/docs` | `/static/icons/chassis-icons.css` and `/static/icons/chassis-icons.svg#<name>`, copied from the `icons/` folder of the installed `@chassis-ui/icons`.             | The `sprite` prop of `Icon`; otherwise the Chassis set    |
| Chassis Assets     | Icons of an app that are in no set, renamed per platform for the web, iOS and Android. The icons of a set reach an app from its `ios` and `android` targets.      | Nothing: a set is not copied there                        |

The Chassis set, `@chassis-ui/website-icons`, promises more than its shape, because its consumers name it. They move to it from `@chassis-ui/icons`, which held the set before it became the builder, and find the files in `dist/`, where `icons/` became `dist/web/` and `svgs/` became `dist/svgs/`:

- `dist/` holds `icons.json`, `svgs/`, `web/`, `ios/` and `android/`, and `web/` holds `chassis-icons.{css,min.css,scss,json,svg,woff,woff2}`.
- For apps, the catalog `ChassisIcons.xcassets` with the enum `CxIcon`, and the drawables `cx_<name>`.
- The class prefix is `cx-`, and the font family `chassis-icons`.
- The names of its icons. `@chassis-ui/docs` draws its own interface with some of them, Chassis React has others as its defaults, and the Figma libraries use the set by name. The `chassis.checks.json` of its repository lists the names that the two packages read, and `verify` fails when one is missing.

A change to one of these is made in `chassis-ui/website-icons`, whose changelog names the icons that are added, renamed or removed. This repository promises `release.yml` by that file name, which is the trusted publisher of `@chassis-ui/icons` on npmjs.com, the check names `Lint`, `Type Check`, `Build` and `Site`, which the ruleset of `main` requires, and the site at `chassis-ui.com/icons`, built by Vercel with `pnpm site:build` into `_site/`. While the version of the builder is `0.x`, a change to the output contract is a minor bump whose changeset starts with `**Breaking.**`.

## The site

`packages/site/` shows the set of `vendor/icons`, and it names no set either. It reads the same two things as a consumer: the configuration and the output.

```text
vendor/icons/package.json ───────┐  chassis.build, and the name and the version of the package
vendor/icons/dist/icons.json ────┤  the index: each icon with its code point and its style
vendor/icons/dist/web/ ──────────┤  the stylesheets, the sprite, the font
vendor/icons/dist/svgs/ ─────────┘  one file per icon
        │
        ▼
src/libs/set.ts          reads the set with config.js, names.js and set-index.js of the build
        │
        ├─▶ src/content.config.ts   the `icons` collection: one entry per icon of the index,
        │                           with its SVG markup and its code point
        ├─▶ src/libs/astro.ts       `virtual:icon-set`: the font name, the prefix, the frame,
        │                           the package and the addresses of the set
        └─▶ public/icons/static/set/   web/ and svgs/, as dist/ holds them
```

`getSetDir` in `src/libs/set.ts` is the one place that names `vendor/icons`, from the root of the site, and `pnpm vendor` checks the submodule out before the site builds. A page of an icon is an entry of the collection, so the site has a page for each icon of the output and no file per icon. A page or a component reads the set from `virtual:icon-set`, since it is bundled and cannot read the files itself, and draws an icon of the set with `SetIcon.astro`. `exampleIcon` of `config.yml` names the icon of the examples, the first icon of the set when it is left out, and the site does not build with a name that the set does not have.

The interface of the site is drawn by `@chassis-ui/docs` with the Chassis set, as on every Chassis site: `/static/icons/` holds `icons/` of the installed `@chassis-ui/icons`. The package of the workspace has the same name, so the site asks for the published one with an npm alias, a version that still held the set, until the Chassis sites move to `@chassis-ui/website-icons`. The set of the repository is served from a path of its own, `/icons/static/set/`, under the path that chassis-ui.com routes to this site. For the Chassis set the two are versions of one set, and for the fixture that `pnpm site:test` builds they are two sets.

The documentation pages are the MDX files of `content/docs/`, in the `docs` collection of every Chassis site, under `/icons/docs/`.

## Checks

Each check has a command, and CI runs all of them. The `icons:*` scripts that run the command do so with the build of this checkout, on `vendor/icons`.

| Command                       | Checks                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm icons:lint:source`      | `vendor/icons/source/`: only SVG files, kebab-case names that end in a style, the frame, one color, no stroke, no raster, gradient, pattern or script, the pairs                                                                                                                                                                                             |
| `pnpm icons:verify`           | Two builds of `vendor/icons` give the same files, and its committed registry, README and manifest are what it builds; no icon moved from the code point it had at the last tag of that repository; no two icons share one; the contract icons                                                                                                                |
| `pnpm icons:test`             | Vitest, on the fixture, which has the `ios` and `android` targets: the golden output, the steps, the code points, the configuration, the targets, the page of the set and its server, the manifest, what npm packs of a set and of the builder, the archive, the release notes, `init`, the journey of a team, the command line, and the scripts of the root |
| `pnpm icons:lint:package`     | publint on what npm would publish of the builder                                                                                                                                                                                                                                                                                                             |
| `pnpm icons:lint`             | ESLint on `lib/`, `test/` and the root `build/`, with no warning allowed                                                                                                                                                                                                                                                                                     |
| `pnpm icons:typecheck`        | TypeScript `checkJs` on `lib/`                                                                                                                                                                                                                                                                                                                               |
| `pnpm changeset:check <base>` | The commits since a base come with a changeset when they change `lib/` or `templates/`; the commit of a version passes                                                                                                                                                                                                                                       |
| `pnpm site:test`              | Vitest, on a copy of the build, the site and `vendor/icons`: the site of the Chassis set and of the fixture, the icons that each page draws, and the links between the pages                                                                                                                                                                                 |
| `pnpm icons:test:golden`      | Not a check: writes `test/golden/` again from a build of the fixture                                                                                                                                                                                                                                                                                         |
| `pnpm icons:archive`          | Not a check: writes the archive of `vendor/icons` into `.cache/archives/`, which Git ignores                                                                                                                                                                                                                                                                 |
| `pnpm icons:native`           | Not in CI: compiles `dist/ios/` and `dist/android/` of `vendor/icons` with actool, swiftc, xcodebuild and aapt2. Needs Xcode and the Android SDK, in `ANDROID_HOME`                                                                                                                                                                                          |
| `pnpm icons:preview`          | Not a check: writes the page of `vendor/icons` into its `preview/`, which its Git ignores, and serves it                                                                                                                                                                                                                                                     |

`verify` reads the code points of the last tag from `codepoints.json` at that tag, in the repository of the set, or from the glyph map of the font, `dist/web/<font>.json` or `icons/<font>.json`, at a tag that has no registry. A repository without a tag, or a tag without any of them, is reported as a note and not as a problem. [`test/README.md`](../packages/icons/test/README.md) describes the tests, the fixture and the golden output.

## Releases

The builder is versioned on `develop` with Changesets: a change to `lib/` or `templates/` comes with a changeset, and `pnpm changeset:version` bumps `packages/icons/package.json`, writes its `CHANGELOG.md` and copies the version to the badge of `README.md` and to `currentVersion` of `packages/site/config.yml`. A push of the commit to `main` releases it. `release.yml` reads the name and the version from `packages/icons/package.json`, stops unless `Lint`, `Type Check`, `Build` and `Site` passed on the commit, publishes the package to npm with trusted publishing unless npm has the version, and creates the tag `v<version>` and the GitHub release whose body is the entry of the version in `CHANGELOG.md`, which `build/release-notes.js` prints and fails without. The release is the package, its tag and its notes, and no archive: the archive of a set is released by its repository.

A repository of icons releases with the workflow that `init` wrote. A push to its `main` with a new version in `package.json` lints the source, verifies the set, builds `dist/`, writes `<font>-web-<version>.zip` with `archive`, which holds the files for the web and the page of the set, and `<font>-<target>-<version>.zip` of each target, publishes the package to npm unless it is private or npm has the version, and creates the tag and the GitHub release with the archives attached, from the entry of the version in its `CHANGELOG.md`. The Chassis set reaches this repository when the pointer of `vendor/icons` moves to that release. The steps, the prerelease mode and what each workflow reads are in [CONTRIBUTING.md](../.github/CONTRIBUTING.md#releases).

## Known oddities

Kept on purpose, or until a phase of the roadmap removes them. Do not fix one without a changeset that says what breaks.

- **Two forms of one icon.** A file of `dist/svgs/` keeps the path data as it was drawn, and a symbol of the sprite has it in its shortest form. A file is read and edited by people; the sprite is downloaded.
- **The classes of the icons are outside the layer.** The rule that sets the font is inside `@layer content`, and the rules that set the `content` of each icon are not.
- **Three files of code points.** `codepoints.json` has hexadecimal digits and the retired code points, `dist/web/<font>.json` has numbers and the icons only, and `dist/icons.json` has hexadecimal digits and the icons only. The first is the record that the build keeps, the others are output.
- **The registry is in the order of arrival.** The classes of the stylesheets and the entries of `dist/web/<font>.json` follow the registry, so an icon that was added later is after the others, and not in its place in the alphabet. The sprite, `dist/svgs/` and `dist/icons.json` are in the order of the names.
- **A class on every SVG file.** The root of `dist/svgs/<name>.svg` and each symbol of the sprite carry `class="<prefix>-<name>"`, which is also the class that draws the icon with the font.
- **The sprite declares `xmlns:xlink`**, which no symbol uses. svg-sprite writes it.
- **The files of `dist/svgs/` end without a line break**, and Prettier leaves the output alone.
- **`clip-rule` is removed with `fill`.** A drawing that needs `clip-rule` to look right has to be redrawn without it.
- **`main` is a stylesheet.** `main`, `style` and `sass` are kept beside `exports` for tools that read them. Node.js cannot import the package of a set, and nothing in it is JavaScript.
- **The package importer of Sass refuses the path without an extension.** `dist/web/` holds a `.css` and a `.scss` of the font name, so `pkg:<package>/dist/web/<font>` is ambiguous. `pkg:<package>` and the path with `.scss` are not.
- **The font holds its glyphs in the order in which Fantasticon finds the files**, which is the reverse of the order of the names. The order is in the bytes of the font and in nothing that it draws: a class finds its glyph by its code point.
- **The Chassis set starts with two retired code points.** `f243` and `f245` were the code points of two duplicates, removed before the set moved to `chassis-ui/website-icons`, whose registry moved as it was.
- **The page of a set draws with the font from the file system.** A browser does not let a `file:` page read the sprite beside it, so there the page draws the icons with the font, says so, and has no embedded snippet. Served, it reads the sprite into itself, and its embedded snippet is the drawing of the sprite, which may write a path shorter than the file of `svgs/`.
- **The page of a set needs the network for its styles.** Chassis CSS and its script come from jsDelivr, at a fixed version and with their hashes, so the page of a set is the same whatever version of Chassis CSS a project has. Offline, the icons, the search and the drawer still work, unstyled.
- **The site loads the font of the Chassis set twice.** The interface loads the stylesheet of the installed package, and the pages of the set load the one of `vendor/icons`. Both name the family and the classes of one set, and the second wins.
- **The categories and the tags of an icon page are derived.** The category is the first word of the name, and the tags are `icon`, the style and `svg`, until the set has curated metadata.
- **The test of the site copies the build, the site and `vendor/icons` into `.cache/`.** Astro reads a file of a linked package by its path only when that path and the site have a folder in common, which the temporary folder of a machine does not have with the repository.

## History

The build was a set of scripts around SVGO, svg-sprite and Fantasticon, each with the font name and the prefix written in it, and the icons were optimized in place. In October 2026 it was rewritten in the phases of [ref/ROADMAP.md](../ref/ROADMAP.md), which holds the findings that started it, the principles, the decisions and a log of every session: the workspace layout with `source/` at the root, the configured command line with its tests, and the manifest and the release that name no package. The output of the Chassis set did not change by a byte through the rewrite, but for the two duplicates that were removed and the hash of the font in the SCSS.

In November 2026 the set moved to `chassis-ui/website-icons`, published as `@chassis-ui/website-icons`, and the package became the builder, as `chassis-ui/tokens` and `chassis-ui/assets` had become for `chassis-ui/website-tokens` and `chassis-ui/website-assets`: `init` writes a repository of icons, and this repository builds and shows the Chassis set as the submodule `vendor/icons`. The output of the set did not change by a byte through the move, but for the header lines of the stylesheets, which name its version and its repository.

Before the first release of the set, the output moved into `dist/`, by target, as the output of `chassis-ui/website-tokens` and `chassis-ui/website-assets` is, and `dist/icons.json` was added. The page of the set left the output for `preview/`, which `chassis-icons preview` writes from it, and the archive of a release became `<font>-web-<version>.zip`, with the page in it. The files of the output did not change by a byte, only their paths.

Then the `ios` and `android` targets took the icons of a set to apps: an asset catalog, a Swift enum, vector drawables, and an archive per target. They were the work of `chassis-ui/assets` for the icons of the Chassis set until then, which keeps them for the icons that are in no set. With them, `dist/` stopped being committed: the release builds it, and `verify` builds twice and compares the committed files that the build writes.
