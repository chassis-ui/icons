# Contributing to Chassis Icons

Thanks for taking the time to contribute. This doc covers dev setup, conventions, and what a pull
request needs before it can be merged. The commands and the configuration are in the
[README](../README.md), and how the build works and what it promises to write in
[docs/architecture.md](../docs/architecture.md); this doc links to them rather than repeating
them. A team that built its own set from this repository finds how to take a newer build into
it under [Taking a newer build into your copy](#taking-a-newer-build-into-your-copy).

## Dev setup

You need Node.js 22.12 or later (`.nvmrc` names the version that CI uses, 24), pnpm (the version
in `packageManager` of `package.json`; `corepack enable` picks it up), Git and
[Git LFS](https://git-lfs.com).

```bash
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
  configuration of the set: the build itself names no font, no prefix and no icon. The build
  writes `README.md` too, and the fields of `package.json` that name the files of the output:
  `main`, `style`, `sass`, `files`, `exports` and `sideEffects`.
- [`packages/site/`](../packages/site/) holds the Astro documentation site. It shows the
  set of the repository, with a page per icon that it makes from the output of the build,
  and holds the documentation pages in `packages/site/content/docs/`. It is never published
  to npm.
- [`build/`](../build/) holds the scripts of the repository: the check for a changeset, the
  version references, and the notes and the archive of a release.
- [`chassis.checks.json`](../chassis.checks.json) lists the icons that the Chassis sites and
  Chassis React read by name. `pnpm icons:verify` fails when one is missing.
- [`docs/architecture.md`](../docs/architecture.md) explains the build, and
  [`ref/ROADMAP.md`](../ref/ROADMAP.md) holds the plan of the repository, its principles and
  its decisions.
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
   icon gets it. `packages/icons/README.md` is written again, with the number of icons.
3. Run `pnpm icons:verify`. It builds into a temporary folder and fails when a committed file
   is not what the source builds, when an icon lost its code point, or when an icon of
   `chassis.checks.json` is missing.
4. Look at the result in `packages/icons/icons/preview.html`, or on the site with `pnpm dev`.
   The site has a page for each icon of the output, so there is no page to write or to
   delete.
5. Commit `source/` and `packages/icons/` together, with a [changeset](#changesets).

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

The build writes what the package says about its output. `packages/icons/README.md` comes
from `packages/icons/build/templates/readme.hbs`: change the template, never the README. The
fields `main`, `style`, `sass`, `files`, `exports` and `sideEffects` of
`packages/icons/package.json` come from `packages/icons/build/manifest.js`; an entry of
`files` or `exports` that is not about `icons/` or `svgs/` is kept. `pnpm icons:lint:package`
runs [publint](https://publint.dev) on what npm would publish.

No module of the build names a font, a prefix or an icon. What is particular to a set goes
into the `chassis.build` block of `packages/icons/package.json` or into
`chassis.checks.json`.

## Changing the site

The site uses the layouts and components of
[`@chassis-ui/docs`](https://github.com/chassis-ui/website/tree/main/packages/docs). Its own
pages, components and styles are in `packages/site/src/`, its documentation pages in
`packages/site/content/docs/`, and its settings in `packages/site/config.yml`.

The site shows the set of the repository, whatever set that is, so its code names no font,
no prefix and no icon. `packages/site/src/libs/set.ts` reads the configuration and the
output of `packages/icons/`. A page reads the set from `virtual:icon-set` and the icons from
the `icons` collection, and draws an icon of the set with `SetIcon.astro`. The set is served
from `/icons/static/set/`.

The interface of the site is another matter: the header, the sidebar and the search are
drawn by `@chassis-ui/docs` with the Chassis set, from the installed package
`@chassis-ui/icons` at `/static/icons/`. `<Icon>` of `@chassis-ui/docs` and the `icon` of an
entry of `packages/site/data/sidebar.yml` name icons of that package, and not of the set of
the repository.

`pnpm site:test` holds the site to this. It copies the repository, builds the site of the
copy for the set it ships with and for the fixture of the tests of the build, and checks
that each page shows the set of the copy, that every icon a page draws is in the sprite it
is drawn from, and that every link leads to a page and a heading that exist. It needs the
build of `vendor/assets`, so run `pnpm site:build` or `pnpm vendor` once before it.

```bash
pnpm site:lint:eslint      # ESLint
pnpm site:lint:stylelint   # Stylelint
pnpm lint:prettier         # Prettier, on the whole repository
pnpm check:astro           # Types
pnpm site:build            # The same build as Vercel: vendor/assets, Astro and Pagefind
pnpm site:test             # The site of a copy of the repository, for two sets
pnpm site:lint:html        # html-validate, on the built site
pnpm site:lint:vnu         # The Nu Html Checker, on the built site. Needs Java
pnpm astro:preview         # The built site, as it is deployed
```

The files that Astro builds are written to `_site/icons/static/astro/` and requested from that
path, and the shared CSS, fonts and icons from `/static/`. Keep `build.assets` and the name
patterns of `packages/site/astro.config.ts` on the same folder.

## Changing the documents

The documents follow [WRITING.md](../WRITING.md): plain sentences, no counts and no marketing
words, and every command, path and option written as it exists. Run a command before you
write it down.

The documentation pages of the site are the MDX files of `packages/site/content/docs/`.
A page is found by the slug of its entry in `packages/site/data/sidebar.yml`, and links to
another page with `[[docsref:/<path>]]`: the build of the site fails on a link to a page
that is not there. The pages use the Chassis set in their examples and say so.

`packages/icons/README.md` is written by the build: change
`packages/icons/build/templates/readme.hbs` and run `pnpm icons`. The badge of the version in
`README.md` and `currentVersion` of `packages/site/config.yml` are written by
`pnpm changeset:version`.

`pnpm lint:prettier` checks the formatting and `pnpm spellcheck` the spelling of every
Markdown file. A word that is right and unknown to the checker, such as the name of a tool,
goes into `words` of `.cspell.json`.

## Checks per changed area

Run the checks of the area you changed before you open a pull request. CI runs all of them.

| Area changed                                             | Run                                                                                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `source/`                                                | `pnpm icons:lint:source`, `pnpm icons`, `pnpm icons:verify`. Add a changeset.                                                           |
| `packages/icons/build/`                                  | `pnpm icons:lint`, `pnpm icons:typecheck`, `pnpm icons:test`, `pnpm icons`, `pnpm icons:verify`. Add a changeset.                       |
| The output is meant to change                            | The row above, with `pnpm icons:test:golden` before the tests: read the diff of `packages/icons/test/golden/` and of `packages/icons/`. |
| `packages/icons/build/templates/readme.hbs`              | `pnpm icons:test:golden`, `pnpm icons`, `pnpm icons:test`.                                                                              |
| `packages/icons/test/`                                   | `pnpm icons:lint`, `pnpm icons:test`.                                                                                                   |
| `chassis.build` or another field of the package manifest | `pnpm icons`, `pnpm icons:verify`, `pnpm icons:lint:package`.                                                                           |
| `chassis.checks.json`                                    | `pnpm icons:verify`.                                                                                                                    |
| The scripts of `build/`, the workflows, `.changeset/`    | `pnpm icons:lint`, `pnpm icons:test`.                                                                                                   |
| `packages/site/`                                         | `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`, `pnpm check:astro`, `pnpm site:build`, `pnpm site:lint:html`, `pnpm site:test`.    |
| Any Markdown, JSON, YAML or configuration file           | `pnpm lint:prettier`, and `pnpm spellcheck` for Markdown.                                                                               |

## What a pull request needs before merge

CI runs these jobs on every pull request, and on every push to `develop`:

- **Lint**: `pnpm icons:lint`, `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`,
  `pnpm lint:prettier` and `pnpm spellcheck`.
- **Type Check**: `pnpm icons:typecheck` and `pnpm check:astro`.
- **Build**: `pnpm icons:lint:source`, `pnpm icons:test` on the Node.js of `.nvmrc` and on
  Node.js 22, `pnpm icons:verify` and `pnpm icons:lint:package`. It fails when the committed
  output is not what the source builds: run `pnpm icons` and commit the result.
- **Site**: `pnpm site:build`, then `pnpm site:lint:html`, `pnpm site:lint:vnu` and
  `pnpm site:test`.
- **Changeset**: a change to `source/`, to `packages/icons/build/` or to `icons/` and `svgs/`
  of `packages/icons/` has a changeset. `pnpm changeset:check develop` runs the same check
  on your branch.
- **Audit**: `pnpm check:pnpm`.
- **Dependency Review**, on pull requests: no added dependency has a known vulnerability of
  moderate severity or higher.

## Changesets

A pull request that changes `source/`, the build in `packages/icons/build/`, or `icons/` and
`svgs/` of `packages/icons/`, the files of the published package, adds a changeset:

```bash
pnpm changeset
```

It asks for the bump (patch, minor or major) and the text of the CHANGELOG entry, and writes a
Markdown file to `.changeset/`. Commit it with the change. Name the icons that are added,
renamed or removed. The text becomes the entry of `packages/icons/CHANGELOG.md` as it is
written, without a commit hash: `.changeset/changelog.js` writes the entries.

While the version is `0.x`, a change that removes or renames an icon, a file of the package,
the class prefix or the font is a `minor` bump, and its text starts with `**Breaking.**`. A
new icon is a `minor` bump too, and everything else a `patch`.

A change that releases nothing, such as a refactoring of the build that writes the same
output, adds an empty changeset: `pnpm changeset --empty`. A change to the site, to the tests
or to the documents needs none.

## Releases

A release is a version commit on `develop` that reaches `main`. The checks of a commit run
once, on `develop`; pushing the same commit to `staging` or `main` doesn't run them again.

1. On `develop`, a maintainer runs `pnpm changeset:version`. It removes the changesets, bumps
   the version in `packages/icons/package.json`, writes the entry of
   `packages/icons/CHANGELOG.md`, and copies the version to the badge of `README.md`, to
   `currentVersion` in `packages/site/config.yml`, then rebuilds the output, so the headers
   of its stylesheets name the new version. The maintainer reviews the result, commits it and
   pushes `develop`.
2. CI runs on that commit. The Changeset job passes it, since it changes the version.
3. When CI has passed, the maintainer pushes the same commit to `main`. The ruleset of `main`
   requires the checks `Lint`, `Type Check`, `Build` and `Site` on the commit, and blocks a
   force push and a deletion.
4. The push runs `.github/workflows/release.yml`, in three jobs:
   - **Detect Version** reads the name and the version of the package, asks npm whether it
     has the version, and asks GitHub whether the tag `v<version>` exists. When both are
     there, the workflow stops: a push to `main` without a new version releases nothing.
   - **Checks Passed** reads the check-runs of the commit by name. It stops unless `Lint`,
     `Type Check`, `Build` and `Site` passed on it.
   - **Release** runs `pnpm icons:verify`, reads the CHANGELOG entry of the version, and
     writes the archive `<font>-<version>.zip` with `icons/` and `svgs/` in it. Then it
     publishes the package from `packages/icons/` with npm trusted publishing (no npm token),
     and creates the GitHub release `v<version>` with the CHANGELOG entry as its body and the
     archive attached.

`develop` and `main` are at the same commit after a release, so nothing is merged back.

A version without a CHANGELOG entry is not published. A run that published and then failed
can be run again: it skips what is done, and creates the GitHub release alone.

### A prerelease

A prerelease goes to the npm dist-tag of its first identifier, so `0.4.0-next.0` goes to
`next`, and its GitHub release is marked as a prerelease; every other version goes to
`latest`. Changesets makes one in its prerelease mode:

```bash
pnpm changeset pre enter next   # Once: the versions are <next version>-next.<n> from now on
pnpm changeset:version          # 0.4.0-next.0, then 0.4.0-next.1 with more changesets
pnpm changeset pre exit         # Once: the next version step makes 0.4.0
```

Commit `.changeset/pre.json` and `.changeset/pre/` with each step. In this mode a version
step moves the changesets to `.changeset/pre/`, and the version that follows `pre exit` writes
its entry from them again and removes them. So the entry of `0.4.0` repeats what the entries of
its prereleases said.

### What the workflow reads

The workflow names no package. It releases what `packages/icons/package.json` describes, so
a set of your own is released by the same file:

- `name` and `version` are the package that npm is asked for, and the title of the GitHub
  release.
- `"private": true` publishes nothing to a registry. The release is the tag, the GitHub
  release and its archive.
- `publishConfig` is read by npm when it publishes: `"access": "restricted"` for a package
  that only your organization installs, and `"provenance": true` for a signed statement of
  the commit and the workflow that built the version, which npm accepts from a public
  repository only.

The package is published to npmjs.com. Another registry needs its address and a token in
the "Publish to npm" step and in the Node.js setup before it.

The workflow can also be run by hand, on `main` only: a run on another branch stops in its
first job. Two names are tied to settings outside the repository, so change them together:

- The file name `release.yml` is the trusted publisher of the package on npmjs.com.
  Renaming the file breaks publishing until the trusted publisher names the new file.
- The job names `Lint`, `Type Check`, `Build` and `Site` are the required checks of the ruleset
  of `main`, and they are in the `REQUIRED` list of `release.yml`.

## Taking a newer build into your copy

A team that built its own set from a clone owns `source/`, the configuration and the output,
and the build stays what this repository ships. So a newer build is taken by folder, and not
by a merge, which would bring the icons of the Chassis set back into `source/`. The steps
assume the remote `upstream` of the [README](../README.md#build-your-own-set).

1. Fetch the released state, without the tags of the Chassis set, and read what changed.
   `upstream/main` holds released versions only.

   ```bash
   git fetch upstream --no-tags
   git show upstream/main:packages/icons/CHANGELOG.md
   ```

2. Take the folders and the files of the toolkit as they are there. `git restore` also
   removes a file that the newer build no longer has.

   ```bash
   git restore --source=upstream/main --staged --worktree -- \
     packages/icons/build packages/icons/test packages/icons/tsconfig.json build docs \
     packages/site/src packages/site/test packages/site/astro.config.ts \
     packages/site/tsconfig.json packages/site/html-validate.json \
     packages/site/postcss.config.js \
     .github/workflows .changeset/changelog.js .changeset/config.json \
     pnpm-lock.yaml pnpm-workspace.yaml eslint.config.js .prettierrc.json .prettierignore
   ```

3. Three files are shared, and are merged by hand. In the root `package.json`, take
   `scripts`, `devDependencies`, `engines` and `packageManager`. In
   `packages/icons/package.json`, take `scripts`, `devDependencies` and `engines`, and keep
   everything else, which is yours. In `packages/site/package.json`, take `scripts` and
   `devDependencies`.

   ```bash
   git diff HEAD upstream/main -- package.json packages/icons/package.json packages/site/package.json
   ```

4. Install, build your set with the newer build, and run its checks.

   ```bash
   pnpm install
   pnpm icons
   pnpm icons:verify
   pnpm icons:test
   pnpm icons:lint:package
   ```

5. Read `git diff -- packages/icons` before you commit. A newer build can write other files
   for the same source, and a change to your output is a change to your package: add a
   changeset that names what changed for those who use your set.

Never taken, because they are yours: `source/`, `packages/icons/svgs/`,
`packages/icons/icons/`, `packages/icons/codepoints.json`, `packages/icons/README.md`,
`packages/icons/CHANGELOG.md`, `chassis.checks.json`, your changesets, and of the site
`packages/site/config.yml`, `packages/site/content/`, `packages/site/data/` and
`packages/site/static/`. The code of the site in `packages/site/src/` is the toolkit's: it
names no set, and is taken with the build.

The tests run on the fixture and on your own set, so `pnpm icons:test` passing in your copy
says that the newer build works for your configuration.

## Using the issue tracker

The [issue tracker](https://github.com/chassis-ui/icons/issues) is for bug reports, icon
requests and documentation problems of this repository. A problem with a token, a style or a
component belongs in [that project's repository](https://github.com/chassis-ui). Report a
security vulnerability privately, as [SECURITY.md](SECURITY.md) describes.
