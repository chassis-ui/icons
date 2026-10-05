# Contributing to Chassis Icons

Thanks for taking the time to contribute. This doc covers dev setup, conventions, and what a pull
request needs before it can be merged. For the build details it links to the
[README](../README.md), rather than repeating them.

## Dev setup

You need Node.js 22.12 or later (`.nvmrc` names the version that CI uses, 24), pnpm (the version
in `packageManager` of `package.json`; `corepack enable` picks it up), Git and
[Git LFS](https://git-lfs.com).

```sh
git clone https://github.com/chassis-ui/icons.git chassis-icons
cd chassis-icons
pnpm install
```

The repository is a pnpm workspace: the package `@chassis-ui/icons`, its documentation site,
and the source of the icons at the root.

- [`source/`](../source/) holds one SVG file per icon. It is the source of everything else,
  and the build only reads it.
- [`packages/icons/`](../packages/icons/) is the package that is published to npm. Its
  `svgs/` holds the optimized SVG files, and its `icons/` the SVG sprite, the icon font and
  its CSS and SCSS. The build writes both folders, both are committed, and both are
  published. `codepoints.json` is the registry of the code points, written by the build and
  committed. Its `build/` holds the build and the templates of the font's stylesheets, and
  its `test/` the tests of the build. The `chassis.build` block of its `package.json` is the
  configuration of the set: the build itself names no font, no prefix and no icon.
- [`packages/site/`](../packages/site/) holds the Astro documentation site, with one page
  per icon in `packages/site/content/icons/`. It is never published to npm.
- [`build/`](../build/) holds the scripts of the repository: the pages of the site, the
  release notes and the version references.
- [`chassis.checks.json`](../chassis.checks.json) lists the icons that the Chassis sites and
  Chassis React read by name. `pnpm icons:verify` fails when one is missing.
- [`vendor/assets`](../vendor/) is the chassis-assets submodule, with the fonts and images of
  the site. `pnpm site:build` checks it out at the pinned commit and builds it, which needs
  Git LFS. `pnpm sync-submodules` moves the pin to the latest `app/docs`.

Run every command from the root. `pnpm dev` starts the site on port 4324; run `pnpm vendor`
once before it, so that the submodule is built.

## Branch and commit conventions

`develop` is the integration branch: branch from it, and open pull requests against it. `main`
holds released versions only; pushing it publishes to npm (see [Releases](#releases)). `staging`
is for previews of the site: a maintainer pushes `develop` to it when one is wanted, and no
workflow runs on it.

Commits follow a loose `<type>(<scope>): <description>` convention:

- **Types in use**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.
- **Scopes in use**: `icons` for the icons and their build, `site` for the documentation site;
  omitted for changes that span both or neither.

Branch names aren't templated; name yours descriptively (for example `feat/calendar-icons`).

## Changing icons

1. Add, change or remove the SVG file in `source/`. An icon is drawn on a 24 by 24 frame, in one
   color, and is named in kebab-case with its style as the last part: `<name>-outline`,
   `<name>-solid` or `<name>-brand`. An outline icon comes with its solid one. Run
   `pnpm icons:lint:source`, which checks all of this.
2. Run `pnpm icons`. It optimizes the SVG files with SVGO into `packages/icons/svgs/`, and
   writes the sprite, the font and its stylesheets to `packages/icons/icons/`. A new icon gets
   a code point of its own in `packages/icons/codepoints.json`; the code points of the other
   icons stay as they are. The code point of a removed icon is retired there, and no later
   icon gets it.
3. Run `pnpm site:pages`. It writes the page of each new icon to
   `packages/site/content/icons/`, with
   `categories` and `tags` taken from the file name: correct them where they are wrong. Delete
   the page of an icon that you removed.
4. Run `pnpm icons:verify`. It builds into a temporary folder and fails when a committed file
   is not what the source builds, when an icon lost its code point, or when an icon of
   `chassis.checks.json` is missing.
5. Look at the result in `packages/icons/icons/preview.html`, or on the site with `pnpm dev`.
6. Commit `source/`, `packages/icons/` and the pages together, with a
   [changeset](#changesets).

Renaming or removing an icon breaks every project that uses it: say so in the changeset.

## Changing the build

The build is `packages/icons/build/cli.js` and the modules beside it:
`node packages/icons/build/cli.js --help` shows its commands. It is JavaScript with JSDoc
types, checked with `pnpm icons:typecheck`, linted with `pnpm icons:lint`, which fails on a
warning, and formatted with Prettier: `pnpm lint:prettier` checks the whole repository.

`pnpm icons:test` runs the tests in `packages/icons/test/`. They build the set of another
team, the fixture, and compare the result with the golden files; see the
[README of the tests](../packages/icons/test/README.md). A change that is meant to change the
output writes the golden files again with `pnpm icons:test:golden`, and changes the output of
the default set too: run `pnpm icons` and commit both with the change.

No module of the build names a font, a prefix or an icon. What is particular to a set goes
into the `chassis.build` block of `packages/icons/package.json` or into
`chassis.checks.json`.

## Changing the site

The site uses the layouts and components of
[`@chassis-ui/docs`](https://github.com/chassis-ui/website/tree/main/packages/docs). Its own
pages, components and styles are in `packages/site/src/`, and its settings in
`packages/site/config.yml`.

```sh
pnpm site:lint:eslint      # ESLint
pnpm site:lint:stylelint   # Stylelint
pnpm lint:prettier         # Prettier, on the whole repository
pnpm check:astro           # Types
pnpm site:build            # The same build as Vercel: vendor/assets, Astro and Pagefind
pnpm site:lint:html        # html-validate, on the built site
pnpm site:lint:vnu         # The Nu Html Checker, on the built site. Needs Java
pnpm astro:preview         # The built site, as it is deployed
```

The files that Astro builds are written to `_site/icons/static/astro/` and requested from that
path, and the shared CSS, fonts and icons from `/static/`. Keep `build.assets` and the name
patterns of `packages/site/astro.config.ts` on the same folder.

## What a pull request needs before merge

CI runs these jobs on every pull request, and on every push to `develop`:

- **Lint**: `pnpm icons:lint`, `pnpm site:lint:eslint`, `pnpm site:lint:stylelint` and
  `pnpm lint:prettier`.
- **Type Check**: `pnpm icons:typecheck` and `pnpm check:astro`.
- **Build**: `pnpm icons:lint:source`, `pnpm icons:test` on the Node.js of `.nvmrc` and on
  Node.js 22, and `pnpm icons:verify`. It fails when the committed output is not what the
  source builds: run `pnpm icons` and commit the result.
- **Site**: `pnpm site:build`, then `pnpm site:lint:html` and `pnpm site:lint:vnu`.
- **Changeset**: a change to `icons/` or `svgs/` of `packages/icons/` has a changeset.
- **Audit**: `pnpm check:pnpm`.
- **Dependency Review**, on pull requests: no added dependency has a known vulnerability of
  moderate severity or higher.

## Changesets

A pull request that changes `icons/` or `svgs/` of `packages/icons/`, the files of the
published package, adds a changeset:

```sh
pnpm changeset
```

It asks for the bump (patch, minor or major) and the text of the CHANGELOG entry, and writes a
Markdown file to `.changeset/`. Commit it with the change. Name the icons that are added,
renamed or removed.

A change that releases nothing, such as an SVG that is optimized again with the same drawing,
adds an empty changeset: `pnpm changeset --empty`. A change to the site or to the tooling needs
none.

## Releases

A release is a version commit on `develop` that reaches `main`. The checks of a commit run
once, on `develop`; pushing the same commit to `staging` or `main` doesn't run them again.

1. On `develop`, a maintainer runs `pnpm changeset:version`. It removes the changesets, bumps
   the version in `packages/icons/package.json`, writes the entry of
   `packages/icons/CHANGELOG.md`, and copies the version to the badge of `README.md`, to
   `currentVersion` in `packages/site/config.yml`, then rebuilds the output, so the headers
   of its stylesheets name the new version. The maintainer reviews the result, commits it and
   pushes `develop`.
2. CI runs on that commit. The Changeset job skips the push, since it changes the version.
3. When CI has passed, the maintainer pushes the same commit to `main`. The ruleset of `main`
   requires the checks `Lint`, `Type Check`, `Build` and `Site` on the commit, and blocks a
   force push and a deletion.
4. The push runs `.github/workflows/release.yml`, in three jobs:
   - **Detect Version** reads the version and asks npm whether it has it. When it has, the
     workflow stops: a push to `main` without a new version publishes nothing.
   - **Checks Passed** reads the check-runs of the commit by name. It stops unless `Lint`,
     `Type Check`, `Build` and `Site` passed on it.
   - **Publish** runs `pnpm icons:verify`, publishes `@chassis-ui/icons` from `packages/icons/`
     with npm trusted publishing and provenance (no npm token), and creates the GitHub release
     `v<version>` with the CHANGELOG entry as its body.

`develop` and `main` are at the same commit after a release, so nothing is merged back.

A version without a CHANGELOG entry is not published. A prerelease goes to the npm dist-tag of
its first identifier, so `0.4.0-next.0` goes to `next`, and its GitHub release is marked as a
prerelease; every other version goes to `latest`.

The workflow can also be run by hand, on `main` only: a run on another branch stops in its
first job. Two names are tied to settings outside the repository, so change them together:

- The file name `release.yml` is the trusted publisher of `@chassis-ui/icons` on npmjs.com.
  Renaming the file breaks publishing until the trusted publisher names the new file.
- The job names `Lint`, `Type Check`, `Build` and `Site` are the required checks of the ruleset
  of `main`, and they are in the `REQUIRED` list of `release.yml`.

## Using the issue tracker

The [issue tracker](https://github.com/chassis-ui/icons/issues) is for bug reports, icon
requests and documentation problems of this repository. A problem with a token, a style or a
component belongs in [that project's repository](https://github.com/chassis-ui). Report a
security vulnerability privately, as [SECURITY.md](SECURITY.md) describes.
