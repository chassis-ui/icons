---
'@chassis-ui/icons': minor
---

**Breaking.** The package is the builder of icon sets of Chassis UI, and ships no icons. The
icons of the Chassis website are `@chassis-ui/website-icons`, from
[chassis-ui/website-icons](https://github.com/chassis-ui/website-icons). A project that used
the icons of `@chassis-ui/icons` installs that package, and takes `icons/<file>` from
`dist/web/<file>` and `svgs/<name>.svg` from `dist/svgs/<name>.svg`.

The `chassis-icons` command builds a repository of icons: the nearest folder upward whose
`package.json` has a `chassis` block, or `--cwd <dir>`. The `chassis.build` block names the
font, the class prefix, the frame, the styles and the targets of the set.

- `init [dir]` writes a new repository: `package.json` with the block, the scripts and the
  devDependency on the builder, `.gitignore`, `.nvmrc`, `CHANGELOG.md`, `AGENTS.md`,
  `CLAUDE.md`, and the workflows of its checks and of its release. `init --check` reports the
  files that differ from what the installed version writes, and `init --only <file…> --force`
  writes them again.
- `build` writes `dist/`: `svgs/` with one optimized SVG file per icon, `web/` with the sprite,
  the font, its stylesheets and the code points as JSON, and `icons.json`, the index of the
  set. With `"targets": ["ios", "android"]`, it also writes `dist/ios/`, an asset catalog and a
  Swift enum of the icons, and `dist/android/`, one vector drawable per icon. Beside `dist/`,
  it writes `codepoints.json`, the README and the fields of `package.json` that name the files.
  `dist/` is not committed: the release of a set builds it.
- `verify` fails when the source does not build twice to the same files, when
  `codepoints.json`, the README or a field of `package.json` is not what the source builds,
  when an icon lost its code point since the last tag, or when an icon of
  `chassis.checks.json` is missing.
- `lint-source` checks the files of `source/`: the names, the frame, the color and the pairs
  of the styles.
- `preview` writes the page of the set into `preview/`, and with `--serve` serves it at
  `http://localhost:4325/`.
- `archive` writes `<font>-web-<version>.zip`, with `icons.json`, `svgs/`, `web/` and the page
  of the set, and `<font>-<target>-<version>.zip` of each target.
- `release-notes` prints the entry of a version of `CHANGELOG.md`, and fails without one.
