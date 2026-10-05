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

The repository is one package, `@chassis-ui/icons`, with its documentation site beside it:

- [`svgs/`](../svgs/) holds one SVG file per icon. It is the source of everything else.
- [`icons/`](../icons/) holds what the build writes from it: the SVG sprite, the icon font and
  its CSS and SCSS. Both folders are committed, and both are published to npm.
- [`build/`](../build/) holds the build scripts and the templates of the font's stylesheets.
- [`site/`](../site/) holds the Astro documentation site, with one page per icon in
  `site/content/icons/`. It is never published to npm.
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

1. Add, change or remove the SVG file in `svgs/`. An icon is drawn on a 24 by 24 frame, in one
   color, and is named in kebab-case with its style as the last part: `<name>-outline`,
   `<name>-solid` or `<name>-brand`. See "Icon Naming Convention" in the README.
2. Run `pnpm icons`. It optimizes the SVG files with SVGO, and writes the sprite, the font and
   its stylesheets to `icons/`. A new icon gets a code point of its own in
   `icons/chassis-icons.json`; the code points of the other icons stay as they are.
3. Run `pnpm site:pages`. It writes the page of each new icon to `site/content/icons/`, with
   `categories` and `tags` taken from the file name: correct them where they are wrong. Delete
   the page of an icon that you removed.
4. Run `pnpm icons:check`. It fails when a file of `svgs/` has no entry in the font, or the
   other way round.
5. Look at the result in `icons/preview.html`, or on the site with `pnpm dev`.
6. Commit `svgs/`, `icons/` and the pages together, with a [changeset](#changesets).

Renaming or removing an icon breaks every project that uses it: say so in the changeset.

## Changing the build

The scripts in `build/` are linted with `pnpm icons:lint`, which fails on a warning, and
formatted with Prettier: `pnpm lint:prettier` checks the whole repository. A change to the font
templates in `build/font/`, to `.fantasticonrc.cjs`, `svg-sprite.json` or `svgo.config.js`
changes the files of `icons/`: run `pnpm icons` and commit the result with the change.

## Changing the site

The site uses the layouts and components of
[`@chassis-ui/docs`](https://github.com/chassis-ui/website/tree/main/packages/docs). Its own
pages, components and styles are in `site/src/`, and its settings in `site/config.yml`.

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
patterns of `site/astro.config.ts` on the same folder.

## What a pull request needs before merge

CI runs these jobs on every pull request, and on every push to `develop`:

- **Lint**: `pnpm icons:lint`, `pnpm site:lint:eslint`, `pnpm site:lint:stylelint` and
  `pnpm lint:prettier`.
- **Type Check**: `pnpm check:astro`.
- **Build**: `pnpm icons`, then `pnpm icons:check`. It fails when the build changes a file of
  `icons/` or `svgs/`: the committed output is not what the source builds. Run `pnpm icons`
  and commit the result.
- **Site**: `pnpm site:build`, then `pnpm site:lint:html` and `pnpm site:lint:vnu`.
- **Changeset**: a change to `icons/` or `svgs/` has a changeset.
- **Audit**: `pnpm check:pnpm`.
- **Dependency Review**, on pull requests: no added dependency has a known vulnerability of
  moderate severity or higher.

## Changesets

A pull request that changes `icons/` or `svgs/`, the files of the published package, adds a
changeset:

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
   the version in `package.json`, writes the CHANGELOG entry, and copies the version to the
   badge of `README.md`, to `currentVersion` in `site/config.yml` and to the font templates in
   `build/font/`, then rebuilds `icons/`, so the headers of its stylesheets name the new
   version. The maintainer reviews the result, commits it and pushes `develop`.
2. CI runs on that commit. The Changeset job skips the push, since it changes the version.
3. When CI has passed, the maintainer pushes the same commit to `main`. The ruleset of `main`
   requires the checks `Lint`, `Type Check`, `Build` and `Site` on the commit, and blocks a
   force push and a deletion.
4. The push runs `.github/workflows/release.yml`, in three jobs:
   - **Detect Version** reads the version and asks npm whether it has it. When it has, the
     workflow stops: a push to `main` without a new version publishes nothing.
   - **Checks Passed** reads the check-runs of the commit by name. It stops unless `Lint`,
     `Type Check`, `Build` and `Site` passed on it.
   - **Publish** runs `pnpm icons:check`, publishes `@chassis-ui/icons` with npm trusted
     publishing and provenance (no npm token), and creates the GitHub release `v<version>`
     with the CHANGELOG entry as its body.

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
