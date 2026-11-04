# AGENTS.md

Instructions for AI coding agents working in this repository. It holds the rules an agent
breaks without being told; the docs it links to explain the rest.

## Project

Chassis Icons is `@chassis-ui/icons`, the builder of icon sets of Chassis UI: the
`chassis-icons` command builds a repository of SVG files into optimized SVG files, an SVG
sprite, an icon font with its stylesheets, an index of the set and the files of iOS and
Android, and `init` writes such a repository. The repository and the package are abstract:
they name no set and need none, as if no team had built a set yet. The build is file-driven:
the font name, the class prefix, the frame and the styles are the `chassis.build` block of the
repository it builds. Its checks run on the fixture of its tests, a repository of icons of
another team. It is a pnpm workspace:

```
packages/
  icons/               # @chassis-ui/icons, published to npm, with the chassis-icons command
    lib/               # the command (JavaScript with JSDoc types): cli.js, the modules of the
                       # build, and lib/templates/, the Handlebars templates of the output
    templates/         # what `chassis-icons init` writes into a repository of icons
    test/              # Vitest tests, the fixture set (fixture/) and its golden output (golden/)
  site/                # chassis-icons-site, the Astro site of the builder's documentation (private)
    content/docs/      # the documentation pages
vendor/assets.json     # the pin of the release of chassis-ui/website-assets; vendor/assets is not committed
build/                 # repository scripts (fixture copy, changeset check, version references, release notes)
docs/                  # architecture.md
ref/ROADMAP.md         # the plan, its principles, the decisions and the session log
```

A repository of icons commits `source/`, a `package.json` with the `chassis` block,
`codepoints.json`, `README.md`, and `chassis.checks.json` when consumers read icons by name;
`chassis-icons init` writes one. The build writes `dist/` (`icons.json`, `svgs/`, `web/`, and
`ios/` and `android/` with the targets), which is not committed: the release builds it.
`preview/`, the page of the set, and `archives/` are written from `dist/` and are not
committed either.

## Setup and commands

- Package manager: **pnpm**, with Node.js 22.12 or later. Do not use npm or yarn.
- Run every command from the repository root.
- `pnpm vendor` unpacks into `vendor/assets/` the archive of the assets of the site that
  `vendor/assets.json` pins. The site needs it; the tests of the builder do not.
- `pnpm icons:fixture` writes a copy of the fixture, `packages/icons/test/fixture/`, into
  `.cache/fixture/` and builds it with the command of this checkout. The command works on one
  repository of icons: `--cwd <dir>`, by default the nearest folder upward whose
  `package.json` has a `chassis` block; the root of this workspace has none, so run it as
  `node packages/icons/lib/cli.js <command> --cwd .cache/fixture`. `--help` prints every
  command.
- `pnpm icons:native` builds the fixture and compiles its `ios` and `android` output with Xcode
  and the Android SDK; CI does not run it.
- `pnpm icons:preview` builds the fixture, and writes its page into `.cache/fixture/preview/`
  and serves it at `http://localhost:4325/`.
- `pnpm dev` runs the site at `http://localhost:4324/icons/`, after `pnpm vendor`.

## Before a task is done

Run the checks of the area you changed, and report the ones that fail.

| Area changed                                   | Run                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `packages/icons/lib/`, `templates/` or `test/` | `pnpm icons:lint`, `pnpm icons:typecheck`, `pnpm icons:test`, `pnpm icons:lint:package`                                             |
| `lib/ios.js`, `lib/android.js` or their output | The row above, and `pnpm icons:native` with Xcode and the Android SDK (`ANDROID_HOME`); say so when the machine has neither         |
| The output of a set is meant to change         | `pnpm icons:test:golden`, then the row above; review the diff of `test/golden/`, which is what changes for any set                  |
| `build/`, `.github/workflows/`, `.changeset/`  | `pnpm icons:lint`, `pnpm icons:test`                                                                                                |
| `packages/site/`                               | `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`, `pnpm check:astro`, `pnpm site:build`, `pnpm site:lint:html`, `pnpm site:test` |
| Any Markdown, JSON, YAML or configuration file | `pnpm lint:prettier`, and `pnpm spellcheck` for Markdown                                                                            |

## Rules

The first nine are the principles of [ref/ROADMAP.md](ref/ROADMAP.md#principles).

- **The package is the builder, and ships no icons.** The build in `packages/icons/lib/`, the
  templates of `init`, the tests, the scripts of `build/`, the workflows, the site and the
  docs name no set of a team, the icons of the Chassis website included: no font name, no
  prefix, no icon name, no package name but the builder's own. What is particular to a set is in the `chassis.build` block of
  the `package.json` of its repository, and in its `chassis.checks.json`.
- **The build stays file-driven.** A designer saves `<name>.svg` into `source/` of a
  repository of icons and the build does the rest. Do not add a manifest or a list that has
  to be maintained beside the files.
- **The shape of the output is the contract, for any set.** `dist/web/<font>.{css,min.css,scss,json,svg,woff,woff2}`,
  `dist/svgs/<name>.svg` and `dist/icons.json`, the sprite symbol `<name>`, the class `<prefix>-<name>`, an SVG root
  with the frame and `fill="currentcolor"`; with the targets, `dist/ios/` with the image set
  `<name>` and the Swift case of the name, and the drawable `<prefix>_<name>` of
  `dist/android/`. [docs/architecture.md](docs/architecture.md#output-contract)
  has the contract of each file. A change to it is a minor bump whose changeset starts with
  `**Breaking.**` while the version is `0.x`.
- **An icon keeps its code point.** Adding an icon never moves another, and the code point of
  a removed icon is retired. `codepoints.json` of a repository is written by the build only.
- **The output of a set is built, not committed.** `dist/` follows from the source, the
  registry and the version of the builder, and the release builds it. The build also writes
  files that are committed, the registry, the README and fields of `package.json`, and
  `verify` fails when one is not what the source builds, or when two builds differ. A change
  to the build that changes the output of a set is a change for every repository of icons:
  the changeset says what changes.
- **Rewrite the scripts, keep the tools.** SVGO, svg-sprite and Fantasticon stay. Replacing or
  upgrading one is a task of its own, with a comparison of the output.
- **Match the siblings in tooling, not in product.** The layout, the tests, CI, Changesets,
  `init` and the docs site follow `chassis-ui/tokens` and `chassis-ui/assets`.
- **Never edit generated files by hand.** `packages/icons/test/golden/`, the version
  references and the lockfile are written by commands: `pnpm icons:test:golden`,
  `pnpm changeset:version` and `pnpm install`.
- **The repository builds no set of a team.** Its checks, its scripts and its site use the
  fixture, and nothing of a real set: no submodule, no dependency, no example. A set, the icons
  of the Chassis website included, takes a new builder in its own repository, with a build and
  `verify` there.

And these:

- **`source/` of a repository is only read.** No command of the build writes there.
- **Removing or renaming an icon is the maintainer's decision**, in the repository of the set.
  It breaks every project that uses the icon.
- **Keep the known oddities.** The list in
  [docs/architecture.md](docs/architecture.md#known-oddities) is part of the output contract.
- **Tests use the fixture, and no mocks.** The fixture in `packages/icons/test/fixture/` is a
  repository of icons of another team. A new case of the build is a file or a setting of the
  fixture, and the golden output is written again with `pnpm icons:test:golden`. A test names
  no icon or font of a real set.
- **Templates of `init` are written once.** A file that `chassis-icons init` wrote is the
  repository's from then on. A change to `packages/icons/templates/` reaches a repository
  only when its team runs `init --check` and `init --only <file> --force`, so a template
  change that a repository needs is said in the changeset.
- **Types are JSDoc.** The build is JavaScript checked with `checkJs`; do not convert it to
  TypeScript.
- **The site is the documentation of the builder, and shows no set.** It has the home page
  and the pages of `content/docs/`, and no page per icon. `<Icon>` of `@chassis-ui/docs` and
  the icons of `data/sidebar.yml` are of the installed `@chassis-ui/website-icons`, of
  chassis-ui/website-icons, which draws the interface, as on every Chassis site, and not of
  the builder of this workspace.
- **A root script runs a package script with `run`.** `pnpm --filter ./packages/icons run test`,
  never `pnpm --filter ./packages/icons test`.
- **Add a changeset** (`pnpm changeset`, or a file in `.changeset/`) to a change in
  `packages/icons/lib/` or `packages/icons/templates/`, and an empty one
  (`pnpm changeset --empty`) when it releases nothing.

## Documentation

- The repository docs are `README.md`, `.github/CONTRIBUTING.md`, `docs/architecture.md`,
  `packages/icons/README.md` (the README of the package on npm) and
  `packages/icons/test/README.md`. The pages of the site are the MDX files of
  `packages/site/content/docs/`, each with an entry in `packages/site/data/sidebar.yml`.
- Style guide: [WRITING.md](WRITING.md). Plain sentences, no marketing words, no counts, no
  `we` or `our`. Headings are in sentence case, each followed by a sentence.
- Every command, path, option and icon name in a document must exist as written. Run a command
  before writing it down, and copy output from a build; do not retype it.
- The docs name a set of a team with `acme` names, and never a real set: not as an example, a
  reference or a consumer. Copy its output from a build of the fixture.
- Name a sibling by its GitHub repository, as `chassis-ui/css`, never by a local folder name or
  a relative path. These differ per contributor.
- The README of a set is written from `packages/icons/lib/templates/readme.hbs`. Change the
  template, never a README that the build wrote.
- Run `pnpm lint:prettier` and `pnpm spellcheck` after editing a Markdown file.

## Cautions

- Work on `develop` or on a branch made from it, never on `main`. `main` holds released
  versions only and gets `develop` when the maintainer releases. Check the branch before the
  first edit of a task.
- A finished branch is merged locally into `develop`. Do not open a pull request unless asked.
- Never commit, merge or push without being asked. Pushing `main` starts the release workflow,
  which publishes the package to npm and deploys the site.
- A change to [ref/ROADMAP.md](ref/ROADMAP.md) goes into the commit of the work it records, not
  into a commit of its own. Add a line to its session log at the end of a session.
- Do not edit generated or fetched files: `_site/`, `.cache/`, `node_modules/`,
  `packages/site/public/`, `vendor/assets` (unpacked from a release; changes belong in
  `chassis-ui/website-assets`) and `vendor/assets.json` (written by `pnpm sync-assets`).
- The sibling repositories are read, never edited. Work for one goes to "Tasks for the
  siblings" of the roadmap. Report a bug of `@chassis-ui/docs` there; do not work around it
  here.
- Commits follow `<type>(<scope>): <description>`, as described in
  [CONTRIBUTING.md](.github/CONTRIBUTING.md#branch-and-commit-conventions).

## Reference docs

Read the doc of an area before working in it, rather than deriving it from the code:

- [README.md](README.md): what the builder is, building a set of your own with `init`, the
  commands, the configuration, the shape of the output and who reads it
- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md): changing the build, the templates and
  the site; the checks per area; changesets and releases
- [docs/architecture.md](docs/architecture.md): the pipeline, the design decisions, the output
  contract of each file, the contracts with the siblings and the known oddities
- [packages/icons/test/README.md](packages/icons/test/README.md): the tests, the fixture and
  the golden output
- [ref/ROADMAP.md](ref/ROADMAP.md): the findings, the phases, the decisions and what each
  session did
- [WRITING.md](WRITING.md): the style guide of the documentation
