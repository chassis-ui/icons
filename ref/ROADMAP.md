# Chassis Icons Roadmap

> **What the project is.** Chassis Icons is an icon library creator: a repository that a team
> owns, fills with its own SVG files and builds into an icon font, an SVG sprite and optimized
> SVG files, with a site that shows the set. Like `chassis-tokens` and `chassis-assets`, it is
> made to be owned and customized. The icons in it are the Chassis defaults: the set that the
> Chassis documentation sites and Figma files use, published as `@chassis-ui/icons`.
>
> **Scope:** what it takes to make it professional, production-ready and easy to adopt and to
> contribute to, in the layout and the tooling of the siblings. Written to be worked through
> over several sessions.
>
> **The specification is the adopter's journey.** Clone, replace the source SVG files, set the
> name and the prefix, run `pnpm icons`, get a library and its site. On 2026-10-05 that journey
> fails at every step after the first (see [Findings](#the-adopters-journey)). Every phase is
> judged by it, and from Phase 2 a test walks it on a fixture set.
>
> **This roadmap changes this repository only.** Work for a sibling goes to
> [Tasks for the siblings](#tasks-for-the-siblings).
>
> **Baseline:** written 2026-10-05 at `develop` `6db34f6`, version 0.3.1, 503 icons. Every
> finding was checked against the code, a full `pnpm icons` build, a build of a replaced set in
> a scratch copy, `npm pack --dry-run`, and the working copies of `chassis-tokens`,
> `chassis-assets`, `chassis-css`, `chassis-react` and `chassis-website`.

## How to use this document

1. Pick the lowest-numbered phase that still has unchecked tasks. Phases 0, 1 and 2 come
   first, in that order. Phases 3, 4 and 5 can be interleaved once Phase 2 is green. Phase 6
   is optional, and each task of it is a feature that the maintainer asks for.
2. Each phase lists its tasks as checkboxes, grouped into session-sized blocks. Tick a task
   when it is merged into `develop`, not when it is started.
3. Each phase has exit criteria. A phase is done when all of them hold.
4. Add a line to the [session log](#session-log) at the end of every session.
5. The maintainer took every open decision of [Decisions](#decisions) on 2026-10-05. A
   session that meets a new one records it there with a recommendation and goes on; one
   that changes a contract waits for the maintainer.
6. The [contracts](#the-contracts) and the [Principles](#principles) hold in every session.

## Principles

1. **Owned and customized.** A team that adopts the repository changes the source folder and
   the `chassis` configuration, never the build. So the build, its tests, the workflows and
   the code of the site name nothing of the Chassis set: no font name, no prefix, no icon
   name, no package name. What is particular to a set is data.
2. **The build stays file-driven.** A designer saves `<name>.svg` into the source folder and
   the build does the rest. No manifest and no list to maintain beside the files.
3. **The shape of the output is the contract, for any set.** `icons/<font>.{css,min.css,scss,json,svg,woff,woff2}`
   and `svgs/<name>.svg`; a sprite symbol with the id `<name>`; a font class
   `<prefix>-<name>`; an SVG root with the frame and `fill="currentcolor"`. Chassis CSS,
   Chassis React, `@chassis-ui/docs` and Chassis Assets are built to take this shape, so a set
   that keeps it is a drop-in.
4. **The default set is the first user of the toolkit.** `@chassis-ui/icons` keeps its paths,
   its prefix `cx` and its icon names. While the version is `0.x`, a change to one of them is
   a minor bump whose changeset starts with `**Breaking.**`.
5. **An icon keeps its code point.** Adding an icon never moves another. A removed icon's code
   point is retired, not given out again. A new set starts at the first code point.
6. **The output is committed, and a fresh build equals it.** As `dist/` in `chassis-tokens`:
   the site, Vercel and `chassis-assets` read the committed files. CI builds and fails on any
   difference.
7. **Rewrite the scripts, keep the tools.** SVGO, svg-sprite and Fantasticon stay. The
   scripts around them become one CLI with modules, JSDoc types and tests. Replacing a tool
   is a task of its own, with an output diff.
8. **Match the siblings in tooling, not in product.** Workspace layout, tests, CI, Changesets,
   community files, `AGENTS.md` and the docs site follow `chassis-tokens` and `chassis-assets`.
9. **Never edit generated files by hand.** The output, the golden files of the tests and the
   version references are written by commands.

## Summary

| Phase                                   | Goal                                                                       | Sessions | Depends on | Model |
| --------------------------------------- | -------------------------------------------------------------------------- | -------- | ---------- | ----- |
| [0](#phase-0-green-baseline)            | Every script runs, the documents are true, CI fails on unsynced output     | 1        | none       | Opus  |
| [1](#phase-1-workspace-layout)          | `source/`, `packages/icons` and `packages/site`; the npm package unchanged | 1 or 2   | 0          | Opus  |
| [2](#phase-2-the-build-as-a-cli)        | One configured, typed, tested CLI that builds any set; the journey test    | 3        | 1          | Fable |
| [3](#phase-3-package-and-release)       | A manifest that tools understand; a release pipeline that names no package | 2        | 2          | Opus  |
| [4](#phase-4-adopters-and-contributors) | From clone to a built library, or to a pull request, unaided               | 2        | 2          | Opus  |
| [5](#phase-5-the-docs-site)             | A site that shows any set, and pages that document the toolkit             | 3        | 1          | Opus  |
| [6](#phase-6-optional-features)         | Typed names, metadata, a Figma import: each opt-in                         | 1 each   | 2, 3       | Fable |

Fable where the design is open or a mistake reaches every consumer. Opus where the task is
specified and a check says whether it worked.

## The contracts

### What the ecosystem expects of any set

How the siblings take an icon set, found in their sources. None of them names the Chassis set
in a way that a team cannot configure.

| Consumer           | What it reads                                                                                                                                                     | How a team points it at its own set                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Chassis CSS        | An SVG file by name: `svg-icon("<name>")` returns `url($icon-url-prefix + <name> + $icon-url-suffix)`, `/static/icons/svgs/` and `.svg` by default.               | `$icon-url-prefix`, or serve `svgs/` at that address             |
| Chassis React      | `<Icon name>`: the sprite symbol `#<name>` in the file of `sprite`, or with `font` the class `<fontPrefix><name>`. Its own icons are named by purpose in `icons`. | `IconProvider`: `sprite`, `fontPrefix`, `icons`                  |
| `@chassis-ui/docs` | `/static/icons/chassis-icons.css` and `/static/icons/chassis-icons.svg#<name>`, copied from the `icons/` folder of the installed package.                         | The `sprite` prop of `Icon`; otherwise the Chassis set           |
| Chassis Assets     | The two output folders as they are, copied to `source/<brand>/<app>/icons/icons/` and `svgs/`, then renamed per platform for the web, iOS and Android.            | A brand copies the output of its own build, under the same names |

### What reads the default set

`@chassis-ui/icons` on npm. These hold at every commit of `develop`.

- The package root holds `icons/` and `svgs/`; `icons/` holds
  `chassis-icons.{css,min.css,scss,json,svg,woff,woff2}`, and the CSS loads the fonts from its
  own folder.
- The class prefix `cx-`, inside `@layer content`; the font family `chassis-icons`.
- The icon names. `@chassis-ui/docs` draws its own interface with fifteen of them
  (`search-solid`, `bars-solid`, `check-solid`, `clipboard-outline`, `sun-solid` and others),
  Chassis React defaults to twelve (`chevron-left-outline`, `xmark-outline`,
  `ellipsis-h-solid` and others), and the Figma libraries use the set by name.
- `release.yml` by that file name (npm trusted publisher), and the check names `Lint`,
  `Type Check`, `Build`, `Site` (ruleset of `main`).
- The site at `chassis-ui.com/icons`, built by Vercel with `pnpm site:build` into `_site/`,
  with its files under `icons/static/astro/` and its Pagefind index at `/icons/pagefind/`.

## Findings

Each was reproduced on 2026-10-05.

### The adopter's journey

The README's quick start, followed in a scratch copy with three SVG files in place of the 503.

| #   | Finding                                                     | Evidence                                                                                                                                                                                                                                                                                                | Phase |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| A1  | A replaced set inherits the old one.                        | `.fantasticonrc.cjs` reads the code points of `icons/chassis-icons.json`, and nothing removes an entry. The build of three icons wrote 505 entries and 505 CSS classes, 502 of them without a glyph, and gave the new icons `f2b8` and `f2f1`. `icons:check` then fails with 502 errors.                | 2     |
| A2  | The configuration that the README names does nothing.       | No code reads the `chassis` block of `package.json`; it says `iconPrefix: "chassis-icon"` and the prefix is `cx`. The font name and the prefix are written in 28 lines of ten files: `.fantasticonrc.cjs`, `svgo.config.js`, `svg-sprite.json`, both templates, four scripts, `package.json`, `ci.yml`. | 2     |
| A3  | A team's output carries Chassis's name.                     | The templates write `Chassis Icons v0.3.1`, `Copyright 2025 Ozgur Gunes` and the license address of `chassis-ui/icons` into every stylesheet. `release.yml` asks npm for `@chassis-ui/icons`.                                                                                                           | 2, 3  |
| A4  | Any file name becomes an icon.                              | `Star_Filled.svg` built to `.cx-Star_Filled` and `id="Star_Filled"`. Nothing checks the name, the frame or the color. The frame of 24 is written in `svgo.config.js`.                                                                                                                                   | 2     |
| A5  | The site does not build for another set.                    | 503 committed pages in `site/content/icons/`, each equal to what `build-pages.js` writes from the file name. `Snippets.astro` reads `svgs/<title>.svg` for every page and throws on a missing file. The generator never removes a page.                                                                 | 5     |
| A6  | The site draws its own interface with the set it documents. | `copyChassisIcons` serves the repository's set at `/static/icons/`, where the layouts of `@chassis-ui/docs` look for their fifteen icons. `HeroSection.astro`, `sidebar.yml` and `exampleIcon` name five more. A set without those names loses them.                                                    | 5     |
| A7  | The build rewrites its own input.                           | `build-svgs.js` optimizes `svgs/` in place and removes every `fill`. A file with two colors, or a failed run, changes the only copy of the artwork.                                                                                                                                                     | 1, D2 |
| A9  | The quick start removes what the site needs.                | `rm -rf .git` and `git init` leave no `vendor/assets` submodule, and `pnpm site:build` starts with `git submodule update --init vendor/assets`. The README of Phase 0 keeps the repository and renames the remote.                                                                                      | 0, 4  |
| A8  | The quick start skips what breaks.                          | It does not mention the code points, the pages or the site. Its usage examples show `your-icon your-icon-home-solid` and `@extend .your-icon`: there is no base class.                                                                                                                                  | 0, 4  |

### Build and package

| #   | Finding                                                | Evidence                                                                                                                                                                                                                                                                                                                                                                     | Phase |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| F1  | `pnpm icons:zip` fails, so `pnpm release` fails.       | `build/zip-icons.js` copies `font/chassis-icons.*`. The folder has been `icons/` since 0.1.1.                                                                                                                                                                                                                                                                                | 0     |
| F2  | The SCSS has a stale font hash.                        | `build/font/scss.hbs` hard-codes `$chassis-icons-font-hash: "cd21919f…"`. The CSS of the same build has `7d23aa5a…`. A Sass user never gets a new cache-busting query.                                                                                                                                                                                                       | 0     |
| F3  | Two SVGO configurations.                               | `svgo.config.js` for the files, another inside `svg-sprite.json` for the sprite. They already differ (`convertPathData`).                                                                                                                                                                                                                                                    | 2     |
| F4  | The build shells out and carries leftovers.            | `build-icons.js` runs `npx fantasticon` and reports npm's warnings as Fantasticon's. `icons` passes `--aggregate-output --parallel` to a Node script that ignores them.                                                                                                                                                                                                      | 0, 2  |
| F5  | No tests and no type check of the build.               | `pnpm test` is `site:build` plus a name comparison. `check-icons.js` advises `pnpm build:icons`, which does not exist.                                                                                                                                                                                                                                                       | 0, 2  |
| F6  | CI never compares the build with the committed output. | The Build job runs `pnpm icons`, then checks that seven files exist. A pull request that edits `svgs/` without rebuilding passes. The build is reproducible: `pnpm icons` on a clean tree leaves it clean.                                                                                                                                                                   | 0     |
| F7  | Two duplicates in the default set.                     | `road-outline-1.svg` and `road-solid-1.svg` equal `road-outline.svg` and `road-solid.svg` but for the class. The other 501 files follow `<name>-<outline\|solid\|brand>`, 24 by 24, one color, outline and solid paired.                                                                                                                                                     | 0     |
| F8  | The manifest is minimal.                               | No `exports`, `main` points at a CSS file. `icons:lint` reports 21 Prettier warnings in `build/` and passes.                                                                                                                                                                                                                                                                 | 0, 3  |
| F19 | A removed icon's code point is given out again.        | `getCodepoints` of Fantasticon gives a new icon the first code point that no entry of the JSON has. `f243` and `f245`, of the two icons of D6, are free since Phase 0, so the next new icon would take `f243`.                                                                                                                                                               | 2     |
| F20 | The commands of the root name the package.             | Every `icons:*` script ran `pnpm --filter @chassis-ui/icons`, and every script of the site `--filter chassis-icons-site`. With another `name` in `packages/icons/package.json`, as the quick start asks for, `pnpm icons` printed "No projects matched the filters", built nothing and ended with the exit code 0.                                                           | 3     |
| F21 | `pnpm icons:init` does not start a new set.            | The root script was `pnpm --filter <package> init`, which pnpm takes for its own command `init`: it stopped with "Unknown option: 'recursive'" and emptied nothing. The first build of a replaced set then retired every code point of the shipped set and gave the new icons the ones after them, as in A1. The journey test calls the command line directly, so it passed. | 4     |
| F9  | The source of the default artwork was not documented.  | The names and the geometry of many icons follow Font Awesome 6. D3 states the source.                                                                                                                                                                                                                                                                                        | D3    |

### Documentation and site

| #   | Finding                                          | Evidence                                                                                                                                                              | Phase |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| F10 | The README has false details.                    | "488+ icons"; `pnpm site:format` does not exist; the examples of A8.                                                                                                  | 0, 4  |
| F11 | `refs/DEVELOPMENT.md` describes 0.1.0.           | `font/`, `copy-icons.js`, the prefix `chassis-icon`, 478 icons. `refs/bootstrap-to-chassis-css.md` is about another repository.                                       | 0     |
| F12 | The home page shows a CDN address that is a 404. | `BuildSection.astro`: `cdn.jsdelivr.net/npm/chassis-icons@<v>/font/chassis-icons.min.css`. The package is `@chassis-ui/icons` and the folder is `icons/`.             | 0     |
| F13 | The site has no documentation pages.             | tokens and assets have `getting-started/` and `use-in-project/`. Here `sidebar.yml` lists pages that do not exist, and nine callouts of chassis-css are used by none. | 5     |

### Tooling, against the siblings

| #   | Finding                                             | Evidence                                                                                                                                                                | Phase |
| --- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| F14 | One package with the site beside it.                | tokens, assets, css and react are pnpm workspaces of `packages/<name>` and `packages/site`, with `source/` at the root. Here Astro is a `devDependency` of the package. | 1     |
| F15 | Missing files.                                      | `AGENTS.md`, `CLAUDE.md`, `WRITING.md`, `docs/architecture.md`, `.github/CODEOWNERS`, `.gitattributes`, a test README. `.cspell.json` exists and no script runs it.     | 4     |
| F16 | The CHANGELOG has two formats and no custom writer. | Hand-written `## [0.3.1] - date` entries; Changesets will add `## 0.4.0` with commit hashes. The siblings use `.changeset/changelog.js`.                                | 3     |
| F17 | Prettier covers part of the repository.             | `site:lint:prettier` checks `site/` only. Root Markdown, YAML and JSON are unchecked.                                                                                   | 0     |
| F18 | Local leftovers.                                    | `site/site/` and a root `.astro/` (untracked caches). The branches `app/docs`, `mundi`, `migration`, `dev/site` and `dev/css-update` are five months old.               | 0     |

## Phase 0: green baseline

One session. No layout change; what is broken or false is fixed where it is.

- [x] F1, D8: fix `build/zip-icons.js`, so that `icons:zip` and `release` run.
- [x] F2: compute the font hash in the SCSS as the CSS does. Changeset, patch.
- [x] F7, D6: remove `road-outline-1` and `road-solid-1`, their pages and entries. Changeset,
      minor, `**Breaking.**`.
- [x] F4, F5: drop the stray flags of `icons`; correct the advice of `check-icons.js`.
- [x] F8, F17: `prettier --write build`, then `eslint --max-warnings 0`. Add `lint:prettier`
      for the whole repository and run it in CI.
- [x] F6: after `pnpm icons` in the Build job, `git diff --exit-code -- icons svgs`. Confirm
      on the first run that Linux writes the bytes that macOS does. The step uses
      `git status --porcelain`, so that a new file fails it too. It passed on Linux on
      2026-10-05, in both layouts.
- [x] F12: the snippet names `@chassis-ui/icons` and `icons/`.
- [x] A8, F10: correct the usage examples, the count and the commands of the README, and
      add the steps that the quick start needs today: delete `icons/chassis-icons.json` and
      `site/content/icons/` before the first build of a new set. Phase 2 removes that need.
- [x] F11: delete `refs/DEVELOPMENT.md`; rename `refs/` to `ref/`.
- [x] F18: delete the local leftovers.

### Left for the maintainer

- `ref/bootstrap-to-chassis-css.md` (moved from `refs/`): move it to `chassis-css` or delete it.
  The maintainer deleted it on 2026-10-06.
- The stale branches of F18, local and on `origin`.

### Exit criteria

- Every script of `package.json` runs to the end on a clean checkout.
- CI fails when the committed output is not what the source builds.
- The quick start of the README, followed as written, ends in a correct build.

## Phase 1: workspace layout

The layout of `chassis-tokens`: the source at the root, the build and its committed output in
the package. Mechanical, and protected by Phase 0: the build must still leave the tree clean.

```
source/                  # the SVG files a team saves, one per icon; what an adopter replaces (D2)
packages/
  icons/                 # the published package: @chassis-ui/icons for the default set
    svgs/                # output: the optimized SVG files; committed and published
    icons/               # output: the font, its stylesheets, the sprite; committed and published
    build/               # the build (JavaScript with JSDoc types) and its templates
    test/                # Vitest tests, the fixture set and its golden output (Phase 2)
    package.json         # name, version, files, exports, the `chassis` configuration
    CHANGELOG.md  README.md  LICENSE
  site/                  # the Astro site (private): the browser of the set and the docs
build/                   # repository scripts: release notes, version references, site pages (until 5.1)
docs/                    # architecture.md (Phase 4)
ref/ROADMAP.md
vendor/assets            # git submodule of chassis-ui/assets
package.json             # the private workspace root: the commands
```

### Session 1.1: move

- [x] D2: `source/` gets the 501 files, and the build writes `packages/icons/svgs/` from
      them. The first build must write the files that are committed today (A7).
- [x] `git mv` `icons/`, the icon scripts of `build/`, `build/font/`, `.fantasticonrc.cjs`,
      `svgo.config.js` and `svg-sprite.json` to `packages/icons/`.
- [x] `packages/icons/package.json` takes the name, the version, `files`, `publishConfig`
      and the build's `devDependencies`. The root becomes private, with
      `packages: [packages/*]` in `pnpm-workspace.yaml`.
- [x] `git mv site packages/site`, with a `package.json` of its own in the pattern of
      `chassis-tokens-site`.
- [x] Root scripts keep their names (`pnpm icons`, `icons:check`, `site:build`, `dev`) and
      call the packages. `CHANGELOG.md`, a package README and `LICENSE` go to the package.

### Session 1.2: everything that names a path

- [x] The site: `copyChassisIcons`, `Snippets.astro` and the `tsconfig` aliases; `outDir`
      stays `_site/` at the root.
- [x] `vercel.json`, `.claude/launch.json`, `ci.yml`, `release.yml` (publish from
      `packages/icons`), `dependabot.yml`, `.prettierignore`, `eslint.config.js`,
      `.changeset/config.json`, `sync-version-refs.js`, `CONTRIBUTING.md`, the templates of
      `.github/`.

### Exit criteria

- `npm pack --dry-run` in `packages/icons` lists the files of `icons/` and `svgs/` that 0.3.1
  lists, less the two of D6, each byte-identical but for F2.
- `pnpm site:build` writes the same set of routes to `_site/`.
- A Vercel preview of `staging` builds, and the required checks keep their names.

All three held on 2026-10-05. The package lists the 511 files of the end of Phase 0, and the
site the same 8,701 files, with every HTML page byte-identical. Vercel built a preview of the
branch `refactor/workspace-layout` with the build command of `staging`, and `Lint`,
`Type Check`, `Build` and `Site` passed on it by those names. `staging` itself gets the commit
when the branch is merged.

## Phase 2: the build as a CLI

The rewrite. Two proofs at every step: `pnpm icons` leaves the tree clean for the default
set, and the fixture set builds with nothing of Chassis in its output.

### Session 2.1: one configuration, one entry point

- [x] A2: the `chassis` block of `packages/icons/package.json` is the configuration, and the
      build reads it: the font name, the class prefix, the frame, the styles a name may end
      in (`outline`, `solid`, `brand` for the default set; none allowed), the first code
      point, the font formats, the header of the stylesheets (A3). `.fantasticonrc.cjs` and
      `svg-sprite.json` are removed; SVGO has one configuration (F3).
- [x] F4: `build/cli.js` with `build`, `verify`, `lint-source`, `init` and `--help`; `build`
      takes `--dry-run` and `--only svgs|sprite|font`. Fantasticon and svg-sprite are called
      through their APIs. One logger; no `process.exit` inside a module.
- [x] The steps are modules: `config.js`, `optimize.js`, `sprite.js`, `font.js`,
      `codepoints.js`. None names `chassis-icons` or `cx` (Principle 1).
- [x] A1, D5, F19: the build drops the entry of a file that is gone and retires its code
      point. `pnpm icons:init` starts a new set: it empties the output and the registry, so
      the first icon gets the first code point. The registry of the default set starts with
      `f243` and `f245` retired (D6). Until then, an icon that is added to the default set
      takes `f243`: add none, or give it its code point by hand in the JSON.
- [x] F2: the `fontHash` helper, which `.fantasticonrc.cjs` registers on the Handlebars of
      Fantasticon for the SCSS template, moves to `font.js`.

### Session 2.2: tests and types

- [x] Vitest in `packages/icons/test/`. The fixture is another team's set: about eight
      icons, another font name, another prefix, another frame. Its golden output is written
      by `pnpm test:golden`. No mocks.
- [x] The journey test: copy the fixture over a copy of the repository's configuration, run
      `init` and `build`, and find no `chassis`, `cx` or Chassis icon name in the output.
- [x] Unit tests: name parsing, code point allocation and retirement, the configuration,
      the templates, `release-notes.js`, `sync-version-refs.js`.
- [x] `tsconfig.json` with `checkJs`, as `chassis-tokens`; `pnpm icons:typecheck`. A test
      README: the fixture, the golden output, how to add a case.

### Session 2.3: verify, source lint, code points

- [x] `icons:verify` builds to a temporary folder and compares with the committed output. It
      replaces the `git diff` of Phase 0 and `check-icons.js`.
- [x] A4: `icons:lint:source` checks each file against the configuration: a kebab-case name
      that ends in an allowed style, the frame, one color, no raster or script, and the
      pairs that the configuration asks for.
- [x] Principle 5: `verify` fails when an icon of the last release has another code point,
      when two icons share one, or when one is outside the Private Use Area.
- [x] D4: `chassis.checks.json`, as in `chassis-assets`, lists the icon names that the
      consumers of the default set read. `verify` fails when one is missing. A team empties
      the file or writes its own; a check without its data passes.
- [x] CI: `Lint`, `Type Check`, `Build` and `Site` keep their names. `Build` runs the tests
      on Node 22 and 24, `icons:verify` and `icons:lint:source`.

### Exit criteria

- `pnpm icons` leaves the tree clean, and the output equals that of the end of Phase 1.
- The journey test passes in CI.
- CI fails on an unsynced output, a bad file name, a moved code point and a missing
  contract name. Each has a test.

All three held on 2026-10-05: `pnpm icons` writes the 511 files of the end of
Phase 1 byte for byte, and `verify.test.js`, `lint-source.test.js` and `cli.test.js` hold a
test for each of the four failures. The journey test passed in CI on the branch, on Node.js
24 and 22, with the golden files equal on Linux and `verify` comparing with the tag `v0.3.1`.

What the sessions settled, beside the tasks:

- The configuration is `chassis.build`, as in `chassis-tokens`. Its settings are `name`,
  `prefix`, `source`, `checks`, `frame`, `styles`, `pairs`, `startCodepoint`, `formats` and
  `header`.
- `verify` compares the code points with `icons/<font>.json` of the last tag, or of
  `--since <ref>`. It also looks for the file where it was while the repository was one
  package, so the tag `v0.3.1` is a baseline already.
- The Build job runs the tests twice in one job, on the Node.js of `.nvmrc` and on 22, so
  that the check keeps the name `Build`.
- The root scripts `icons:check`, `icons:font-main` and `icons:font-min` are gone.
  `icons:verify` replaces the first, and `icons:font` writes the minified CSS too.
- `build-pages.js` and `zip-icons.js` wait for 5.1 and 3.2.

## Phase 3: package and release

### Session 3.1: the manifest

- [x] F8: `exports` with `"."` (the CSS), `"./icons/*"`, `"./svgs/*"` and
      `"./package.json"`; `main`, `style` and `sass` stay, written from the configuration.
      `sideEffects: ["*.css", "*.scss"]`. `publint` runs in CI.
- [x] A package test: `npm pack --dry-run --json` equals the expected list of files.
- [x] The package README is for someone who installs the set: the four ways to use an icon,
      and a link to the site. It is written from the configuration, so a team's package
      gets its own.

### Session 3.2: Changesets and release

- [x] F16: `.changeset/changelog.js` as in `chassis-assets`; `release-notes.js` keeps reading
      both heading styles. `build/check-changeset.js` for `source/` and the build.
- [x] A3: `release.yml` reads the package name from `package.json`, publishes from
      `packages/icons`, and runs `icons:verify` first. A team with a private package, or
      none, sets that in the configuration. The file name and the trusted publisher stay.
- [x] D8: `build/release-archives.js` attaches `<font>-<version>.zip` to the GitHub release.
- [x] A prerelease, `0.4.0-next.0`, goes through the whole pipeline once before 0.4.0.

### Left for the maintainer

- S2, now that `@chassis-ui/icons@next` is `0.4.0-next.0`. A problem it finds is fixed with
  a changeset and another prerelease, `0.4.0-next.1`, by `pnpm changeset:version` alone.
- `pnpm changeset pre exit` before the version step of 0.4.0. Until then the repository is
  in the prerelease mode of Changesets, and every version step makes a prerelease.

### Exit criteria

- `publint` passes, and a scratch project resolves `@chassis-ui/icons/icons/chassis-icons.css`
  and `/svgs/<name>.svg` from the packed tarball with Vite and with Sass.
- A version reaches npm and GitHub with one command on `develop` and one push to `main`.
- No workflow names `@chassis-ui/icons`.

All three held on 2026-10-05. `pnpm changeset:version` on `develop`, after one
`pnpm changeset pre enter next`, made `0.4.0-next.0`, and the push of that commit to `main`
published it: npm has the version on the dist-tag `next`, with 511 files and a provenance
statement, and `latest` stays `0.3.1`. The tag `v0.4.0-next.0` is on the commit, and its
GitHub release has `chassis-icons-0.4.0-next.0.zip` attached. A scratch project installed
`@chassis-ui/icons@next` from npm and built with Vite, with Sass by load path and with the
package importer of Sass.

What the sessions settled, beside the tasks:

- `"."` of `exports` has three conditions: `sass` gives the SCSS, `style` and `default` the
  CSS. So `import '@chassis-ui/icons'` in a bundler loads the stylesheet, and
  `@use 'pkg:@chassis-ui/icons'` its Sass source.
- `files` is `icons/<font>.*` and `svgs/*.svg`: every file of the font name, in any format
  of the configuration, and not the preview page.
- The Sass example of the README names the file with its extension,
  `@use '<package>/icons/<font>.scss'`. The package importer of Sass refuses the path without
  one, since `icons/` holds a `.css` and a `.scss` of that name. A load path and Vite take
  both forms. 5.3 writes this into `use-in-project/`.
- The example icon of the README is the first of the set, and its first paragraph is
  `description` of the manifest. `homepage` of the default set is `chassis-ui.com/icons/`.
- The build writes the manifest only when one of its fields changes, and keeps the text of
  a manifest that is in sync, whatever its indentation.
- The archive holds `icons/` and `svgs/` at its top level, as the package does. The archive
  of `zip-icons.js` had the files of `icons/` at the top of a folder `<font>-<version>/`.
- `release.yml` asks two questions apart: whether npm has the version, and whether the tag
  exists. A run that published and failed before the GitHub release can be run again.
- The job of `release.yml` is `Release`, as in `chassis-assets`. No setting outside the
  repository reads the names of its jobs.
- `pnpm icons:zip` is gone. `pnpm release:archives`, `pnpm release:notes` and
  `pnpm changeset:check` are the commands of the root `build/`.

## Phase 4: adopters and contributors

### Session 4.1: accurate documents

- [x] A8, F10: the root README is rewritten from `package.json` and the CLI's `--help`: what
      the project is, the quick start that the journey test walks, the layout, the commands,
      the configuration, the shape of the output and who reads it.
- [x] `docs/architecture.md`: the pipeline, the output contract of each file, the code
      points, the contracts with the siblings, the known oddities.
- [x] `CONTRIBUTING.md`: adding an icon to the default set (`pnpm icons`,
      `pnpm icons:verify`, `pnpm changeset`); changing the build; a table of checks per
      area. A section on taking a newer build into an adopted copy.

### Session 4.2: community files and agent rules

- [x] F15: `AGENTS.md` in the pattern of `chassis-tokens` (project, commands, checks per
      area, rules, cautions, reference docs) and `CLAUDE.md` with `@AGENTS.md`.
- [x] `WRITING.md` from `chassis-tokens`, adjusted; `.github/CODEOWNERS`; `.gitattributes`.
- [x] The issue forms and the pull request template name the new commands.
- [x] `pnpm spellcheck` with `.cspell.json`, in the Lint job.

### Exit criteria

- Someone new builds a library from their own SVG files with the README only, and adds an
  icon to the default set with `CONTRIBUTING.md` only.
- Every command, path and option in a document exists as written.

Both held on 2026-10-06, as far as a session can be someone new. The six steps of the README
were run as written in a fresh clone, with eight icons on another frame, in other styles and
under another font name: `pnpm icons:verify` and the tests passed in it. The steps of
"Changing icons" were run in another clone for a new pair of icons. A script read the
documents for every `pnpm` script, relative link, anchor and path of the repository in them,
and found each one.

What the sessions settled, beside the tasks:

- The quick start has two steps it did not have. The tags of a clone are the releases of the
  Chassis set, and `verify` compares the code points with the last tag, so an adopter deletes
  them. The changesets of a clone name `@chassis-ui/icons`, so an adopter deletes them too.
- A newer build is taken into an adopted copy by folder, with `git restore --source`, and not
  by a merge: a merge brings the new icons of the Chassis set into `source/`. Two files are
  shared and merged by hand: the root `package.json` and that of the package.
- `WRITING.md` covers the repository docs now, and its structure rules are the plan for the
  pages of 5.3: the site has no documentation pages yet.
- The spellcheck leaves out the icon pages and the golden files, which are written from the
  names of the icons.
- `.gitattributes` checks out every text file with LF, since the output and the golden files
  are compared byte for byte, and marks what a command writes as generated for GitHub.
- `AGENTS.md` holds the nine principles as rules, and one of its own from F21: a root script
  runs a package script with `run`.
- Shell blocks are tagged `bash` in every document, the README of the package included.

## Phase 5: the docs site

Can start after Phase 1. Session 5.1 needs the configuration of 2.1.

### Session 5.1: a site for any set

- [x] A5: the icon pages come from a content loader over the output of the build. The 503
      MDX files and `build-pages.js` are removed. Same routes, same titles.
- [x] A6, D7: the interface of the site reads the Chassis set from the installed
      `@chassis-ui/icons` at `/static/icons/`, as every sibling site does. The set of the
      repository is served from an address of its own, and the browser pages read it.
- [x] The font name, the prefix and the example icons of the pages come from the
      configuration and `config.yml`. The snippets are read from the output, not typed.
- [x] The journey test builds the site for the fixture set.

### Session 5.2: clean

- [x] F13: remove the unused callouts; `sidebar.yml` lists pages that exist.
- [x] The home page says what the project is: a creator, with the Chassis defaults as its
      example.

### Session 5.3: documentation pages

In the sections of the siblings.

- [x] `getting-started/`: introduction, quick start, the build system and its configuration.
- [x] `icon-design/`: the frame, one color, the names and the styles, the source lint.
- [x] `use-in-project/`: the icon font, the sprite, the SVG files and Sass on the web; with
      Chassis CSS (`$icon-url-prefix`), with Chassis React (`IconProvider`), and through
      Chassis Assets for iOS and Android; publishing a library.
- [x] `site:lint:html`, the link check and the style guide pass.

### Exit criteria

- `pnpm site:build` passes for the default set and for the fixture set.
- Every sidebar entry leads to a page, and every page passes `WRITING.md`.
- Adding an icon to the default set changes `source/` and the output, and no other file.

All three held on 2026-10-06. `pnpm site:test` builds the site of a copy of the repository
for the default set and for the fixture, and `pnpm site:build`, `pnpm site:lint:html` and
`pnpm site:lint:vnu` pass for the default set. The sidebar fails the build on an entry
without a page, and the test follows every link of the built pages. A pair of icons was
added in a scratch clone: `git status` named the two files of `source/` and files of
`packages/icons/`, and the site had their two pages.

What the sessions settled, beside the tasks:

- The site reads the set as a consumer does, and by folder: `src/libs/set.ts` reads
  `../icons` with `config.js` and `names.js` of the build. A page is bundled and cannot read
  a file, so the font name, the prefix, the frame and the addresses reach it as
  `virtual:icon-set`, and the icons as the `icons` collection, with the SVG markup and the
  code point of each.
- The set of the repository is served from `/icons/static/set/`, in the two folders of the
  package (D7). `SetIcon.astro` draws an icon of it, and `<Icon>` of `@chassis-ui/docs` an
  icon of the interface. `/static/icons/` no longer holds the SVG files: the installed
  package gives its `icons/` folder only, as on the sibling sites.
- `exampleIcon` of `config.yml` is optional: the first icon of the set without it, and an
  error that names the key with an icon that the set does not have.
- The test of the site is `packages/site/test/journey.test.js`, in the Site job of CI, since
  it needs the build of `vendor/assets`. It copies the repository into `.cache/`, and links
  the installed packages. Besides the journey it checks what no other check does: that every
  icon a page draws is in the sprite it names, the interface included, and that every link
  leads to a page and a heading that exist. Both were broken on purpose once, and the test
  failed on each.
- The home page takes its texts from data: the name of the set from the font name, the
  headline and the lead from `config.yml`, and what the set is from `description` of the
  package. It shows a CDN address for a published package only.
- The documentation pages show code and draw no icon, so that they build for any set. Each
  HTML, CSS and Sass sample was run against the output in a browser or with Sass. The
  quick start of the site is the README's, with the same six steps.
- Found while writing the Chassis CSS page: configuring `$icon-url-prefix` through
  `config/defaults`, as its documents show for other variables, fails in Sass. The page
  uses `config/settings`, which works (S4).

## Phase 6: optional features

Each is opt-in, has a session of its own, and leaves the default output untouched.

- **Typed names.** A `.d.ts` and an ESM list of the names of a set.
- **Curated metadata.** Categories, tags and aliases in a file beside the source, for the
  search of the site. An icon without an entry still builds.
- **Figma import.** A script that saves the icon frames of a Figma library into `source/`.
- **More font formats.** TTF for apps, by the configuration.
- **Visual regression.** Render the font and the sprite and compare with the SVG files.
- **Drop WOFF** from the default set, once no consumer reads it. Breaking.

## Decisions

| #   | Decision                                                                                      | Outcome                                                                                                                                                                                                                                                                                                                                                                                                                | Owner      | Status             |
| --- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------ |
| D1  | What the repository is.                                                                       | An icon library creator, owned and customized as tokens and assets are. The icons in it are the Chassis defaults for the docs sites and the Figma files.                                                                                                                                                                                                                                                               | maintainer | decided 2026-10-05 |
| D2  | Where the source is: a `source/` folder at the root, or `svgs/`, optimized in place as today. | `source/`, as tokens and assets: an adopter replaces one folder that the build only reads (A7), and `verify` is output against source. It costs a second copy of each SVG in Git.                                                                                                                                                                                                                                      | maintainer | decided 2026-10-05 |
| D3  | The source and the license of the default artwork (F9).                                       | The set is a collection of icons modified from free libraries, mostly Font Awesome, and of originals. No license notice is added.                                                                                                                                                                                                                                                                                      | maintainer | decided 2026-10-05 |
| D4  | Where the names that consumers of the default set read are kept.                              | `chassis.checks.json` at the root, as in `chassis-assets`. Data, so that the build names no icon.                                                                                                                                                                                                                                                                                                                      | session    | decided 2026-10-05 |
| D5  | How a new set starts, and where retired code points are kept.                                 | An explicit `icons:init`. Retired code points in the registry JSON under a key that the templates skip, if no consumer iterates the file blindly; check `Snippets.astro` and `chassis-assets`.                                                                                                                                                                                                                         | session    | decided 2026-10-05 |
| D6  | Remove `road-outline-1` and `road-solid-1`.                                                   | Remove, as a breaking minor. Task W7 of the roadmap of `chassis-assets` asks for it.                                                                                                                                                                                                                                                                                                                                   | maintainer | decided 2026-10-05 |
| D7  | The address of the repository's set on its own site.                                          | `/static/icons/` stays the installed Chassis set, through an npm alias, since the workspace holds a package of that name. The set of the repository gets `/icons/static/set/` or similar.                                                                                                                                                                                                                              | session    | decided 2026-10-05 |
| D8  | A ZIP archive on each GitHub release.                                                         | Yes, as `chassis-assets` does: fix the script in Phase 0, attach the archive in session 3.2.                                                                                                                                                                                                                                                                                                                           | session    | decided 2026-10-05 |
| D9  | Keep Fantasticon (`fantasticon`), svg-sprite 3.0.0-rc3 and SVGO 4.                            | Keep through Phase 3. An upgrade or a replacement is a task with an output diff. SVGO went from 3 to 4 on 2026-10-06, with no change of the output. Fantasticon went from the fork `@twbs/fantasticon` 3 to the original `fantasticon` 4 on the same day: the same glyphs, in another order.                                                                                                                           | session    | decided 2026-10-05 |
| D11 | Where the registry of the code points is (D5 left it open).                                   | `packages/icons/codepoints.json`: the code point of each icon and the retired ones, in hexadecimal, written by the build and committed. `icons/<font>.json` keeps its shape and is output only, so `verify` can build into a temporary folder, and no consumer meets a key that is not an icon.                                                                                                                        | session    | decided 2026-10-05 |
| D10 | Brands or several sets in one repository.                                                     | No. One repository builds one set; a brand builds its own and copies the output to `chassis-assets`, as its icons page says.                                                                                                                                                                                                                                                                                           | session    | decided 2026-10-05 |
| D12 | What a team sets for a private package, or for none (A3).                                     | `package.json` of the package, which npm reads too: `"private": true` publishes nothing, and the release is the tag, the GitHub release and its archive; `publishConfig.access` and `publishConfig.provenance` say how npm publishes. The workflow publishes to npmjs.com only: another registry needs a token, which is a setting of the repository and not of the package, so it is a documented change to one step. | session    | decided 2026-10-05 |
| D14 | The tag of an icon whose style the page generator did not know.                               | The style of the configuration. `build-pages.js` knew `outline` and `solid`, and tagged every other icon `default`, so the brand icons of the default set were at `/icons/tag/default/`. They are at `/icons/tag/brand/` now. Every other route and every title is as it was: 650 pages compared.                                                                                                                      | session    | decided 2026-10-06 |
| D15 | The address of the documentation pages.                                                       | `/icons/docs/`, by `docsPath`, as `/tokens/docs/` and `/assets/docs/`. The icon pages stay at `/icons/<name>/`.                                                                                                                                                                                                                                                                                                        | session    | decided 2026-10-06 |
| D13 | Which fields of the manifest the build owns.                                                  | `main`, `style`, `sass`, `files`, `exports` and `sideEffects`, written by the `package` step of the build and compared by `verify`. An entry of `files` or `exports` that is not about `icons/` or `svgs/` is the team's and is kept, so a later feature can add an entry. The README of the package is output too, from a template, and names nothing but what the manifest and the configuration say.                | session    | decided 2026-10-05 |

## Tasks for the siblings

| #   | Repository      | Task                                                                                                                                                                                                                                                                | Blocks  | Status |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| S1  | chassis-assets  | After the release with D6: refresh `source/default/{docs,demo}/icons/` by its own steps, and close W7 of its roadmap.                                                                                                                                               | nothing | open   |
| S2  | chassis-website | Build `examples/vanilla-html` and a site against the prerelease of 3.2, for the `exports` map.                                                                                                                                                                      | 3.2     | open   |
| S3  | chassis-css     | When 5.3 is published: link "build your own set" from `content/icons.mdx`, which describes the package only.                                                                                                                                                        | nothing | open   |
| S4  | chassis-css     | `@use "…/config/defaults" with ($icon-url-prefix: …)` stops with "This module was already loaded": `functions/color` loads `config/settings` first. Configuring `config/settings` works. Fix the load order, or document it for the variables of `_settings.scss`.  | nothing | open   |
| S5  | chassis-website | `<Icon font>` of `@chassis-ui/docs` writes the class with `cx-`, and `<Example>` shortens only the address of the Chassis sprite. A `fontPrefix`, as Chassis React has, would let a site draw another set with the shortcode. This site has `SetIcon.astro` for it. | nothing | open   |

## Session log

| Date       | Session         | What was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-05 | review          | Reviewed the repository against tokens, assets, css, react and the website. Ran `pnpm icons` (clean tree after), `icons:check` (passes), `icons:lint` (21 warnings), `icons:zip` (fails). Wrote this roadmap. No code changed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-05 | revision        | The maintainer decided D1: a creator, not a library. Read how Chassis CSS, Chassis React, `@chassis-ui/docs` and Chassis Assets take a set, and built a replaced set of three icons in a scratch copy (A1 to A8). Rewrote the roadmap around the adopter's journey. No code changed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-05 | decisions       | The maintainer took D2 to D10 by their recommendations, and stated the source of the default artwork (D3): icons modified from free libraries, mostly Font Awesome, and originals, with no license notice. The tasks that waited on them were updated. No code changed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-05 | 0               | Phase 0, on the branch `chore/roadmap-phase-0`, not merged yet. Fixed `icons:zip` (F1), the font hash of the SCSS (F2, with a `fontHash` template helper), the flags and the advice (F4, F5). Removed `road-outline-1` and `road-solid-1`: 501 icons, no other code point moved (F7). `icons:lint` fails on a warning, `lint:prettier` covers the repository and runs in CI (F8, F17). The Build job fails on an output that differs (F6): its first run on Linux is still to be read. Corrected the CDN snippet (F12) and the README (A8, F10), whose quick start was walked in a scratch copy with three icons: three entries from `f101`, and a site of 13 pages. `.fantasticonrc.cjs` now starts an empty registry when the JSON is gone. Deleted `refs/DEVELOPMENT.md`, moved `refs/` to `ref/` (F11), deleted the two caches (F18). Two changesets. Ran `release`, `site:lint`, `site:lint:html`, `site:lint:fusv`, `check` and `icons:check`: all pass. Found A9 and F19.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-10-05 | 1.1, 1.2        | Phase 1, on the branch `refactor/workspace-layout`, on top of Phase 0, not merged yet. `source/` holds the 501 SVG files, and `build-svgs.js` reads it, writes `packages/icons/svgs/` and removes a file there whose source is gone (A7). The package, with its build, its output, its CHANGELOG, a README and the LICENSE, is `packages/icons`; the site is `packages/site`, named `chassis-icons-site`, and takes the package as `workspace:*`, so `copyChassisIcons` finds it by name. The root is private and keeps every script name. `build-pages.js` stays in the root `build/` until 5.1, and `icons:zip` writes its archive into `packages/icons/`. Updated CI, the release workflow (publishes from `packages/icons`), Dependabot, the ignore files, ESLint, Changesets, the version and release-notes scripts and the documents. Dropped `tinycolor2` and the `@icons/*` alias: nothing used them. The lockfile resolves no new version. `pnpm icons` leaves the tree clean, and `release`, `site:lint`, `site:lint:html`, `check`, `icons:check`, `icons:lint` and `lint:prettier` pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-05 | 0, 1: checks    | Pushed `chore/roadmap-phase-0` and `refactor/workspace-layout` and ran CI on each by hand. `Lint`, `Type Check`, `Build`, `Site` and `Audit` passed on both, and the Build job found the committed output equal to what Linux builds (F6). The Changeset job does not run on a manual run: it first runs in the new layout on the pull request or the push to `develop`. Vercel built a preview of the Phase 1 branch: the home page, an icon page, the stylesheet and an SVG file answer 200, and the page of `road-outline-1` 404. Neither branch is merged yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-05 | 2.1, 2.2, 2.3   | Phase 2, on the branch `feat/build-cli`, after Phase 0 and Phase 1 were merged into `develop` and CI passed there. The build is `packages/icons/build/cli.js` with `build`, `verify`, `lint-source` and `init`, read from the `chassis.build` block; svg-sprite, Fantasticon and clean-css are called through their APIs, and a whole build takes under two seconds. The output of the default set did not change by a byte. `codepoints.json` is the registry, with `f243` and `f245` retired (D11, F19). `chassis.checks.json` lists the sixteen icons that `@chassis-ui/docs` reads and the eleven of Chassis React (D4). 120 tests in `packages/icons/test/` build the fixture set `acme-glyphs` against golden files, walk the journey of an adopter, and cover the four failures of the exit criteria. `pnpm icons:typecheck` passes. The README and CONTRIBUTING describe the new commands.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-05 | 3.1, 3.2        | Phase 3 but for its prerelease, on the branch `feat/package-release`, not merged yet. The build has a fourth step, `package`: it writes `main`, `style`, `sass`, `files`, `exports` and `sideEffects` of the manifest and the README of the package from the configuration, and `verify` compares both (D13). The 511 packed files did not change. `pnpm icons:lint:package` runs publint, in the Build job too. A scratch project installed the packed tarball and built with Vite, with Sass by load path and with the package importer of Sass. `release.yml` reads the name, the version and `private` from the manifest, publishes unless npm has the version, and creates the GitHub release unless the tag exists, with `<font>-<version>.zip` of `build/release-archives.js` attached (D8, D12). `.changeset/changelog.js` writes the entries, and `build/check-changeset.js` asks for a changeset when `source/`, the build or the output changed. The root scripts find the packages by folder (F20). 145 tests. A scratch clone went through `changeset pre enter next` and `pnpm changeset:version` to `0.4.0-next.0`, then `verify`, the release notes, the archive, publint and `npm publish --dry-run`, and through `pre exit` to `0.4.0`. Nothing was pushed or published: the prerelease waits for the maintainer.                                                                                                                                                                                                                                                                                                |
| 2026-10-05 | 3.2: prerelease | The maintainer asked for the prerelease. Pushed `feat/package-release` and ran CI on it by hand: `Lint`, `Type Check`, `Build`, `Site` and `Audit` passed. Fast-forwarded `develop` to it, ran `pnpm changeset pre enter next` and `pnpm changeset:version`, and pushed `develop` with the commit `chore(release): 0.4.0-next.0`; the push carried Phase 2 too, which `origin/develop` did not have yet. Every check and the new Changeset job passed on that commit. Both runs needed their jobs run again: GitHub had an incident, and cancelled each job that got no runner in 15 minutes. The maintainer pushed the commit to `main`, and `release.yml` published `@chassis-ui/icons@0.4.0-next.0` to the dist-tag `next`, with provenance from `publishConfig`, and created the release `v0.4.0-next.0` with its archive. Read from npm, from the tag and from the address of the archive; the session could not read the run of the workflow itself. Phase 3 is closed. The repository stays in the prerelease mode of Changesets until 0.4.0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-06 | 4.1, 4.2        | Phase 4, on the branch `docs/adopters-contributors`, not merged yet. Walked the quick start in a scratch clone before rewriting it, and found F21: `pnpm icons:init` ran `pnpm init`. Every root script now runs a package script with `run`, and a test holds them to it. The journey test read `source` from the manifest and failed in a copy whose configuration leaves the setting out: it reads the configuration now. Rewrote `README.md` around the journey: the six steps of a set of your own, the commands, the configuration, the output and who reads it. Wrote `docs/architecture.md`, `AGENTS.md` with `CLAUDE.md`, `WRITING.md` from the guides of tokens and assets, `.github/CODEOWNERS` and `.gitattributes`. `CONTRIBUTING.md` has the checks per changed area, a section on the documents, and how to take a newer build into an adopted copy, which was rehearsed from the commit of Phase 2 to that of Phase 3. `pnpm spellcheck` runs cspell over the Markdown files, in the Lint job. The issue forms and the pull request template name the commands of today. The scratch clone with a set of eight icons went through the six steps, a first version with Changesets, and 146 passing tests.                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-06 | 5.1, 5.2, 5.3   | Phase 5, on the branch `feat/docs-site`, merged into `develop`. The 501 icon pages and `build/build-pages.js` are gone: a content loader makes a page per icon from the output of the build, and the routes and titles of the 650 built pages are those of before, but for the tag of the brand icons (D14). The site reads the set by folder and names none: `src/libs/set.ts`, `virtual:icon-set`, `SetIcon.astro`, and the set at `/icons/static/set/`. Its interface is drawn with the published `@chassis-ui/icons`, through an npm alias (A6, D7). `pnpm site:test`, in the Site job, builds the site of a copy of the repository for the default set and for the fixture, and checks the icons that each page draws and every link. Removed the nine callouts and the sidebar of pages that did not exist (F13); the home page takes the name of the set, its texts and its examples from the configuration. Wrote fourteen pages in `getting-started/`, `icon-design/` and `use-in-project/` by `WRITING.md`, under `/icons/docs/` (D15), each sample run against the output. Updated the README, CONTRIBUTING, the architecture document, the agent rules and the style guide. `site:build`, `site:lint:html`, `site:lint:vnu`, `site:test`, `check:astro`, the lints, the spellcheck, `icons:test` and `icons:verify` pass. Found S4 and S5. Rehearsed in a scratch clone: a new pair of icons changed `source/` and `packages/icons/` only and had its two pages, and a copy at the commit before took the build and the code of the site with the command of CONTRIBUTING.md and built its site, with its old content. |
| 2026-10-06 | dependencies    | Reviewed the six pull requests of Dependabot and merged them, five on the branch `chore/dependabot-updates`: the group of minor and patch updates, `eslint-plugin-unicorn` 76, `eslint-plugin-astro` 3, `prettier-plugin-astro` 1 and SVGO 4 (D9, after Phase 3). The lockfile was resolved again for each merge and holds no version that a pull request did not bring. SVGO 4 builds the 501 icons and the fixture byte for byte as SVGO 3 did: `icons:verify` and the golden output pass. It has no `removeViewBox` in `preset-default` and warned about the override for every file, so `optimize.js` lost it, with an empty changeset. `prettier-plugin-astro` 1 formats an Astro file for the `compressHTML` of Astro 7, which the site leaves at its default: fourteen files of the site were formatted again, and of the 666 built pages only the home page changed, by white space inside three paragraphs. Every check of AGENTS.md passes on the branch. The update of `@types/node` to 26 was held back at first, since tokens and assets type-check their builds against Node.js 22, the oldest version that `engines` allows. The maintainer decided to merge it, as css and react did: the Build job still runs the tests on Node.js 22.                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-06 | fantasticon     | The maintainer asked for the original Fantasticon in place of the fork of Bootstrap (D9), on the branch `chore/fantasticon-original`, not pushed. `fantasticon` 4.1.0 has newer versions of the libraries that draw the font, and `font.js` calls it as it called the fork. Every glyph of the default set and of the fixture keeps its outline, its width and its code point: the committed fonts were read table by table and compared by code point. Fantasticon 4 finds the files with a glob that does not sort, and writes the glyphs in that order, which is the reverse of the names on macOS and on Linux. So the fonts and the hash of the stylesheets changed, with a patch changeset, and the golden output was written again. `verify` ran in a Linux container on a copy of the working tree: the output that macOS built is what Linux builds. The tests of the build passed there too, but for the one of the archive: the image has no `zip`. Not tried on Windows. The checks of the build and of the site pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-07 | css grid        | Step 7.4 of the CSS grid plan of `chassis-css`, whose 0.7 removes the flexbox grid, `.row` with `.col-*`; on `develop`, not pushed. The site takes `@chassis-ui/css` 0.6.0 and `@chassis-ui/docs` 0.7.0, whose layouts are on `.grid` already. The seven sections of the home page, the three components of an icon page and the browse page moved off the flexbox grid: a `grid` with `col-span-*` for a header and for a text beside its example, with `grid-cols-*` for the cards, the list of the icons and the code points of an icon, and `lg:w-6/12` under the hero. The list keeps its six columns from 1024 px: `xl:row-cols-8` never had a rule in Chassis CSS, and `xl:grid-cols-8` would give the eight it asked for. The message of a search with no result spans the columns. Three builds were measured on 33 pages at six widths, before, with the new packages, and after: no page has a flexbox grid class, and every icon tile, card and page of the docs is where it was. From 1024 px the gutter is the token of the breakpoint and not 1.5rem: the headers are 1 to 8 px narrower, a text beside its example 5 to 16 px, and at 1300 px one paragraph of the home page takes a third line. The footer moves by up to 20 px, which is docs 0.7.0. `preview.html` is the page of svg-sprite, with no class of Chassis CSS. The checks of the site, `site:test` and `check:pnpm` pass. Seen and left: an icon page scrolls sideways by 4 px at 375 and 600 px, before and after, where the last button group of its examples is wider than its row.                                                             |
