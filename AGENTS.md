# AGENTS.md

Instructions for AI coding agents working in this repository. It holds the rules an agent
breaks without being told; the docs it links to explain the rest.

## Project

Chassis Icons is an icon library creator: a repository that a team owns, fills with its own
SVG files and builds into an icon font, an SVG sprite and optimized SVG files, with a site
that shows the set. The icons in it are the Chassis defaults, published as
`@chassis-ui/icons`. The build is file-driven and names no set: the font name, the class
prefix, the frame and the styles are settings. It is a pnpm workspace:

```
source/                # the SVG files, one per icon; the build only reads them
packages/
  icons/               # the package of the set: @chassis-ui/icons for the default set
    svgs/              # output: the optimized SVG files; committed and published
    icons/             # output: the font, its stylesheets, the sprite; committed and published
    codepoints.json    # the registry of the code points; written by the build, committed
    README.md          # written by the build
    package.json       # the `chassis.build` configuration and the details of the package
    build/             # the build (JavaScript with JSDoc types) and its templates
    test/              # Vitest tests, the fixture set (fixture/) and its golden output (golden/)
  site/                # chassis-icons-site, the Astro documentation site (private)
build/                 # repository scripts (site pages, changeset check, version references, release)
chassis.checks.json    # the icons that consumers of the set read by name
docs/                  # architecture.md
ref/ROADMAP.md         # the plan, its principles, the decisions and the session log
vendor/assets          # git submodule of chassis-ui/assets
```

## Setup and commands

- Package manager: **pnpm**, with Node.js 22.12 or later. Do not use npm or yarn.
- Run every command from the repository root.
- `pnpm icons` builds the output; `--only svgs|sprite|font|package` runs one step, and
  `--dry-run` lists the files that a build would change. `node packages/icons/build/cli.js --help`
  prints every command and option.
- `pnpm dev` runs the site at `http://localhost:4324/icons/`, after one `pnpm vendor`, which
  needs Git LFS. The build of the icons and its tests need neither.

## Before a task is done

Run the checks of the area you changed, and report the ones that fail.

| Area changed                                   | Run                                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `source/`                                      | `pnpm icons:lint:source`, `pnpm icons`, `pnpm site:pages`, `pnpm icons:verify`                                    |
| `packages/icons/build/` or `test/`             | `pnpm icons:lint`, `pnpm icons:typecheck`, `pnpm icons:test`, `pnpm icons`, `pnpm icons:verify`                   |
| The output is meant to change                  | `pnpm icons:test:golden` and `pnpm icons`, then the row above; review both diffs                                  |
| `chassis.build` or the manifest of the package | `pnpm icons`, `pnpm icons:verify`, `pnpm icons:lint:package`                                                      |
| `build/`, `.github/workflows/`, `.changeset/`  | `pnpm icons:lint`, `pnpm icons:test`                                                                              |
| `packages/site/`                               | `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`, `pnpm check:astro`, `pnpm site:build`, `pnpm site:lint:html` |
| Any Markdown, JSON, YAML or configuration file | `pnpm lint:prettier`, and `pnpm spellcheck` for Markdown                                                          |

## Rules

The first nine are the principles of [ref/ROADMAP.md](ref/ROADMAP.md#principles).

- **Owned and customized.** A team that adopts the repository changes `source/` and the
  `chassis` configuration, never the build. So the build in `packages/icons/build/`, its
  tests, the scripts of `build/`, the workflows and the code of the site name nothing of the
  Chassis set: no font name, no prefix, no icon name, no package name. What is particular to a
  set goes in `chassis.build` of `packages/icons/package.json` or in `chassis.checks.json`.
- **The build stays file-driven.** A designer saves `<name>.svg` into `source/` and the build
  does the rest. Do not add a manifest or a list that has to be maintained beside the files.
- **The shape of the output is the contract, for any set.** `icons/<font>.{css,min.css,scss,json,svg,woff,woff2}`
  and `svgs/<name>.svg`, the sprite symbol `<name>`, the class `<prefix>-<name>`, an SVG root
  with the frame and `fill="currentcolor"`. [docs/architecture.md](docs/architecture.md#output-contract)
  has the contract of each file.
- **The default set is the first user of the toolkit.** `@chassis-ui/icons` keeps its paths,
  its prefix `cx` and its icon names. While the version is `0.x`, a change to one of them is a
  minor bump whose changeset starts with `**Breaking.**`.
- **An icon keeps its code point.** Adding an icon never moves another, and the code point of
  a removed icon is retired. `packages/icons/codepoints.json` is written by the build only.
- **The output is committed, and a fresh build equals it.** After a change to `source/` or to
  the build, run `pnpm icons` and commit the result with it. `pnpm icons:verify` fails in CI
  on any difference.
- **Rewrite the scripts, keep the tools.** SVGO, svg-sprite and Fantasticon stay. Replacing or
  upgrading one is a task of its own, with a comparison of the output.
- **Match the siblings in tooling, not in product.** The layout, the tests, CI, Changesets and
  the docs site follow `chassis-tokens` and `chassis-assets`.
- **Never edit generated files by hand.** `packages/icons/svgs/`, `packages/icons/icons/`,
  `packages/icons/codepoints.json`, `packages/icons/README.md`, `packages/icons/test/golden/`,
  the fields `main`, `style`, `sass`, `files`, `exports` and `sideEffects` of the package
  manifest, and the version references are written by commands: `pnpm icons`,
  `pnpm icons:test:golden` and `pnpm changeset:version`.

And these:

- **`source/` is only read.** No command of the build writes there. An icon is changed in its
  source file, and a file is never fixed in `packages/icons/svgs/`.
- **Removing or renaming an icon is the maintainer's decision.** It breaks every project that
  uses the icon. Do not remove one because no consumer of today reads it.
- **Do not empty `chassis.checks.json` to get past `pnpm icons:verify`.** A missing contract
  icon is a broken consumer. Restore the icon, or ask.
- **Keep the known oddities.** The list in
  [docs/architecture.md](docs/architecture.md#known-oddities) is part of the output contract.
- **Tests use the fixture, and no mocks.** The fixture in `packages/icons/test/fixture/` is the
  set of another team. A new case of the build is a file or a setting of the fixture, and the
  golden output is written again with `pnpm icons:test:golden`. A test never names an icon or
  the font of the default set.
- **Types are JSDoc.** The build is JavaScript checked with `checkJs`; do not convert it to
  TypeScript.
- **A root script runs a package script with `run`.** `pnpm --filter ./packages/icons run init`,
  never `pnpm --filter ./packages/icons init`, which is a command of pnpm.
- **Add a changeset** (`pnpm changeset`, or a file in `.changeset/`) to a change in `source/`,
  in `packages/icons/build/` or in the output, and an empty one (`pnpm changeset --empty`) when
  it releases nothing. It names the icons that are added, renamed or removed.

## Documentation

- The repository docs are `README.md`, `.github/CONTRIBUTING.md`, `docs/architecture.md` and
  `packages/icons/test/README.md`. The site has one generated page per icon in
  `packages/site/content/icons/`, and no documentation pages yet: Phase 5 of the roadmap adds
  them.
- Style guide: [WRITING.md](WRITING.md). Plain sentences, no marketing words, no counts, no
  `we` or `our`. Headings are in sentence case, each followed by a sentence.
- Every command, path, option and icon name in a document must exist as written. Run a command
  before writing it down, and copy output from a build; do not retype it.
- `packages/icons/README.md` is written from `packages/icons/build/templates/readme.hbs`. Change
  the template, never the README.
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
  `packages/site/public/`, and `vendor/assets` (a submodule; changes belong in
  `chassis-ui/assets`).
- The sibling repositories are read, never edited. Work for one goes to "Tasks for the
  siblings" of the roadmap. Report a bug of `@chassis-ui/docs` there; do not work around it
  here.
- Commits follow `<type>(<scope>): <description>`, as described in
  [CONTRIBUTING.md](.github/CONTRIBUTING.md#branch-and-commit-conventions).

## Reference docs

Read the doc of an area before working in it, rather than deriving it from the code:

- [README.md](README.md): building a set of your own, the commands, the configuration, the
  shape of the output and who reads it
- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md): changing icons, the build and the site;
  the checks per area; changesets and releases; taking a newer build into an adopted copy
- [docs/architecture.md](docs/architecture.md): the pipeline, the design decisions, the output
  contract of each file, the contracts with the siblings and the known oddities
- [packages/icons/test/README.md](packages/icons/test/README.md): the tests, the fixture and
  the golden output
- [ref/ROADMAP.md](ref/ROADMAP.md): the findings, the phases, the decisions and what each
  session did
- [WRITING.md](WRITING.md): the style guide of the documentation
