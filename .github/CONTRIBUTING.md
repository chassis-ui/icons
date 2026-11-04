# Contributing to Chassis Icons

Thanks for taking the time to contribute. This doc covers dev setup, conventions, and what a pull
request needs before it can be merged. The commands and the configuration are in the
[README](../README.md), and how the build works and what it promises to write in
[docs/architecture.md](../docs/architecture.md); this doc links to them rather than repeating
them. This repository holds the builder and no set: an icon is changed in the repository of
its set. A team that built a set of its own finds how to take a newer build into it under
[Taking a newer build into a repository of icons](#taking-a-newer-build-into-a-repository-of-icons).

## Dev setup

You need Node.js 22.12 or later (`.nvmrc` names the version that CI uses, 24), pnpm (the version
in `packageManager` of `package.json`; `corepack enable` picks it up) and Git.

```bash
git clone https://github.com/chassis-ui/icons.git
cd icons
pnpm install
```

The tests need nothing more. `pnpm icons:fixture` copies the fixture of the tests,
`packages/icons/test/fixture/`, to `.cache/fixture/` and builds the copy with the build of this
checkout, so that its output can be read. `pnpm icons:preview` and `pnpm icons:native` run it
first. The site needs the assets that `pnpm vendor` unpacks; `pnpm dev` and `pnpm site:build`
run it.

The repository is a pnpm workspace: the package `@chassis-ui/icons` and its documentation site.

- [`packages/icons/`](../packages/icons/) is the package that is published to npm, the builder.
  Its `lib/` holds the `chassis-icons` command and the modules of the build, with the templates
  of the stylesheets, of the README and of the page of a set in `lib/templates/`; its `templates/` holds what
  `chassis-icons init` writes into a repository of icons; and its `test/` the tests of the
  build. The package names no font, no prefix and no icon: what is particular to a set is in
  the `chassis.build` block of the `package.json` of its repository. `README.md` is the README
  of the package on npm, and `CHANGELOG.md` the changelog of the builder.
- [`packages/site/`](../packages/site/) holds the Astro documentation site of the builder,
  with the documentation pages in `packages/site/content/docs/`. It shows no set, and is never
  published to npm.
- [`build/`](../build/) holds the scripts of the repository: the copy of the fixture, the check
  for a changeset, the version references, and the notes of a release.
- [`docs/architecture.md`](../docs/architecture.md) explains the build, and
  [`ref/ROADMAP.md`](../ref/ROADMAP.md) holds the plan of the repository, its principles and
  its decisions.
- [`vendor/assets.json`](../vendor/assets.json) pins the release of chassis-ui/website-assets
  with the fonts and images of the site. `pnpm vendor`, `pnpm dev` and `pnpm site:build` unpack its
  archive into `vendor/assets`, which is not committed. `pnpm sync-assets` moves the pin to
  the latest release.

Run every command from the root. `pnpm dev` starts the site on port 4324, after `pnpm vendor`.

## Branch and commit conventions

`develop` is the integration branch: branch from it, and open pull requests against it. `main`
holds released versions only; pushing it publishes to npm (see [Releases](#releases)). `staging`
is for previews of the site: a maintainer pushes `develop` to it when one is wanted, and no
workflow runs on it.

Commits follow a loose `<type>(<scope>): <description>` convention:

- **Types in use**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.
- **Scopes in use**: `icons` for the build and its templates, `site` for the documentation
  site; omitted for changes that span both or neither.

Branch names aren't templated; name yours descriptively (for example `feat/init-check`).

## Changing the build

The build is `packages/icons/lib/cli.js` and the modules beside it:
`node packages/icons/lib/cli.js --help` shows its commands. It is JavaScript with JSDoc
types, checked with `pnpm icons:typecheck`, linted with `pnpm icons:lint`, which fails on a
warning, and formatted with Prettier: `pnpm lint:prettier` checks the whole repository.

`pnpm icons:test` runs the tests in `packages/icons/test/`. They write a repository of icons
with `init`, build the set of another team, the fixture, and compare the result with the
golden files; see the [README of the tests](../packages/icons/test/README.md). A change that
is meant to change the output writes the golden files again with `pnpm icons:test:golden`,
and changes the output of every set too: the changeset says what changes for a repository of
icons.

The package writes what a set says about itself. The `README.md` of a set comes from
`packages/icons/lib/templates/readme.hbs`, its stylesheets from `css.hbs` and `scss.hbs`
beside it, and the page of the set from `preview/` beside them: change the template, never a
file that the build wrote. The fields `main`, `style`, `sass`, `files`, `exports` and
`sideEffects` of the `package.json` of a set come from `packages/icons/lib/manifest.js`; an
entry of `files` or `exports` that is not about `dist/`, or about `icons/` and `svgs/` of an
earlier build, is kept.

`packages/icons/templates/` holds the files that `chassis-icons init` writes: `AGENTS.md`,
`CHANGELOG.md`, `CLAUDE.md`, `gitignore` and the two workflows. A file is written once, and
is the repository's from then on: a change here reaches a repository made earlier only when
its team runs `chassis-icons init --check` and `chassis-icons init --only <file…> --force`.
So a template change that a repository needs is said in the changeset.

The targets of a set besides the web are `packages/icons/lib/ios.js`, which writes the asset
catalog and the Swift file of `dist/ios/`, and `packages/icons/lib/android.js`, which converts
the optimized SVG files into the vector drawables of `dist/android/`. The tests read their
output as text, and do not compile it. `pnpm icons:native` compiles it with the tools of the
platforms, on `dist/` of the copy of the fixture, which it builds first: each
asset catalog with actool, with a check that each image set is a template image, the Swift
file in the Swift 5 and Swift 6 language modes, and `res/` with aapt2 against `android.jar`.
It needs Xcode and the Android SDK, found with `ANDROID_HOME` or `ANDROID_SDK_ROOT`, or named
with `AAPT2` and `ANDROID_JAR`, so CI does not run it. Run it after a change to either module
or to their output; `packages/icons/test/native/check.sh <repository> [ios] [android]` runs it
on another built repository of icons.

`pnpm icons:lint:package` runs [publint](https://publint.dev) on what npm would publish, and
`manifest.test.js` checks that the package packs `lib/`, `templates/`, `package.json`,
`README.md`, `CHANGELOG.md` and `LICENSE`, and nothing else.

No module of the build, no template and no test names a font, a prefix or an icon of a set
other than the fixture. After a change, run:

```bash
pnpm icons:lint
pnpm icons:typecheck
pnpm icons:test
pnpm icons:lint:package
```

## Changing the site

The site uses the layouts and components of
[`@chassis-ui/docs`](https://github.com/chassis-ui/website/tree/main/packages/docs). Its own
pages, components and styles are in `packages/site/src/`, its documentation pages in
`packages/site/content/docs/`, and its settings in `packages/site/config.yml`.

The site is the documentation of the builder: a page at `/icons/` that introduces it, and the
documentation pages. It shows no set, and its code names no font, no prefix and no icon of a
set. An example of a page uses the `acme` names of [WRITING.md](../WRITING.md).

The interface of the site, the header, the sidebar and the search, is drawn by
`@chassis-ui/docs` with the icons of the installed `@chassis-ui/icons` alias, a published
version of this package, at `/static/icons/`. `<Icon>` of `@chassis-ui/docs` and the `icon` of
an entry of `packages/site/data/sidebar.yml` name icons of that package.

`pnpm site:test` checks the built site: that every page is there, that every icon a page
draws is in a sprite that the site serves, and that every link leads to a page and a heading
that exist. It needs the files of `vendor/assets`, so run `pnpm site:build` before it.

```bash
pnpm site:lint:eslint      # ESLint
pnpm site:lint:stylelint   # Stylelint
pnpm lint:prettier         # Prettier, on the whole repository
pnpm check:astro           # Types
pnpm site:build            # The same build as Vercel: the assets, Astro and Pagefind
pnpm site:test             # The pages, the icons and the links of the built site
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
write it down. The example of a repository of icons is a team named `acme`.

The documentation pages of the site are the MDX files of `packages/site/content/docs/`.
A page is found by the slug of its entry in `packages/site/data/sidebar.yml`, and links to
another page with `[[docsref:/<path>]]`: the build of the site fails on a link to a page
that is not there.

`packages/icons/README.md` is the README of the package on npm, written by hand. The README
of a set is written by the build: change `packages/icons/lib/templates/readme.hbs`, write the
golden files again with `pnpm icons:test:golden`, and read the diff. The badge of the version
in `README.md` and `currentVersion` of `packages/site/config.yml` are written by
`pnpm changeset:version`.

`pnpm lint:prettier` checks the formatting and `pnpm spellcheck` the spelling of every
Markdown file. A word that is right and unknown to the checker, such as the name of a tool,
goes into `words` of `.cspell.json`.

## Checks per changed area

Run the checks of the area you changed before you open a pull request. CI runs all of them.

| Area changed                                               | Run                                                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/icons/lib/`                                      | `pnpm icons:lint`, `pnpm icons:typecheck`, `pnpm icons:test`, `pnpm icons:lint:package`. Add a changeset.                              |
| The output of a set is meant to change                     | `pnpm icons:test:golden`, then the row above: read the diff of `packages/icons/test/golden/`, and say in the changeset what changes.   |
| `packages/icons/lib/ios.js`, `android.js` or their output  | The rows above, and `pnpm icons:native` on a machine with Xcode and the Android SDK.                                                   |
| `packages/icons/lib/templates/`                            | `pnpm icons:test:golden`, `pnpm icons:test`. Add a changeset.                                                                          |
| `packages/icons/templates/`                                | `pnpm icons:test`, and `chassis-icons init --check` in a repository made earlier. Add a changeset that says which file to write again. |
| `packages/icons/test/`                                     | `pnpm icons:lint`, `pnpm icons:test`.                                                                                                  |
| The manifest of the package, `packages/icons/package.json` | `pnpm icons:test`, `pnpm icons:lint:package`.                                                                                          |
| The scripts of `build/`, the workflows, `.changeset/`      | `pnpm icons:lint`, `pnpm icons:test`.                                                                                                  |
| `packages/site/`                                           | `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`, `pnpm check:astro`, `pnpm site:build`, `pnpm site:lint:html`, `pnpm site:test`.   |
| Any Markdown, JSON, YAML or configuration file             | `pnpm lint:prettier`, and `pnpm spellcheck` for Markdown.                                                                              |

## What a pull request needs before merge

CI runs these jobs on every pull request, and on every push to `develop`:

- **Lint**: `pnpm icons:lint`, `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`,
  `pnpm lint:prettier` and `pnpm spellcheck`.
- **Type Check**: `pnpm icons:typecheck` and `pnpm check:astro`.
- **Build**: `pnpm icons:test` on the Node.js of `.nvmrc` and on Node.js 22, and
  `pnpm icons:lint:package`. The tests build the fixture and compare its output with the
  golden files.
- **Site**: `pnpm site:build`, which unpacks the assets through `pnpm vendor`, then
  `pnpm site:lint:html`, `pnpm site:lint:vnu` and `pnpm site:test`.
- **Changeset**: a change to `packages/icons/lib/` or to `packages/icons/templates/` has a
  changeset. `pnpm changeset:check develop` runs the same check on your branch.
- **Audit**: `pnpm check:pnpm`.
- **Dependency Review**, on pull requests: no added dependency has a known vulnerability of
  moderate severity or higher.

## Changesets

A pull request that changes the build in `packages/icons/lib/` or the files of `init` in
`packages/icons/templates/`, what the published package holds, adds a changeset:

```bash
pnpm changeset
```

It asks for the bump (patch, minor or major) and the text of the CHANGELOG entry, and writes a
Markdown file to `.changeset/`. Commit it with the change. The entry says what changes for a
repository of icons: a file of the output that is written differently, a command or an option
that is new, a file of `init` to write again with `init --only <file…> --force`. The text
becomes the entry of `packages/icons/CHANGELOG.md` as it is written, without a commit hash:
`.changeset/changelog.js` writes the entries.

While the version is `0.x`, a change to the shape of the output, to a command or to an option
that a repository of icons has to act on is a `minor` bump, and its text starts with
`**Breaking.**`. A new command, option or file of the output is a `minor` bump too, and
everything else a `patch`.

A change that releases nothing, such as a refactoring of the build that writes the same
output, adds an empty changeset: `pnpm changeset --empty`. A change to the site, to the tests,
or to the documents needs none.

## Releases

A release is a version commit on `develop` that reaches `main`. The checks of a commit run
once, on `develop`; pushing the same commit to `staging` or `main` doesn't run them again.

1. On `develop`, a maintainer runs `pnpm changeset:version`. It removes the changesets, bumps
   the version in `packages/icons/package.json`, writes the entry of
   `packages/icons/CHANGELOG.md`, and copies the version to the badge of `README.md` and to
   `currentVersion` in `packages/site/config.yml`. The maintainer reviews the result, commits
   it and pushes `develop`.
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
   - **Release** reads the CHANGELOG entry of the version with `build/release-notes.js`, runs
     `pnpm icons:test`, publishes the package from `packages/icons/` with npm trusted
     publishing (no npm token), and creates the GitHub release `v<version>` with the
     CHANGELOG entry as its body. The release is the package, its tag and its notes: there is
     no archive, since the archive of a set is released by the repository of the set.

`develop` and `main` are at the same commit after a release, so nothing is merged back.

A version without a CHANGELOG entry is not published. A run that published and then failed
can be run again: it skips what is done, and creates the GitHub release alone.

### A prerelease

A prerelease goes to the npm dist-tag of its first identifier, so a version that ends in
`-next.0` goes to `next`, and its GitHub release is marked as a prerelease; every other
version goes to `latest`. Changesets makes one in its prerelease mode:

```bash
pnpm changeset pre enter next   # Once: the versions are <next version>-next.<n> from now on
pnpm changeset:version          # <next version>-next.0, then -next.1 with more changesets
pnpm changeset pre exit         # Once: the next version step makes <next version>
```

Commit `.changeset/pre.json` and `.changeset/pre/` with each step. In this mode a version
step moves the changesets to `.changeset/pre/`, and the version that follows `pre exit` writes
its entry from them again and removes them. So the entry of a version repeats what the entries
of its prereleases said.

### What the workflow reads

The workflow releases what `packages/icons/package.json` describes:

- `name` and `version` are the package that npm is asked for, and the title of the GitHub
  release.
- `publishConfig` is read by npm when it publishes: `"access": "public"`, and
  `"provenance": true` for a signed statement of the commit and the workflow that built the
  version.

The workflow can also be run by hand, on `main` only: a run on another branch stops in its
first job. Two names are tied to settings outside the repository, so change them together:

- The file name `release.yml` is the trusted publisher of the package on npmjs.com.
  Renaming the file breaks publishing until the trusted publisher names the new file.
- The job names `Lint`, `Type Check`, `Build` and `Site` are the required checks of the ruleset
  of `main`, and they are in the `REQUIRED` list of `release.yml`.

### A repository of icons

A repository of icons releases itself with the workflows that
`chassis-icons init` wrote, from `packages/icons/templates/workflows/`. Its `ci.yml` runs on a
pull request and on a push to `main`: `release-notes`, which fails when the version of `package.json`
has no entry in `CHANGELOG.md`, `lint` and `verify`. Its `release.yml` runs on a push to
`main` with a version that npm does not have or that has no tag: it reads the release notes,
lints the source, verifies the set, builds `dist/`, which is not committed, writes the archive
`<font>-web-<version>.zip` with `icons.json`, `svgs/`, `web/` and the page of the set in
`preview/`, and `<font>-<target>-<version>.zip` with `dist/<target>/` of each target of
`chassis.build`, publishes the package with the output for the web, with npm trusted
publishing, unless `package.json` has `"private": true`, and creates the tag `v<version>`
and its GitHub release with the entry as its body and the archives attached. An app takes
the files of iOS and Android from those archives. A push that does not change the version
releases nothing, and a release that fails makes no tag, so the next push tries again.

So a release of a set is one commit: the new version in `package.json`, and its entry in
`CHANGELOG.md`, written by hand in the form of Keep a Changelog and naming the icons that are
added, renamed or removed. The release builds `dist/` from that commit, so the headers of the
stylesheets name the version. The trusted publisher of the package on npmjs.com names
`release.yml` of that repository.

## Taking a newer build into a repository of icons

A repository of icons owns `source/`, its configuration, its registry of the code points and
the files that `init` wrote, and takes the build from npm. So a newer build is taken by bumping the devDependency,
and not by copying files:

1. Bump `@chassis-ui/icons` in `devDependencies` of `package.json` to the new version, and
   read its entry in the [changelog](../packages/icons/CHANGELOG.md) for what changes for a
   repository of icons.

2. Install, build the set with the newer build, and check it. The commands are the scripts
   of `package.json`, with `npm run` in place of `pnpm` in a repository that `init` wrote
   with `--pm npm`. `build --dry-run`, before the build, lists the files that the newer build
   writes differently from the `dist/` of the last build.

   ```bash
   pnpm install
   pnpm build --dry-run
   pnpm build
   pnpm verify
   ```

3. Read `git diff` before you commit: it shows what changed in `codepoints.json`, `README.md`
   and `package.json`, and not in `dist/`, which is not committed. A newer build can write
   other files for the same source, and a change to your output is a change to your package:
   the entry of your next version in `CHANGELOG.md` names what changed for those who use your
   set.

4. Check the files that `init` wrote. They are yours from then on, and a newer build does not
   write over them, so `init --check` reports the ones that differ from what the installed
   version writes, such as the workflows and `AGENTS.md`, and exits 1 when one does;
   `init --only <file…> --force` writes the ones you want again. `package.json` and
   `CHANGELOG.md` are never written over.

   ```bash
   pnpm exec chassis-icons init --check
   pnpm exec chassis-icons init --only .github/workflows/ci.yml .github/workflows/release.yml --force
   ```

A repository may differ from the templates on purpose: a workflow with a step of its own
stays as it is, and `init --check` keeps reporting it.

## Using the issue tracker

The [issue tracker](https://github.com/chassis-ui/icons/issues) is for bug reports and
documentation problems of the build, the site and this repository. An icon of a set, a
request for one, or a problem with the files of a set that the build wrote as it should
belongs in the repository of that set. A problem
with a token, a style or a component belongs in
[that project's repository](https://github.com/chassis-ui). Report a security vulnerability
privately, as [SECURITY.md](SECURITY.md) describes.
