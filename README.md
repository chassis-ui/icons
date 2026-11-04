# Chassis Icons

> The builder of icon sets of Chassis UI: the `chassis-icons` command builds a repository of SVG files into optimized SVG files, an SVG sprite and an icon font with its stylesheets, and `init` writes such a repository for a team.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version: 0.4.0-next.0](https://img.shields.io/badge/Version-0.4.0--next.0-blue.svg)](https://github.com/chassis-ui/icons)
[![CI](https://github.com/chassis-ui/icons/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/chassis-ui/icons/actions/workflows/ci.yml)

## Overview

Chassis Icons is published to npm as [`@chassis-ui/icons`](https://www.npmjs.com/package/@chassis-ui/icons). A team installs it in a repository of its own icons, saves the SVG files a designer exports into `source/`, and the `chassis-icons` command writes a library from them: one optimized SVG file per icon, an SVG sprite, and an icon font with its CSS and SCSS. When the repository names iOS and Android as targets, the command also writes an asset catalog with a Swift file, and vector drawables. The build is file-driven: save `<name>.svg` into `source/` and the icon is in the output of the next build. There is no manifest to maintain, and the font name, the class prefix, the frame and the styles of the icons are settings of that repository.

The package holds the build and no icons, as [Chassis Tokens](https://github.com/chassis-ui/tokens) and [Chassis Assets](https://github.com/chassis-ui/assets) hold a builder and no brand. A set of icons is a repository of its own, which a team writes with `init` and builds with the command; this repository holds none. The tests of the build, and the scripts that look at an output, run on a fixture: the repository of icons of another team in `packages/icons/test/fixture/`. The [documentation pages](https://chassis-ui.com/icons/docs/) of the [site](https://chassis-ui.com/icons/) cover drawing icons for a set and using the output in a project.

The rest of this document is for building a set of your own, and for working on the build.

## Getting started

You need:

- **Node.js** 22.12 or later, see `engines` in `package.json`. The repository pins 24 in `.nvmrc`.
- **pnpm**, the version named by `packageManager` in `package.json`. Run `corepack enable` once and pnpm is used at that version.

Clone the repository and install its packages:

```bash
git clone https://github.com/chassis-ui/icons.git
cd icons
pnpm install
```

Then run the tests of the build, and build a copy of the fixture with the build of this checkout:

```bash
pnpm icons:test
pnpm icons:fixture
```

`pnpm icons:fixture` copies `packages/icons/test/fixture/` to `.cache/fixture/` and builds it there, so that the output of the build can be read: `.cache/fixture/dist/`. Run every command from the root of the repository. The site needs the fonts and images of `vendor/assets`, which `pnpm vendor` unpacks; `pnpm dev` and `pnpm site:build` run it.

## Build your own set

`chassis-icons init` writes a repository of icons, and the scripts it writes run the command on that repository. `packages/icons/test/journey.test.js` walks the same steps in every run of the tests, for the set of another team.

### 1. Write the repository

Run `init` with the name of the folder of your repository. It writes the files below into the folder, and names the font and the class prefix after the folder: `acme-icons` gives the font `acme-icons` and the prefix `ai`.

```bash
npx @chassis-ui/icons init acme-icons --name @acme/icons --pm pnpm
```

`pnpm dlx @chassis-ui/icons init acme-icons --name @acme/icons --pm pnpm` does the same. `--name` is the name of the package, `--pm` the package manager that the workflows and the scripts name, `npm` by default; `--font`, `--prefix`, `--repository`, `--license` and `--author` fill in the rest, by default from the folder, the `origin` remote and `user.name` of Git. `chassis-icons init --help` lists them, and `--dry-run` prints the files and writes none.

| File                                                        | What it holds                                                                                                                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                              | The details of the package, the `chassis.build` block, the scripts `build`, `lint`, `verify`, `preview`, `archive` and `release-notes`, and `@chassis-ui/icons` as a devDependency |
| `.gitignore`, `.nvmrc`                                      | The files that are not committed, and the Node.js version of the workflows                                                                                                         |
| `CHANGELOG.md`                                              | The changelog of the set, written by hand, with the entry of the first version                                                                                                     |
| `AGENTS.md`, `CLAUDE.md`                                    | The rules of the repository for AI coding agents                                                                                                                                   |
| `.github/workflows/ci.yml`, `.github/workflows/release.yml` | The checks of a push and a pull request, and the release of a push to `main`                                                                                                       |

`init` writes nothing when a file exists, and never over `package.json` or `CHANGELOG.md`. It writes no `README.md`, which the build writes, and nothing into `source/`, which is yours.

### 2. Install

Make the folder a Git repository, and install the build. The workflows install from the lockfile, so commit it with the first files.

```bash
cd acme-icons
git init
pnpm install
```

### 3. Save the source

Save your SVG files into `source/`, one file per icon. The name of a file is the name of its icon: `bar-line.svg` is the icon `bar-line`. A file can be an icon when:

- its name is in kebab-case, and ends in one of the `styles` of your configuration when you set any,
- its `viewBox` is `0 0 <frame> <frame>`, and its `width` and `height`, when it has them, are the frame,
- it is drawn in one color, with filled shapes only: outline every stroke before exporting,
- it holds no raster image, gradient, pattern or script.

The build only reads `source/`. It never changes a file there.

### 4. Describe the set

Everything that is particular to your set is in `package.json`: the details of the package, and the `chassis.build` block that the build reads. `init` wrote this one:

```json
{
  "name": "@acme/icons",
  "version": "0.1.0",
  "description": "The icons of Acme Icons, built with @chassis-ui/icons",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/acme/icons.git"
  },
  "license": "MIT",
  "author": "Acme",
  "files": ["CHANGELOG.md"],
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "chassis": {
    "build": {
      "name": "acme-icons",
      "prefix": "ai",
      "frame": 24,
      "styles": [],
      "pairs": [],
      "startCodepoint": "f101",
      "formats": ["woff2", "woff"],
      "header": ["Acme Icons v{version}", "Copyright Acme", "Licensed under MIT"]
    }
  },
  "scripts": {
    "build": "chassis-icons build",
    "lint": "chassis-icons lint-source",
    "verify": "chassis-icons verify",
    "preview": "chassis-icons preview --serve",
    "archive": "chassis-icons archive",
    "release-notes": "chassis-icons release-notes"
  },
  "engines": {
    "node": ">=22.12.0"
  },
  "devDependencies": {
    "@chassis-ui/icons": "^<version of the build>"
  }
}
```

With this block the font is `acme-icons`, its files are `acme-icons.css`, `acme-icons.woff2` and so on, and the class of an icon is `ai-<name>`. Set `styles` and `pairs` when your icons come in styles, such as `["line", "fill"]` and `[["line", "fill"]]`, and edit `description` and `header`. Add `"targets": ["ios", "android"]` for the files of iOS and Android apps, or one of the two; `init` does not write the setting, and the web is always built. [Configuration](#configuration) describes each setting. Leave the other fields of the file to the build: it writes `main`, `style`, `sass`, `files`, `exports` and `sideEffects` for your font name, and keeps the entries that are yours, such as `CHANGELOG.md` in `files`.

When a project of yours reads icons by name, list them in `chassis.checks.json` at the root of the repository, and `pnpm verify` fails when one of them is missing; see [The checks file](#the-checks-file). A repository without the file passes.

### 5. Build

Check the source, build, and check the output:

```bash
pnpm lint
pnpm build
pnpm verify
```

`pnpm lint` names each file that cannot be an icon, and why. `pnpm build` writes `dist/`, `codepoints.json` and `README.md`, and the fields of `package.json` that name the files of the output. `dist/` is not committed: `.gitignore` names it, and the release builds it again. Commit `codepoints.json`, `README.md` and `package.json` with `source/` and the lockfile. `pnpm verify` fails in CI when the source does not build twice to the same files, or when one of the committed files that the build writes is not what the source builds.

`pnpm preview` writes the page of the set into `preview/` from the output, and serves it at `http://localhost:4325/` until you stop it: every icon with its name, and on a click its class, its code point and the code that draws it. `preview/` is not committed.

The `README.md` that the build writes for your set shows the four ways to use an icon: the font class, the sprite, the SVG file and Sass. A project takes the two folders of `dist/` of a build as they are:

```bash
cp -r dist/web dist/svgs /path/to/your-project/static/icons/
```

With the targets, the README also shows how an iOS app adds the asset catalog and the Swift file of the archive `<font>-ios-<version>.zip` of a release, and how an Android app copies `res/` of the archive `<font>-android-<version>.zip` into a module. The package on npm holds the output for the web only.

### 6. Release

A push to `main` with a new version in `package.json` releases it. Write the entry of the version in `CHANGELOG.md`, in the form of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and set the version, in one commit; the release stops without the entry, and `pnpm release-notes` prints it. The release workflow lints the source, verifies the set, builds `dist/`, writes the archive `<font>-web-<version>.zip` with `icons.json`, `svgs/`, `web/` and the page of the set in `preview/`, and `<font>-<target>-<version>.zip` of each target, publishes the package to npm with trusted publishing, and creates the tag `v<version>` and its GitHub release with the entry as its body and the archives attached. The version needs no build before its commit: the release builds `dist/` with the new version in the headers of the stylesheets. With `"private": true` in `package.json`, nothing is published to a registry, and the release is the tag and the archives. [Releases](.github/CONTRIBUTING.md#a-repository-of-icons) has the details.

### 7. Take a newer build

A newer version of the build reaches your repository through its devDependency. Bump `@chassis-ui/icons` in `package.json` and install. A newer build can write other files for the same source, and a change to your output is a change to your package, which the entry of your next version names. `dist/` is not committed, so `git diff` does not show it: before the build, `pnpm build --dry-run` lists the files that the newer build writes differently from the `dist/` of your last build. Then build, verify, and read the diff of the committed files before you commit them.

```bash
pnpm install
pnpm build --dry-run
pnpm build
pnpm verify
git diff -- codepoints.json README.md package.json
```

The files that `init` wrote are yours from then on, and a newer version does not write over them. `chassis-icons init --check` reports which of them differ from what the installed version writes, such as the workflows and `AGENTS.md`, and exits 1 when one does. `chassis-icons init --only <file…> --force` writes the ones you want again; `package.json` and `CHANGELOG.md` are never written over.

```bash
pnpm exec chassis-icons init --check
pnpm exec chassis-icons init --only .github/workflows/ci.yml .github/workflows/release.yml --force
```

## Repository layout

A pnpm workspace of two packages.

```text
packages/icons/           -> @chassis-ui/icons, the builder, published to npm
  lib/                    -> The chassis-icons command: cli.js, the modules of the build
  lib/templates/          -> The Handlebars templates of the stylesheets, of the README and of the page of a set
  templates/              -> What chassis-icons init writes into a repository of icons
  test/                   -> The tests of the build, on the fixture: the repository of icons of another team
  README.md               -> The README of the package on npm
  CHANGELOG.md            -> The changelog of the builder, written by pnpm changeset:version
packages/site/            -> The documentation site, built with Astro. Never published to npm
vendor/assets.json        -> The release of chassis-ui/website-assets that has the fonts and images of the site
build/                    -> Scripts of the repository: the copy of the fixture, changeset check, version references, release notes
docs/architecture.md      -> How the build works, and what it promises to write
ref/ROADMAP.md            -> The plan of this repository, its principles and decisions
.changeset/               -> The changesets of the next version
```

A repository of icons commits `source/`, `package.json` with the `chassis.build` block, `codepoints.json` and `README.md`, which the build writes, `chassis.checks.json` when consumers read icons by name, and the files that `init` wrote. The output, `dist/`, is not committed: the release of a set builds it again.

## Commands

Every command runs from the root. The root of this workspace is not a repository of icons: the `pnpm icons:*` scripts that build run the `chassis-icons` command of this checkout, `packages/icons/lib/cli.js`, on the copy of the fixture in `.cache/fixture/`. `node packages/icons/lib/cli.js --help` prints the commands and the options of the build.

### The command

The package has one command, `chassis-icons`, that builds and checks a repository of icons. A team installs `@chassis-ui/icons` in a repository of its own icons and runs it there, through the scripts that `init` wrote.

| Command                       | What it does                                                                                                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chassis-icons build`         | Writes `dist/`, which is not committed, and the registry of the code points, the README and the manifest fields, which are                                                                                       |
| `chassis-icons verify`        | Fails when the source does not build twice to the same files, the registry, the README or the manifest is out of date, an icon lost its code point, or an icon of the checks file is missing                     |
| `chassis-icons lint-source`   | Checks the files of `source/`: names, frame, one color, no stroke, the pairs of the styles                                                                                                                       |
| `chassis-icons preview`       | Writes the page of the set into `preview/`, from `dist/`. With `--serve`, serves it at `http://localhost:4325/` until stopped, or at `--port <n>`                                                                |
| `chassis-icons archive`       | Writes `<font>-web-<version>.zip` with `icons.json`, `svgs/`, `web/` and `preview/` in it, and `<font>-<target>-<version>.zip` with `dist/<target>/` of each target, to `archives/` or `--to <dir>`. Needs `zip` |
| `chassis-icons release-notes` | Prints the `CHANGELOG.md` entry of a version, without its heading, and fails without one                                                                                                                         |
| `chassis-icons init [dir]`    | Writes the files of a new repository of icons into a folder                                                                                                                                                      |

Every command but `init` works on one repository of icons: `--cwd <dir>`, by default the nearest folder upward from the working directory whose `package.json` has a `chassis` block. The root of this workspace has none. `--verbose` says more, `--version` prints the version of the build, and the exit code is 1 when a command failed and 2 when it was not understood.

### Build

```bash
pnpm icons:fixture          # Copy packages/icons/test/fixture/ to .cache/fixture/, and build the copy
pnpm icons:preview          # pnpm icons:fixture, then the page of the copy, into its preview/, served at http://localhost:4325/
node packages/icons/lib/cli.js build --dry-run --cwd .cache/fixture    # List the files that a build of the copy would change, and change none
node packages/icons/lib/cli.js build --only font --cwd .cache/fixture  # One step: svgs, sprite, font, ios, android or package
```

`pnpm icons:fixture` writes a fresh copy at each run, and nothing of `.cache/fixture/` is committed. The tests compare the output of the fixture with `packages/icons/test/golden/`. A whole build removes from `dist/svgs/` each file whose source is gone, and from `dist/` and `dist/web/` each file that it did not write, such as the files of another font name, or the folder of a target that `targets` no longer names. The steps `ios` and `android` run when `targets` names them, and empty their folder before they write it; `--only ios` stops when it does not. The steps after `svgs` read `dist/svgs/`, so `--only sprite` and `--only font` build from the files that are there.

### Check

| Command                   | What it does                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm icons:test`         | The tests of the build, on the fixture in `packages/icons/test/fixture/`. `pnpm test` runs the same                                                |
| `pnpm icons:test:golden`  | Writes `packages/icons/test/golden/` again, after a change that is meant to change the output                                                      |
| `pnpm icons:lint:package` | [publint](https://publint.dev) on what npm would publish                                                                                           |
| `pnpm icons:lint`         | ESLint over the build, its tests and the scripts of `build/`. Fails on a warning                                                                   |
| `pnpm icons:typecheck`    | TypeScript over `packages/icons/lib/`, from its JSDoc                                                                                              |
| `pnpm icons:native`       | `pnpm icons:fixture`, then compiles the output of the targets of the copy with the tools of the platforms: actool and swiftc, and aapt2. Not in CI |
| `pnpm lint:prettier`      | Formatting, across the repository                                                                                                                  |
| `pnpm spellcheck`         | Spelling of the Markdown files, with the words of `.cspell.json`                                                                                   |
| `pnpm check`              | The types of the site, `pnpm check:astro`, then `pnpm check:pnpm`: `pnpm audit --prod --audit-level moderate`                                      |

[CONTRIBUTING.md](.github/CONTRIBUTING.md#checks-per-changed-area) says which checks to run for which change.

### Documentation site

```bash
pnpm vendor               # Unpack the assets that vendor/assets.json pins into vendor/assets
pnpm dev                  # pnpm vendor, then the site at http://localhost:4324/icons/
pnpm astro:dev            # The site alone, without pnpm vendor
pnpm site:build           # pnpm vendor, the site and its search index, into _site/
pnpm astro:build          # The site alone, into _site/
pnpm site:pagefind        # The search index of _site/
pnpm build                # The same as pnpm site:build
pnpm site:test            # Check the built site: its pages, the icons that they draw, and their links
pnpm astro:preview        # Serve _site/ as it is deployed
pnpm site                 # pnpm site:build, then pnpm site:lint
pnpm site:lint            # ESLint, Stylelint, Prettier and the Nu Html Checker over the site
pnpm site:lint:eslint     # ESLint over the site
pnpm site:lint:stylelint  # Stylelint over the Sass of the site
pnpm site:lint:prettier   # Prettier over packages/site
pnpm site:lint:html       # html-validate over _site/, after a build
pnpm site:lint:vnu        # The Nu Html Checker over _site/, after a build. Skipped without Java
pnpm site:lint:fusv       # Sass variables of the site that nothing uses
pnpm site:clean           # Remove _site/ and the build folders of the site
pnpm sync-assets          # Move vendor/assets.json to the latest release of chassis-ui/website-assets
```

### Release

```bash
pnpm changeset            # Describe a change to packages/icons/lib/ or packages/icons/templates/
pnpm changeset:check develop   # Fail when the commits since develop need a changeset and have none
pnpm changeset:version    # Bump the version, write the changelog, copy the version to the places that show it
pnpm release:notes        # Print the changelog entry of the version, as the GitHub release shows it
```

`pnpm changeset:version` copies the version to the badge at the top of this file and to `currentVersion` of `packages/site/config.yml`, and stops when one of the two is gone. See [Releases](.github/CONTRIBUTING.md#releases) and the [changelog](packages/icons/CHANGELOG.md).

## Configuration

### The `chassis.build` block

The build reads one block of the `package.json` of a repository of icons. A setting that the block leaves out has the default of the table, and a setting that the build does not know stops it.

| Setting          | Default                 | What it sets                                                                                        |
| ---------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `name`           | required                | The name of the font, and of every file of `dist/web/`: `<name>.css`, `<name>.svg`, `<name>.woff2`  |
| `prefix`         | required                | What a class starts with: `<prefix>-<icon>`. Also the class of each SVG file and sprite symbol      |
| `source`         | `"source"`              | The folder of your SVG files, from the folder of `package.json`                                     |
| `checks`         | `"chassis.checks.json"` | The file of the icons that others read by name, from the folder of `package.json`. It may not exist |
| `frame`          | `24`                    | The width and the height of the frame an icon is drawn on                                           |
| `styles`         | `[]`                    | The last part a name may have, such as `["line", "fill"]`. Any kebab-case name when empty           |
| `pairs`          | `[]`                    | The styles an icon comes in together, such as `[["line", "fill"]]`                                  |
| `startCodepoint` | `"f101"`                | The code point of the first icon of a new set, in the Private Use Area (`e000` to `f8ff`)           |
| `formats`        | `["woff2", "woff"]`     | The font formats, in the order of the `src` of the font face: `woff2`, `woff`, `ttf`                |
| `header`         | `[]`                    | The lines of the comment at the top of each stylesheet. `{version}` is the version of the package   |
| `targets`        | `[]`                    | The targets besides the web, which is always built: `ios`, `android`                                |

`name` and `prefix` are kebab-case names. The fixture of the tests, `@acme/glyphs`, has `"name": "acme-glyphs"`, `"prefix": "ag"`, the frame `16`, the styles `line` and `fill`, the pair of `line` and `fill`, and the targets `ios` and `android`.

### The package

The other fields of the `package.json` of a repository of icons describe the package, and the build and the release workflow read them.

| Field                                                      | Who writes it | What it does                                                                                                                                                     |
| ---------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `version`                                          | You           | The package that the release workflow publishes, and the `{version}` of `header`                                                                                 |
| `description`, `homepage`, `repository`, `license`         | You           | Shown in the README of the set: the first paragraph, the link to your site, the link to the source, the license                                                  |
| `main`, `style`, `sass`, `files`, `exports`, `sideEffects` | The build     | Name the files of the font. An entry of `files` or `exports` that is not about `dist/`, or about `icons/` and `svgs/` of an earlier build, is yours, and is kept |
| `private`                                                  | You           | With `true`, the release workflow publishes nothing, and the release is the tag and the archive on GitHub                                                        |
| `publishConfig`                                            | You           | Read by npm when it publishes: `access`, and `provenance`. Set `provenance` to `false` to publish from your own machine                                          |
| `scripts`, `devDependencies`                               | `init`        | The scripts that run the command, and the version of the build. Bump the dependency to take a newer build                                                        |

### The checks file

`chassis.checks.json` lists, under `contracts`, the icons that a consumer reads by name. Each entry has a `reader`, which the message of a failed check names, and its `icons`. The build does not read the file, `chassis-icons verify` does, and a set without the file passes.

```json
{
  "contracts": [{ "reader": "the toolbar of the app", "icons": ["bar-fill", "ring-line"] }]
}
```

### The templates

`packages/icons/lib/templates/css.hbs` and `scss.hbs` are the Handlebars templates of the stylesheets. Change them to change what the stylesheets hold, for every set. They get `name`, `prefix`, `header`, `formats`, `fontSrc`, `fontsUrl`, `fontHash` and `codepoints` from the build.

`readme.hbs` is the template of the `README.md` of a set. It gets `packageName`, `description`, `homepage`, `repository` and `license` from `package.json`, `name`, `prefix`, `frame`, `styles` and `formats` from the configuration, the number of icons as `count`, the first icon as `icon`, and, for the targets of the set, their platforms as `platforms`, the Swift names of the set and the first icon as `ios`, and the drawable of the first icon as `android`.

`preview/` holds the template of the page of a set: `index.hbs`, written as `index.html`, and `preview.css` and `preview.js`, copied beside it. `index.hbs` gets the index of the set, `dist/icons.json`, and the name and the version of the package.

`packages/icons/templates/` holds what `chassis-icons init` writes: `AGENTS.md`, `CHANGELOG.md`, `CLAUDE.md`, `gitignore` and the two workflows of `workflows/`. A file is written once and is the repository's from then on; a change here reaches a repository made earlier only when its team runs `init --check` and `init --only <file…> --force`.

### The code points

`codepoints.json` at the root of a repository of icons is the registry of the code points, and the build is its only writer. An icon keeps its code point for as long as it is in the set. A new icon gets the next free one, and never moves another. The code point of a removed icon is retired: no later icon gets it. Commit the file with the change to `source/`.

## Output

`chassis-icons build` writes one folder, `dist/`, and its shape is the same for any set. The folder is not committed: the release of a set builds it again for the package and the archives. `<font>` is `name` of the configuration, `<prefix>` its `prefix`, `<module>` the font name in PascalCase, and `<name>` the name of an icon. The folders `ios/` and `android/` are there when `targets` names them.

| File                                             | What it holds                                                                                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dist/icons.json`                                | The index of the set: `name`, `prefix`, `frame`, `styles` and `pairs` of the configuration, and each icon with its code point, and its base and style when the set has styles |
| `dist/svgs/<name>.svg`                           | One icon, optimized, on the frame, with `fill="currentcolor"` and the class `<prefix>-<name>`                                                                                 |
| `dist/web/<font>.svg`                            | The sprite: one `<symbol>` per icon, with the id `<name>`                                                                                                                     |
| `dist/web/<font>.woff2`, `.woff`, `.ttf`         | The icon font, in the formats of the configuration                                                                                                                            |
| `dist/web/<font>.css`, `dist/web/<font>.min.css` | The font face and one class per icon, `<prefix>-<name>`. They load the font from their own folder                                                                             |
| `dist/web/<font>.scss`                           | The same for Sass, with the folder of the font, the hash and the map of the icons as `!default` values                                                                        |
| `dist/web/<font>.json`                           | The code point of each icon, by name, as a number                                                                                                                             |
| `dist/ios/<module>.xcassets`                     | An asset catalog with an image set per icon, `<name>.imageset`: the SVG file of the icon, kept as a vector and rendered as a template image in the tint of its view           |
| `dist/ios/<module>.swift`                        | The enum of the icons, named after the prefix in PascalCase with `Icon`, with a case per icon, and the initializers `UIImage(_:)` and SwiftUI `Image(_:)` that draw one       |
| `dist/android/res/drawable/<prefix>_<name>.xml`  | A vector drawable per icon, converted with svg2vectordrawable, with its paths filled black for a tint to replace                                                              |

Beside it, at the root of the repository, the build writes `codepoints.json`, `README.md` and the fields of `package.json` that name the files, which the repository commits. `files` of `package.json` publishes the output for the web, `dist/icons.json`, `dist/svgs/` and `dist/web/`; an app takes the files of `dist/ios/` and `dist/android/` from the archives of a release. `chassis-icons preview` writes the page of the set into `preview/` from `dist/`: every icon with its name, a search box, and on a click the code that draws it. The page is not output: it is not committed, not published and not checked by `verify`. [docs/architecture.md](docs/architecture.md#output-contract) has the contract of each file.

## What reads the output

The siblings of this repository take any set that keeps the shape above, and a team points each of them at its own set.

| Consumer                                                    | What it reads                                                                                                                                                                                                           | How a team points it at its own set                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Chassis CSS](https://github.com/chassis-ui/css)            | An SVG file by name: `svg-icon("<name>")` is the address of `dist/svgs/<name>.svg`                                                                                                                                      | `$icon-url-prefix`, or serve `dist/svgs/` at that address |
| [Chassis React](https://github.com/chassis-ui/react)        | `<Icon name>`: the sprite symbol `#<name>`, or with `font` the class `<fontPrefix><name>`                                                                                                                               | `IconProvider`: `sprite`, `fontPrefix`, `icons`           |
| [`@chassis-ui/docs`](https://github.com/chassis-ui/website) | `<Icon name>`: the symbol `#<name>` of an SVG sprite that the site serves                                                                                                                                               | The `sprite` prop of `Icon`                               |
| [Chassis Assets](https://github.com/chassis-ui/assets)      | No set: it writes the icons of a brand that are outside a set for iOS and Android, with `--icon-catalog` and `--vector-drawables`. An app takes the icons of a set from the archives of the `ios` and `android` targets | Nothing to point: a set is not copied into it             |

A set whose icons a consumer reads by name lists those names in its checks file, so that `chassis-icons verify` fails when one is missing.

## Branches and CI

Work goes to `develop`. CI runs there and on pull requests, with the jobs Lint, Type Check, Build, Site and Audit, and Changeset when there is something to compare with; Build runs the checks of the build on the fixture, and Site builds and checks the documentation site. `main` holds released versions only: the commit of a version that passed on `develop` is pushed to `main`, and that push publishes the package and creates the GitHub release. See [Releases](.github/CONTRIBUTING.md#releases).

## Chassis ecosystem

| Project                                                     | What it is                                                          | Docs                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| [chassis-ui/website](https://github.com/chassis-ui/website) | chassis-ui.com and `@chassis-ui/docs`, which every site is built on | [chassis-ui.com](https://chassis-ui.com)   |
| [chassis-ui/tokens](https://github.com/chassis-ui/tokens)   | The token builder, published as `@chassis-ui/tokens`                | [/tokens/](https://chassis-ui.com/tokens/) |
| [chassis-ui/css](https://github.com/chassis-ui/css)         | The CSS framework, published as `@chassis-ui/css`                   | [/css/](https://chassis-ui.com/css/)       |
| **chassis-ui/icons**                                        | This repository: the icon builder, published as `@chassis-ui/icons` | [/icons/](https://chassis-ui.com/icons/)   |
| [chassis-ui/assets](https://github.com/chassis-ui/assets)   | Fonts, images and other assets. Not on npm                          | [/assets/](https://chassis-ui.com/assets/) |
| [chassis-ui/figma](https://github.com/chassis-ui/figma)     | Documentation of the Figma libraries                                | [/figma/](https://chassis-ui.com/figma/)   |
| [chassis-ui/react](https://github.com/chassis-ui/react)     | React components, published as `@chassis-ui/react`                  | Not yet routed on chassis-ui.com           |

The tokens of the Chassis sites are `@chassis-ui/website-tokens`, from [chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens). Chassis CSS and the site of this repository read them.

## Contributing

Branch from `develop` and open a pull request against `develop`. [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) covers the setup, changing the build, the templates and the site, the checks to run for each, changesets and releases. [docs/architecture.md](docs/architecture.md) explains the build. [WRITING.md](WRITING.md) is the style guide of the documentation, and [AGENTS.md](AGENTS.md) holds the rules for AI coding agents. Everyone taking part follows the [Code of Conduct](.github/CODE_OF_CONDUCT.md); report a vulnerability as [SECURITY.md](.github/SECURITY.md) says.

## License

MIT License. See [LICENSE](LICENSE).
