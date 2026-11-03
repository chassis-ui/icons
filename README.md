# Chassis Icons

> The builder of icon sets for the Chassis Design System: the `chassis-icons` command builds a repository of SVG files into optimized SVG files, an SVG sprite and an icon font with its stylesheets, and `init` writes such a repository for a team.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version: 0.4.0-next.0](https://img.shields.io/badge/Version-0.4.0--next.0-blue.svg)](https://github.com/chassis-ui/icons)
[![CI](https://github.com/chassis-ui/icons/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/chassis-ui/icons/actions/workflows/ci.yml)

## Overview

Chassis Icons is published to npm as [`@chassis-ui/icons`](https://www.npmjs.com/package/@chassis-ui/icons). A team installs it in a repository of its own icons, saves the SVG files a designer exports into `source/`, and the `chassis-icons` command writes a library from them: one optimized SVG file per icon, an SVG sprite, and an icon font with its CSS and SCSS. The build is file-driven: save `<name>.svg` into `source/` and the icon is in the output of the next build. There is no manifest to maintain, and the font name, the class prefix, the frame and the styles of the icons are settings of that repository.

The package holds the build and no icons, as [Chassis Tokens](https://github.com/chassis-ui/tokens) and [Chassis Assets](https://github.com/chassis-ui/assets) hold a builder and no brand. The icons of the Chassis Design System are a repository of icons built with it, [chassis-ui/website-icons](https://github.com/chassis-ui/website-icons), published as [`@chassis-ui/website-icons`](https://www.npmjs.com/package/@chassis-ui/website-icons): to use that set in a project, install that package and read its README. This repository vendors it as the submodule `vendor/icons`, so that CI builds and checks a real set, and the [site](https://chassis-ui.com/icons/) shows it. The [documentation pages](https://chassis-ui.com/icons/docs/) of the site cover drawing icons for a set and using the output in a project.

The rest of this document is for building a set of your own, and for working on the build.

## Getting started

You need:

- **Node.js** 22.12 or later, see `engines` in `package.json`. The repository pins 24 in `.nvmrc`.
- **pnpm**, the version named by `packageManager` in `package.json`. Run `corepack enable` once and pnpm is used at that version.

Clone the repository, install its packages, and check out the set that it builds:

```bash
git clone https://github.com/chassis-ui/icons.git
cd icons
pnpm install
pnpm vendor
```

`pnpm vendor` checks out the `vendor/icons` submodule, a checkout of chassis-ui/website-icons, and unpacks the fonts and images of the site. Then run the tests of the build, build the Chassis set with the build of this checkout, and check that its committed output is what its source builds:

```bash
pnpm icons:test
pnpm icons
pnpm icons:verify
```

Run every command from the root of the repository. `pnpm icons:test` needs no submodule.

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

Save your SVG files into `source/`, one file per icon. The name of a file is the name of its icon: `arrow-right-solid.svg` is the icon `arrow-right-solid`. A file can be an icon when:

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

With this block the font is `acme-icons`, its files are `acme-icons.css`, `acme-icons.woff2` and so on, and the class of an icon is `ai-<name>`. Set `styles` and `pairs` when your icons come in styles, such as `["outline", "solid"]` and `[["outline", "solid"]]`, and edit `description` and `header`. [Configuration](#configuration) describes each setting. Leave the other fields of the file to the build: it writes `main`, `style`, `sass`, `files`, `exports` and `sideEffects` for your font name, and keeps the entries that are yours, such as `CHANGELOG.md` in `files`.

When a project of yours reads icons by name, list them in `chassis.checks.json` at the root of the repository, and `pnpm verify` fails when one of them is missing; see [The checks file](#the-checks-file). A repository without the file passes.

### 5. Build

Check the source, build, and check the output:

```bash
pnpm lint
pnpm build
pnpm verify
```

`pnpm lint` names each file that cannot be an icon, and why. `pnpm build` writes `dist/`, `codepoints.json` and `README.md`, and the fields of `package.json` that name the files of the output. Commit all of them with `source/` and the lockfile: the output is committed, and `pnpm verify` fails in CI when a committed file is not what the source builds.

`pnpm preview` writes the page of the set into `preview/` from the output, and serves it at `http://localhost:4325/` until you stop it: every icon with its name, and on a click its class, its code point and the code that draws it. `preview/` is not committed.

The `README.md` that the build writes for your set shows the four ways to use an icon: the font class, the sprite, the SVG file and Sass. A project takes the two folders of `dist/` as they are:

```bash
cp -r dist/web dist/svgs /path/to/your-project/static/icons/
```

### 6. Release

A push to `main` with a new version in `package.json` releases it. Write the entry of the version in `CHANGELOG.md`, in the form of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and set the version, in one commit; the release stops without the entry, and `pnpm release-notes` prints it. The release workflow lints the source, verifies the output, writes the archive `<font>-web-<version>.zip` with `icons.json`, `svgs/`, `web/` and the page of the set in `preview/`, publishes the package to npm with trusted publishing, and creates the tag `v<version>` and its GitHub release with the entry as its body and the archive attached. With `"private": true` in `package.json`, nothing is published to a registry, and the release is the tag and the archive. [Releases](.github/CONTRIBUTING.md#a-repository-of-icons) has the details.

### 7. Take a newer build

A newer version of the build reaches your repository through its devDependency. Bump `@chassis-ui/icons` in `package.json`, install, build, and read the diff of the output before you commit it: a newer build can write other files for the same source, and a change to your output is a change to your package, which the entry of your next version names.

```bash
pnpm install
pnpm build
pnpm verify
git diff -- dist codepoints.json README.md package.json
```

The files that `init` wrote are yours from then on, and a newer version does not write over them. `chassis-icons init --check` reports which of them differ from what the installed version writes, such as the workflows and `AGENTS.md`, and exits 1 when one does. `chassis-icons init --only <file…> --force` writes the ones you want again; `package.json` and `CHANGELOG.md` are never written over.

```bash
pnpm exec chassis-icons init --check
pnpm exec chassis-icons init --only .github/workflows/ci.yml .github/workflows/release.yml --force
```

## Repository layout

A pnpm workspace of two packages, with the Chassis set as a submodule.

```text
packages/icons/           -> @chassis-ui/icons, the builder, published to npm
  lib/                    -> The chassis-icons command: cli.js, the modules of the build
  lib/templates/          -> The Handlebars templates of the stylesheets, of the README and of the page of a set
  templates/              -> What chassis-icons init writes into a repository of icons
  test/                   -> The tests of the build, on the fixture: the repository of icons of another team
  README.md               -> The README of the package on npm
  CHANGELOG.md            -> The changelog of the builder, written by pnpm changeset:version
packages/site/            -> The documentation site, built with Astro. Never published to npm
vendor/icons              -> Submodule: chassis-ui/website-icons, the Chassis set that CI builds and the site shows
vendor/assets.json        -> The release of chassis-ui/website-assets that has the fonts and images of the site
build/                    -> Scripts of the repository: changeset check, version references, release notes
docs/architecture.md      -> How the build works, and what it promises to write
ref/ROADMAP.md            -> The plan of this repository, its principles and decisions
.changeset/               -> The changesets of the next version
.gitmodules               -> The entry of the vendor/icons submodule
```

A repository of icons, such as `vendor/icons`, holds `source/`, `package.json` with the `chassis.build` block, the output `dist/`, `codepoints.json` and `README.md`, which the build writes and the repository commits, `chassis.checks.json` when consumers read icons by name, and the files that `init` wrote.

## Commands

Every command runs from the root. The `pnpm icons:*` scripts run the `chassis-icons` command of this checkout, `packages/icons/lib/cli.js`, on `vendor/icons`, with `--cwd vendor/icons`; `node packages/icons/lib/cli.js --help` prints the commands and the options of the build.

### The command

The package has one command, `chassis-icons`, that builds and checks a repository of icons. A team installs `@chassis-ui/icons` in a repository of its own icons and runs it there, through the scripts that `init` wrote.

| Command                       | What it does                                                                                                                                      | Script here              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `chassis-icons build`         | Writes the output: `dist/`, the registry of the code points, the README and the manifest fields                                                   | `pnpm icons`             |
| `chassis-icons verify`        | Fails when the output differs from a fresh build, an icon lost its code point, or an icon of the checks file is missing                           | `pnpm icons:verify`      |
| `chassis-icons lint-source`   | Checks the files of `source/`: names, frame, one color, no stroke, the pairs of the styles                                                        | `pnpm icons:lint:source` |
| `chassis-icons preview`       | Writes the page of the set into `preview/`, from `dist/`. With `--serve`, serves it at `http://localhost:4325/` until stopped, or at `--port <n>` | `pnpm icons:preview`     |
| `chassis-icons archive`       | Writes `<font>-web-<version>.zip` with `icons.json`, `svgs/`, `web/` and `preview/` in it, to `archives/` or `--to <dir>`. Needs `zip`            | `pnpm icons:archive`     |
| `chassis-icons release-notes` | Prints the `CHANGELOG.md` entry of a version, without its heading, and fails without one                                                          |                          |
| `chassis-icons init [dir]`    | Writes the files of a new repository of icons into a folder                                                                                       |                          |

Every command but `init` works on one repository of icons: `--cwd <dir>`, by default the nearest folder upward from the working directory whose `package.json` has a `chassis` block. The root of this workspace has none. `--verbose` says more, `--version` prints the version of the build, and the exit code is 1 when a command failed and 2 when it was not understood.

### Build

```bash
pnpm icons                  # The whole output of vendor/icons: SVG files, sprite, font, stylesheets, README and manifest
pnpm icons --dry-run        # List the files that a build would change, and change none
pnpm icons --only font      # One step: svgs, sprite, font or package
pnpm icons --verbose        # Each file that is written, and each code point that is given or retired
pnpm icons:svgs             # The step svgs: source/ optimized into dist/svgs/
pnpm icons:sprite           # The step sprite: the SVG sprite
pnpm icons:font             # The step font: the font, its stylesheets, the code points and the index of the set
pnpm icons:preview          # The page of vendor/icons, into its preview/, served at http://localhost:4325/
pnpm icons:archive          # The archive of vendor/icons, into .cache/archives/
```

A whole build removes from `dist/svgs/` each file whose source is gone, and from `dist/` and `dist/web/` each file that it did not write, such as the files of another font name. The steps after `svgs` read `dist/svgs/`, so `--only sprite` and `--only font` build from the files that are there. Nothing that `pnpm icons` writes into `vendor/icons` is committed from here: the output of the Chassis set is committed in chassis-ui/website-icons.

### Check

| Command                   | What it does                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm icons:lint:source`  | Checks each file of `source/` of `vendor/icons` against its configuration: its name, its frame, one color, no stroke, the pairs of the styles     |
| `pnpm icons:verify`       | Builds `vendor/icons` into a temporary folder and fails when a committed file differs, an icon lost its code point, or a contract icon is missing |
| `pnpm icons:test`         | The tests of the build, on the fixture in `packages/icons/test/fixture/`. `pnpm test` runs the same                                               |
| `pnpm icons:test:golden`  | Writes `packages/icons/test/golden/` again, after a change that is meant to change the output                                                     |
| `pnpm icons:lint:package` | [publint](https://publint.dev) on what npm would publish                                                                                          |
| `pnpm icons:lint`         | ESLint over the build, its tests and the scripts of `build/`. Fails on a warning                                                                  |
| `pnpm icons:typecheck`    | TypeScript over `packages/icons/lib/`, from its JSDoc                                                                                             |
| `pnpm lint:prettier`      | Formatting, across the repository                                                                                                                 |
| `pnpm spellcheck`         | Spelling of the Markdown files, with the words of `.cspell.json`                                                                                  |
| `pnpm check`              | The types of the site, `pnpm check:astro`, then `pnpm check:pnpm`: `pnpm audit --prod --audit-level moderate`                                     |

`pnpm icons:verify --since <ref>` compares the code points with those of a commit, a branch or a tag of `vendor/icons`, in place of its last tag. [CONTRIBUTING.md](.github/CONTRIBUTING.md#checks-per-changed-area) says which checks to run for which change.

### Documentation site

```bash
pnpm vendor               # Check out vendor/icons, and unpack the assets that vendor/assets.json pins into vendor/assets
pnpm dev                  # pnpm vendor, then the site at http://localhost:4324/icons/
pnpm astro:dev            # The site alone, without pnpm vendor
pnpm site:build           # pnpm vendor, the site and its search index, into _site/
pnpm astro:build          # The site alone, into _site/
pnpm site:pagefind        # The search index of _site/
pnpm build                # The same as pnpm site:build
pnpm site:test            # Build the site of a copy of the repository, for the set of vendor/icons and for the fixture
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
| `styles`         | `[]`                    | The last part a name may have, such as `["outline", "solid"]`. Any kebab-case name when empty       |
| `pairs`          | `[]`                    | The styles an icon comes in together, such as `[["outline", "solid"]]`                              |
| `startCodepoint` | `"f101"`                | The code point of the first icon of a new set, in the Private Use Area (`e000` to `f8ff`)           |
| `formats`        | `["woff2", "woff"]`     | The font formats, in the order of the `src` of the font face: `woff2`, `woff`, `ttf`                |
| `header`         | `[]`                    | The lines of the comment at the top of each stylesheet. `{version}` is the version of the package   |

`name` and `prefix` are kebab-case names. The Chassis set has `"name": "chassis-icons"`, `"prefix": "cx"`, the styles `outline`, `solid` and `brand`, and the pair of `outline` and `solid`.

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
  "contracts": [{ "reader": "the toolbar of the app", "icons": ["search-solid", "xmark-outline"] }]
}
```

### The templates

`packages/icons/lib/templates/css.hbs` and `scss.hbs` are the Handlebars templates of the stylesheets. Change them to change what the stylesheets hold, for every set. They get `name`, `prefix`, `header`, `formats`, `fontSrc`, `fontHash` and `codepoints` from the build.

`readme.hbs` is the template of the `README.md` of a set. It gets `packageName`, `description`, `homepage`, `repository` and `license` from `package.json`, `name`, `prefix`, `frame`, `styles` and `formats` from the configuration, the number of icons as `count`, and the first icon as `icon`.

`preview/` holds the template of the page of a set: `index.hbs`, written as `index.html`, and `preview.css` and `preview.js`, copied beside it. `index.hbs` gets the index of the set, `dist/icons.json`, and the name and the version of the package.

`packages/icons/templates/` holds what `chassis-icons init` writes: `AGENTS.md`, `CHANGELOG.md`, `CLAUDE.md`, `gitignore` and the two workflows of `workflows/`. A file is written once and is the repository's from then on; a change here reaches a repository made earlier only when its team runs `init --check` and `init --only <file…> --force`.

### The code points

`codepoints.json` at the root of a repository of icons is the registry of the code points, and the build is its only writer. An icon keeps its code point for as long as it is in the set. A new icon gets the next free one, and never moves another. The code point of a removed icon is retired: no later icon gets it. Commit the file with the output.

## Output

`chassis-icons build` writes one folder, `dist/`, and its shape is the same for any set. `<font>` is `name` of the configuration, `<prefix>` its `prefix`, and `<name>` the name of an icon.

| File                                             | What it holds                                                                                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dist/icons.json`                                | The index of the set: `name`, `prefix`, `frame`, `styles` and `pairs` of the configuration, and each icon with its code point, and its base and style when the set has styles |
| `dist/svgs/<name>.svg`                           | One icon, optimized, on the frame, with `fill="currentcolor"` and the class `<prefix>-<name>`                                                                                 |
| `dist/web/<font>.svg`                            | The sprite: one `<symbol>` per icon, with the id `<name>`                                                                                                                     |
| `dist/web/<font>.woff2`, `.woff`, `.ttf`         | The icon font, in the formats of the configuration                                                                                                                            |
| `dist/web/<font>.css`, `dist/web/<font>.min.css` | The font face and one class per icon, `<prefix>-<name>`. They load the font from their own folder                                                                             |
| `dist/web/<font>.scss`                           | The same for Sass, with the folder of the font, the hash and the map of the icons as `!default` values                                                                        |
| `dist/web/<font>.json`                           | The code point of each icon, by name, as a number                                                                                                                             |

Beside it, at the root of the repository, `codepoints.json`, `README.md`, and the fields of `package.json` that name the files. `files` of `package.json` publishes `dist/`. `chassis-icons preview` writes the page of the set into `preview/` from `dist/`: every icon with its name, a search box, and on a click the code that draws it. The page is not output: it is not committed, not published and not compared by `verify`. [docs/architecture.md](docs/architecture.md#output-contract) has the contract of each file.

## What reads the output

The siblings of this repository take any set that keeps the shape above. None of them names the Chassis set in a way that a team cannot configure.

| Consumer                                                    | What it reads                                                                                                                                            | How a team points it at its own set                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Chassis CSS](https://github.com/chassis-ui/css)            | An SVG file by name: `svg-icon("<name>")` is the address of `dist/svgs/<name>.svg`                                                                       | `$icon-url-prefix`, or serve `dist/svgs/` at that address |
| [Chassis React](https://github.com/chassis-ui/react)        | `<Icon name>`: the sprite symbol `#<name>`, or with `font` the class `<fontPrefix><name>`                                                                | `IconProvider`: `sprite`, `fontPrefix`, `icons`           |
| [`@chassis-ui/docs`](https://github.com/chassis-ui/website) | `/static/icons/chassis-icons.css` and the symbols of `/static/icons/chassis-icons.svg`, copied from `icons/` of the installed package of the Chassis set | The `sprite` prop of `Icon`; otherwise the Chassis set    |
| [Chassis Assets](https://github.com/chassis-ui/assets)      | The output of a set, copied into its `source/` and renamed per platform for the web, iOS and Android                                                     | A brand copies the output of its own build                |

The Chassis set also promises its names: the Chassis sites and Chassis React draw their own interface with icons of it. Those names are the `contracts` of `chassis.checks.json` of chassis-ui/website-icons.

## Branches and CI

Work goes to `develop`. CI runs there and on pull requests, with the jobs Lint, Type Check, Build, Site and Audit, and Changeset when there is something to compare with; Build and Site check out `vendor/icons`, so that the build and the site run on the Chassis set. `main` holds released versions only: the commit of a version that passed on `develop` is pushed to `main`, and that push publishes the package and creates the GitHub release. See [Releases](.github/CONTRIBUTING.md#releases).

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

The icons of the Chassis sites are `@chassis-ui/website-icons`, from [chassis-ui/website-icons](https://github.com/chassis-ui/website-icons), a repository of icons built with this package; the site of this repository shows it. The tokens of the Chassis sites are `@chassis-ui/website-tokens`, from [chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens). Chassis CSS and the site of this repository read them.

## Contributing

Branch from `develop` and open a pull request against `develop`. [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) covers the setup, changing the build and the site, changing the Chassis set, the checks to run for each, changesets and releases. [docs/architecture.md](docs/architecture.md) explains the build. [WRITING.md](WRITING.md) is the style guide of the documentation, and [AGENTS.md](AGENTS.md) holds the rules for AI coding agents. Everyone taking part follows the [Code of Conduct](.github/CODE_OF_CONDUCT.md); report a vulnerability as [SECURITY.md](.github/SECURITY.md) says.

## License

MIT License. See [LICENSE](LICENSE).
