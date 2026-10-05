# Chassis Icons

> An icon library creator: a repository that a team owns, fills with its own SVG files and builds into an icon font, an SVG sprite and optimized SVG files, with a site that shows the set.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version: 0.4.0-next.0](https://img.shields.io/badge/Version-0.4.0--next.0-blue.svg)](https://github.com/chassis-ui/icons)
[![CI](https://github.com/chassis-ui/icons/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/chassis-ui/icons/actions/workflows/ci.yml)

## Overview

Chassis Icons holds the SVG files a designer exports, in `source/`, and a build that writes a library from them: one optimized SVG file per icon, an SVG sprite, and an icon font with its CSS and SCSS. The build is file-driven: save `<name>.svg` into `source/` and the icon is in the output of the next build. There is no manifest to maintain.

The repository is made to be owned and customized, as [Chassis Tokens](https://github.com/chassis-ui/tokens) and [Chassis Assets](https://github.com/chassis-ui/assets) are. A team that adopts it replaces the files of `source/` and the `chassis.build` block of `packages/icons/package.json`, and never the build. The font name, the class prefix, the frame and the styles of the icons are settings.

The icons in it are the Chassis defaults: the set that the Chassis documentation sites and Figma libraries use, published as [`@chassis-ui/icons`](https://www.npmjs.com/package/@chassis-ui/icons) and shown on [chassis-ui.com/icons](https://chassis-ui.com/icons/). To use that set in a project, install the package and read [its README](packages/icons/README.md). The rest of this document is for building a set of your own, and for working on the build.

## Getting started

You need:

- **Node.js** 22.12 or later, see `engines` in `package.json`. The repository pins 24 in `.nvmrc`.
- **pnpm**, the version named by `packageManager` in `package.json`. Run `corepack enable` once and pnpm is used at that version.
- **Git LFS**, from [git-lfs.com](https://git-lfs.com), for the documentation site only: its fonts and images are in the `vendor/assets` submodule. The build of the icons needs neither.

Clone the repository and install its packages:

```bash
git clone https://github.com/chassis-ui/icons.git chassis-icons
cd chassis-icons
pnpm install
```

Build the set, and check that the committed output is what the source builds:

```bash
pnpm icons
pnpm icons:verify
```

Run every command from the root of the repository. `packages/icons/icons/preview.html`, which the build writes and Git ignores, shows every icon of the sprite.

## Build your own set

These steps turn a clone into the library of your team. `packages/icons/test/journey.test.js` walks the same steps on the set of another team, in every run of the tests.

### 1. Keep the clone, and make it yours

Keep the Git repository of the clone, so that a newer build can be [taken into it](.github/CONTRIBUTING.md#taking-a-newer-build-into-your-copy) later. Point it at your own remote, and delete the tags, which are the releases of the Chassis set:

```bash
git remote rename origin upstream
git remote add origin https://github.com/your-org/your-icons.git
git tag -l | xargs git tag -d
```

`pnpm icons:verify` compares the code points of your icons with those of your last tag, so the tags of the clone have to be your own.

The changesets of the clone describe the next version of the Chassis set. Delete every Markdown file of `.changeset/` but `README.md`, and `.changeset/pre.json` and `.changeset/pre/` when they are there:

```bash
find .changeset -name '*.md' ! -name README.md -delete
rm -rf .changeset/pre .changeset/pre.json
```

### 2. Replace the source

Remove the SVG files of the Chassis set from `source/`, and save your own there, one file per icon:

```bash
rm source/*.svg
cp /path/to/your/icons/*.svg source/
```

The name of a file is the name of its icon: `arrow-right-solid.svg` is the icon `arrow-right-solid`. A file can be an icon when:

- its name is in kebab-case, and ends in one of the `styles` of your configuration when you set any,
- its `viewBox` is `0 0 <frame> <frame>`, and its `width` and `height`, when it has them, are the frame,
- it is drawn in one color, with filled shapes only: outline every stroke before exporting,
- it holds no raster image, gradient, pattern or script.

The build only reads `source/`. It never changes a file there.

### 3. Describe your set

Everything that is particular to your set is in `packages/icons/package.json`: the details of the package, and the `chassis.build` block that the build reads.

```json
{
  "name": "@your-org/your-icons",
  "version": "1.0.0",
  "description": "The icons of Your Design System.",
  "homepage": "https://your-design-system.example/icons/",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-org/your-icons.git",
    "directory": "packages/icons"
  },
  "author": "Your Name <you@your-org.example>",
  "license": "MIT",
  "chassis": {
    "build": {
      "name": "your-icons",
      "prefix": "yi",
      "frame": 24,
      "styles": ["outline", "solid"],
      "pairs": [["outline", "solid"]],
      "startCodepoint": "f101",
      "formats": ["woff2", "woff"],
      "header": ["Your Icons v{version}", "Copyright Your Org"]
    }
  }
}
```

With this block the font is `your-icons`, its files are `your-icons.css`, `your-icons.woff2` and so on, and the class of an icon is `yi-<name>`. [Configuration](#configuration) describes each setting. Leave the other fields of the file as they are: the build writes `main`, `style`, `sass`, `files`, `exports` and `sideEffects` for your font name.

`chassis.checks.json`, at the root, lists the icons that the Chassis sites and Chassis React read by name, and `pnpm icons:verify` fails when one of them is missing. Empty its `contracts` list, or fill it with the icons that your own projects read by name.

### 4. Start the set, and build it

`pnpm icons:init` empties the output and the registry of the code points, so that your first icon gets the first code point. Run it once, before the first build of your set. Then check the source, build, and check the output:

```bash
pnpm icons:init
pnpm icons:lint:source
pnpm icons
pnpm icons:verify
```

`pnpm icons:lint:source` names each file that cannot be an icon, and why. `pnpm icons` writes `packages/icons/svgs/`, `packages/icons/icons/`, `packages/icons/codepoints.json` and `packages/icons/README.md`. Commit all of them with `source/`: the output is committed, and `pnpm icons:verify` fails in CI when a committed file is not what the source builds.

`packages/icons/CHANGELOG.md` is the changelog of the Chassis set. Replace its entries with a first line of your own, such as `# Changelog`; `pnpm changeset:version` writes the entries of your versions above the older ones.

### 5. Use the library

The output is in two folders, which a project takes as they are:

```bash
cp -r packages/icons/icons packages/icons/svgs /path/to/your-project/static/icons/
```

`packages/icons/README.md`, which the build writes for your set, shows the four ways to use an icon: the font class, the sprite, the SVG file and Sass. To publish the set as an npm package, or to release it as an archive on GitHub without a package, see [Releases](.github/CONTRIBUTING.md#releases): the release workflow reads the name of the package, and `"private": true`, from `packages/icons/package.json`.

### 6. The site of your set

The documentation site in `packages/site/` shows one page per icon. Write the pages of your icons, and set the title, the address and the repository of your site in `packages/site/config.yml`:

```bash
pnpm site:pages --clean
pnpm dev
```

`pnpm site:pages --clean` removes the pages of `packages/site/content/icons/` and writes one per file of `packages/icons/svgs/`. Two things still tie the site to the Chassis set, and Phase 5 of [the roadmap](ref/ROADMAP.md) removes both: the site draws its own header and home page with icons of the Chassis set by name, so those are missing with another set until you change the names, and `exampleIcon` of `packages/site/config.yml` has to name an icon of your set.

## Repository layout

A pnpm workspace of two packages, with the source of the icons at the root.

```text
source/                   -> The SVG files you save, one per icon. The build only reads them
packages/icons/           -> The package of the set: @chassis-ui/icons for the default set
  svgs/                   -> Output: one optimized SVG file per icon. Committed and published
  icons/                  -> Output: the font, its stylesheets and the sprite. Committed and published
  codepoints.json         -> The code point of each icon, and the retired ones. Written by the build
  README.md               -> Written by the build, for someone who installs the set
  package.json            -> The details of the package and the `chassis.build` configuration
  build/                  -> The build: cli.js, its modules and the templates
  test/                   -> The tests of the build, on the set of another team
packages/site/            -> The documentation site, built with Astro. Never published to npm
build/                    -> Scripts of the repository: site pages, changeset check, version references, release
chassis.checks.json       -> The icons that consumers of the set read by name
docs/architecture.md      -> How the build works, and what it promises to write
ref/ROADMAP.md            -> The plan of this repository, its principles and decisions
.changeset/               -> The changesets of the next version
vendor/assets             -> Git submodule of chassis-ui/assets: the fonts and images of the site
```

## Commands

Every command runs from the root. `node packages/icons/build/cli.js --help` prints the commands and the options of the build.

### Build

```bash
pnpm icons                  # The whole output: SVG files, sprite, font, stylesheets, README and manifest
pnpm icons --dry-run        # List the files that a build would change, and change none
pnpm icons --only font      # One step: svgs, sprite, font or package
pnpm icons --verbose        # Each file that is written, and each code point that is given or retired
pnpm icons:svgs             # The step svgs: source/ optimized into packages/icons/svgs/
pnpm icons:sprite           # The step sprite: the SVG sprite and the preview page
pnpm icons:font             # The step font: the font, its stylesheets and the code points
pnpm icons:init             # Empty the output and the registry of code points, to start a new set
```

A whole build removes from `packages/icons/svgs/` each file whose source is gone, and from `packages/icons/icons/` each file that it did not write, such as the files of another font name. The steps after `svgs` read `packages/icons/svgs/`, so `--only sprite` and `--only font` build from the files that are there.

### Check

| Command                   | What it does                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm icons:lint:source`  | Checks each file of `source/` against the configuration: its name, its frame, one color, no stroke, the pairs of the styles        |
| `pnpm icons:verify`       | Builds into a temporary folder and fails when a committed file differs, an icon lost its code point, or a contract icon is missing |
| `pnpm icons:test`         | The tests of the build, on the fixture in `packages/icons/test/fixture/`. `pnpm test` runs the same                                |
| `pnpm icons:test:golden`  | Writes `packages/icons/test/golden/` again, after a change that is meant to change the output                                      |
| `pnpm icons:lint:package` | [publint](https://publint.dev) on what npm would publish                                                                           |
| `pnpm icons:lint`         | ESLint over the build, its tests and the scripts of `build/`. Fails on a warning                                                   |
| `pnpm icons:typecheck`    | TypeScript over `packages/icons/build/`, from its JSDoc                                                                            |
| `pnpm lint:prettier`      | Formatting, across the repository                                                                                                  |
| `pnpm spellcheck`         | Spelling of the Markdown files, with the words of `.cspell.json`                                                                   |
| `pnpm check`              | The types of the site, then `pnpm check:pnpm`: `pnpm audit --prod --audit-level moderate`                                          |

`pnpm icons:verify --since <ref>` compares the code points with those of a commit, a branch or a tag, in place of the last tag. [CONTRIBUTING.md](.github/CONTRIBUTING.md#checks-per-changed-area) says which checks to run for which change.

### Documentation site

```bash
pnpm vendor               # Check out and build the vendor/assets submodule. Once, before pnpm dev. Needs Git LFS
pnpm dev                  # Run the site at http://localhost:4324/icons/
pnpm site:pages           # Write the page of each icon that has none. --clean removes the pages first
pnpm site:build           # The submodule, the site and its search index, into _site/
pnpm astro:preview        # Serve _site/ as it is deployed
pnpm site:lint            # ESLint, Stylelint, Prettier and the Nu Html Checker over the site
pnpm site:lint:html       # html-validate over _site/, after a build
pnpm site:lint:vnu        # The Nu Html Checker over _site/, after a build. Skipped without Java
pnpm site:lint:fusv       # Sass variables of the site that nothing uses
pnpm sync-submodules      # Move vendor/assets to the latest commit of its app/docs branch
pnpm build                # pnpm icons, pnpm site:pages and pnpm site:build
```

### Release

```bash
pnpm changeset            # Describe a change to source/, to the build or to the output
pnpm changeset:check develop   # Fail when the commits since develop need a changeset and have none
pnpm changeset:version    # Bump the version, write the changelog, copy the version, build again
pnpm release:notes        # Print the changelog entry of the version, as the GitHub release shows it
pnpm release:archives     # Write .cache/release/<font>-<version>.zip, with icons/ and svgs/ in it
```

`pnpm changeset:version` copies the version to the badge at the top of this file and to `currentVersion` of `packages/site/config.yml`, and stops when one of the two is gone. See [Releases](.github/CONTRIBUTING.md#releases) and the [changelog](packages/icons/CHANGELOG.md).

## Configuration

### The `chassis.build` block

The build reads one block of `packages/icons/package.json`. A setting that the block leaves out has the default of the table, and a setting that the build does not know stops it.

| Setting          | Default                       | What it sets                                                                                      |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `name`           | required                      | The name of the font, and of every file of `icons/`: `<name>.css`, `<name>.svg`, `<name>.woff2`   |
| `prefix`         | required                      | What a class starts with: `<prefix>-<icon>`. Also the class of each SVG file and sprite symbol    |
| `source`         | `"../../source"`              | The folder of your SVG files, from the package                                                    |
| `checks`         | `"../../chassis.checks.json"` | The file of the icons that others read by name, from the package. It may not exist                |
| `frame`          | `24`                          | The width and the height of the frame an icon is drawn on                                         |
| `styles`         | `[]`                          | The last part a name may have, such as `["outline", "solid"]`. Any kebab-case name when empty     |
| `pairs`          | `[]`                          | The styles an icon comes in together, such as `[["outline", "solid"]]`                            |
| `startCodepoint` | `"f101"`                      | The code point of the first icon of a new set, in the Private Use Area (`e000` to `f8ff`)         |
| `formats`        | `["woff2", "woff"]`           | The font formats, in the order of the `src` of the font face: `woff2`, `woff`, `ttf`              |
| `header`         | `[]`                          | The lines of the comment at the top of each stylesheet. `{version}` is the version of the package |

`name` and `prefix` are kebab-case names. The default set has `"name": "chassis-icons"`, `"prefix": "cx"`, the styles `outline`, `solid` and `brand`, and the pair of `outline` and `solid`.

### The package

The other fields of `packages/icons/package.json` describe the package, and the build and the release workflow read them.

| Field                                                      | Who writes it | What it does                                                                                                                 |
| ---------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name`, `version`                                          | You           | The package that the release workflow publishes, and the `{version}` of `header`. `pnpm changeset:version` bumps the version |
| `description`, `homepage`, `repository`, `license`         | You           | Shown in `packages/icons/README.md`: the first paragraph, the link to your site, the link to the source, the license         |
| `main`, `style`, `sass`, `files`, `exports`, `sideEffects` | The build     | Name the files of the font. An entry of `files` or `exports` that is not about `icons/` or `svgs/` is yours, and is kept     |
| `private`                                                  | You           | With `true`, the release workflow publishes nothing, and the release is the tag and the archive on GitHub                    |
| `publishConfig`                                            | You           | Read by npm when it publishes: `access`, and `provenance`. Set `provenance` to `false` to publish from your own machine      |

### The checks file

`chassis.checks.json` lists, under `contracts`, the icons that a consumer reads by name. Each entry has a `reader`, which the message of a failed check names, and its `icons`. The build does not read the file, `pnpm icons:verify` does, and a set without the file passes.

```json
{
  "contracts": [{ "reader": "the toolbar of the app", "icons": ["search-solid", "xmark-outline"] }]
}
```

### The templates

`packages/icons/build/templates/css.hbs` and `scss.hbs` are the Handlebars templates of the stylesheets. Change them to change what the stylesheets hold. They get `name`, `prefix`, `header`, `formats`, `fontSrc`, `fontHash` and `codepoints` from the build.

`readme.hbs` is the template of `packages/icons/README.md`. It gets `packageName`, `description`, `homepage`, `repository` and `license` from `package.json`, `name`, `prefix`, `frame`, `styles` and `formats` from the configuration, the number of icons as `count`, and the first icon as `icon`.

### The code points

`packages/icons/codepoints.json` is the registry of the code points, and the build is its only writer. An icon keeps its code point for as long as it is in the set. A new icon gets the next free one, and never moves another. The code point of a removed icon is retired: no later icon gets it. Commit the file with the output.

## Output

`pnpm icons` writes two folders, and their shape is the same for any set. `<font>` is `name` of the configuration, `<prefix>` its `prefix`, and `<name>` the name of an icon.

| File                                       | What it holds                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `svgs/<name>.svg`                          | One icon, optimized, on the frame, with `fill="currentcolor"` and the class `<prefix>-<name>`          |
| `icons/<font>.svg`                         | The sprite: one `<symbol>` per icon, with the id `<name>`                                              |
| `icons/<font>.woff2`, `.woff`, `.ttf`      | The icon font, in the formats of the configuration                                                     |
| `icons/<font>.css`, `icons/<font>.min.css` | The font face and one class per icon, `<prefix>-<name>`. They load the font from their own folder      |
| `icons/<font>.scss`                        | The same for Sass, with the folder of the font, the hash and the map of the icons as `!default` values |
| `icons/<font>.json`                        | The code point of each icon, by name, as a number                                                      |
| `icons/preview.html`                       | A page of the sprite, for a look at the set. Not committed, and not published                          |

[docs/architecture.md](docs/architecture.md#output-contract) has the contract of each file.

## What reads the output

The siblings of this repository take any set that keeps the shape above. None of them names the Chassis set in a way that a team cannot configure.

| Consumer                                                    | What it reads                                                                                                                         | How a team points it at its own set                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [Chassis CSS](https://github.com/chassis-ui/css)            | An SVG file by name: `svg-icon("<name>")` is the address of `svgs/<name>.svg`                                                         | `$icon-url-prefix`, or serve `svgs/` at that address   |
| [Chassis React](https://github.com/chassis-ui/react)        | `<Icon name>`: the sprite symbol `#<name>`, or with `font` the class `<fontPrefix><name>`                                             | `IconProvider`: `sprite`, `fontPrefix`, `icons`        |
| [`@chassis-ui/docs`](https://github.com/chassis-ui/website) | `/static/icons/chassis-icons.css` and the symbols of `/static/icons/chassis-icons.svg`, copied from `icons/` of the installed package | The `sprite` prop of `Icon`; otherwise the Chassis set |
| [Chassis Assets](https://github.com/chassis-ui/assets)      | The two folders as they are, copied into its `source/` and renamed per platform for the web, iOS and Android                          | A brand copies the output of its own build             |

The default set also promises its names: the Chassis sites and Chassis React draw their own interface with icons of it. Those names are the `contracts` of `chassis.checks.json`.

## Branches and CI

Work goes to `develop`. CI runs there and on pull requests, with the jobs Lint, Type Check, Build, Site and Audit, and Changeset when there is something to compare with. `main` holds released versions only: the commit of a version that passed on `develop` is pushed to `main`, and that push publishes the package and creates the GitHub release. See [Releases](.github/CONTRIBUTING.md#releases).

## Chassis ecosystem

| Project                                                  | What it is                                                          | Docs                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| [chassis-website](https://github.com/chassis-ui/website) | chassis-ui.com and `@chassis-ui/docs`, which every site is built on | [chassis-ui.com](https://chassis-ui.com)   |
| [chassis-tokens](https://github.com/chassis-ui/tokens)   | Design tokens, published as `@chassis-ui/tokens`                    | [/tokens/](https://chassis-ui.com/tokens/) |
| [chassis-css](https://github.com/chassis-ui/css)         | The CSS framework, published as `@chassis-ui/css`                   | [/css/](https://chassis-ui.com/css/)       |
| **chassis-icons**                                        | This repository: the icon library creator, and `@chassis-ui/icons`  | [/icons/](https://chassis-ui.com/icons/)   |
| [chassis-assets](https://github.com/chassis-ui/assets)   | Fonts, images and other assets. Not on npm                          | [/assets/](https://chassis-ui.com/assets/) |
| [chassis-figma](https://github.com/chassis-ui/figma)     | Documentation of the Figma libraries                                | [/figma/](https://chassis-ui.com/figma/)   |
| [chassis-react](https://github.com/chassis-ui/react)     | React components, published as `@chassis-ui/react`                  | Not yet routed on chassis-ui.com           |

## Contributing

Branch from `develop` and open a pull request against `develop`. [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) covers the setup, adding an icon, changing the build and the site, the checks to run for each, changesets and releases. [docs/architecture.md](docs/architecture.md) explains the build. [WRITING.md](WRITING.md) is the style guide of the documentation, and [AGENTS.md](AGENTS.md) holds the rules for AI coding agents. Everyone taking part follows the [Code of Conduct](.github/CODE_OF_CONDUCT.md); report a vulnerability as [SECURITY.md](.github/SECURITY.md) says.

## License

MIT License. See [LICENSE](LICENSE).
