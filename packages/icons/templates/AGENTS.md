# AGENTS.md

Instructions for AI coding agents working in this repository. It holds the rules an agent
breaks without being told; the README explains the rest.

## Project

__NAME__ holds an icon set: one SVG file per icon in `source/`, built with
[`@chassis-ui/icons`](https://www.npmjs.com/package/@chassis-ui/icons) into `svgs/`, one
optimized file per icon, and `icons/`, the icon font `__FONT__` with its stylesheets, the SVG
sprite and the page of the set. `chassis.build` in `package.json` names the font, the class prefix `__PREFIX__-`, the
frame and the styles. The build is file-driven: a file saved into `source/` is an icon of the
next build, and there is no list to maintain.

## Commands

Once, with Node.js 22.12 or later: `__INSTALL__`.

| Command                 | What it does                                                             |
| ----------------------- | ------------------------------------------------------------------------ |
| `__RUN__ build`         | Builds `svgs/`, `icons/`, `codepoints.json`, `README.md` and the manifest |
| `__RUN__ lint`          | Checks the files of `source/`: names, frame, color, pairs                |
| `__RUN__ verify`        | Fails when the output differs from a fresh build                         |
| `__RUN__ archive`       | Writes `archives/__FONT__-<version>.zip`, with `icons/` and `svgs/` in it |
| `__RUN__ release-notes` | Prints the changelog entry of the version, or fails                      |

`node_modules/.bin/chassis-icons --help` prints every command and option: `build --only <step>`,
`build --dry-run` and `verify --since <ref>` among them.

## Rules

- **Edit `source/`, never the output.** `svgs/`, `icons/`, `codepoints.json`, `README.md` and
  the fields `main`, `style`, `sass`, `files`, `exports` and `sideEffects` of `package.json`
  are written by `__RUN__ build`. Commit them with the change to `source/`.
- **A file of `source/` is an icon.** Its name is the name of the icon, in kebab-case, and
  ends in a style of `chassis.build` when the set has styles. `__RUN__ lint` says what else a
  file needs: the frame, one color, no stroke.
- **An icon keeps its code point.** `codepoints.json` is the registry of the code points: a new
  icon gets the next free one, and the code point of a removed icon is retired. The build is its
  only writer.
- **The names of the icons are public.** A project reads an icon by name: the class
  `__PREFIX__-<name>`, the sprite symbol `<name>` and the file `svgs/<name>.svg`. Renaming or
  removing an icon breaks it, so that is the maintainer's decision, and the changelog says so.
  `chassis.checks.json` lists the icons that a project reads by name, and `__RUN__ verify`
  fails when one is missing.

## Releases

A push to `main` with a new version in `package.json` releases it, so:

- A new version and its entry in `CHANGELOG.md` go in one commit. The release stops without
  the entry. The entry names the icons that are added, renamed or removed.
- Before that commit, run `__RUN__ build`, which writes the version into the stylesheets, and
  `__RUN__ verify`.
- Do not push, tag or raise the version unless asked.
