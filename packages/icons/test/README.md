# Tests of the build

`pnpm icons:test` runs these with [Vitest](https://vitest.dev). They use no mocks: a test that builds copies a repository of icons to a temporary folder and runs the real build there.

## The fixture

`fixture/` is the repository of icons of another team, `@acme/glyphs`, and its settings differ from the defaults: icons on a frame of 16, the font `acme-glyphs`, the prefix `ag`, the styles `line` and `fill`, code points from `e900`, the formats `woff2` and `ttf`, and a `checks.json` of its own. It names the targets `ios` and `android`, so that the build writes the files of both for it. Its `package.json` holds the `chassis.build` block, with `source` and `checks` set explicitly, and the site, the repository and the license of that team, and `fixture/source/` the SVG files as a design tool exports them. The manifest has none of the fields that the build writes, so that a test sees the build write them.

The tests build the fixture, the one set that the checks of this repository use, so that a part of the build that works for the defaults only fails here. `pnpm icons:fixture` copies it to `.cache/fixture/` and builds the copy, for a look at its output or its page with `pnpm icons:preview`.

## The golden output

`golden/` is what the build writes for the fixture: `dist/`, with `icons.json`, `svgs/`, `web/`, `ios/` with `AcmeGlyphs.xcassets` and `AcmeGlyphs.swift`, and `android/res/drawable/` with a drawable `ag_<name>.xml` per icon, and `codepoints.json` and `README.md`. `golden.test.js` builds the fixture and compares every file with it, byte for byte. The page of the set is not output, so it has no golden file: `preview.test.js` checks it.

After a change that is meant to change the output, write the golden files again and read the diff before you commit it:

```bash
pnpm icons:test:golden
git diff packages/icons/test/golden
```

Never edit a golden file by hand. Prettier leaves the folder alone.

## The test files

| File                    | What it covers                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `names.test.js`         | The names of the icons: kebab-case, the styles, the order                                                                                                                                                                                                                                                           |
| `config.test.js`        | The `chassis.build` block: its defaults, the folders it resolves, and every setting that is refused                                                                                                                                                                                                                 |
| `codepoints.test.js`    | The registry: an icon keeps its code point, a removed one is retired, the checks                                                                                                                                                                                                                                    |
| `templates.test.js`     | The templates of the stylesheets, and the minified CSS                                                                                                                                                                                                                                                              |
| `preview.test.js`       | The page of the set: what it links and draws, the JSON of the icons it carries, the command that writes it into `preview/` from `dist/`, and the server of `--serve`                                                                                                                                                |
| `lint-source.test.js`   | The check of the source: frame, color, strokes, scripts, names, pairs                                                                                                                                                                                                                                               |
| `golden.test.js`        | The build of the fixture against the golden output, its steps, what a whole build removes from `dist/`, and a set that changes, in the registry, the stylesheet and the index. The steps of the targets: one that the configuration does not name is refused, and the folders of the targets go when the targets do |
| `targets.test.js`       | The `targets` setting and its order; for `ios`, the names of the module, the enum and the cases, two icons with one case, the image sets and the Swift file; for `android`, the names of the drawables, the conversion, and a file that draws nothing                                                               |
| `verify.test.js`        | `verify`: a set that passes with or without `dist/`, a `README.md` and a `codepoints.json` that are not built again, `dist/` of the working copy left alone, two builds that write the same files, a moved code point, a tag made before `dist/`, a missing icon of a contract                                      |
| `manifest.test.js`      | The fields of `package.json`, and what they replace of the layout before `dist/`, and the README of a set; what npm packs of a set, its output for the web with `dist/` in `.gitignore`, and of the builder; and what resolves by name                                                                              |
| `archive.test.js`       | `archive`: the archive of the output for the web and of the page of the set, the archive of each target, where they are written, and an output that is not built                                                                                                                                                    |
| `release-notes.test.js` | `release-notes`: the entry of a version in either style of changelog, and a version without one                                                                                                                                                                                                                     |
| `init.test.js`          | `init`: the files it plans and writes, its options and their defaults, `--only`, `--check` and a dry run                                                                                                                                                                                                            |
| `journey.test.js`       | A team that writes a repository with `init`, saves its SVG files, builds, verifies, archives, and passes `init --check`                                                                                                                                                                                             |
| `cli.test.js`           | The command line: its commands, its options, where it finds the repository, and its exit codes                                                                                                                                                                                                                      |
| `scripts.test.js`       | The scripts of the root: delegation with `run`, and the command of this checkout run on the copy of the fixture only; the changelog entry of a changeset; `checkChangeset` and `syncVersionRefs` of `build/`                                                                                                        |

## The native check

The tests read the output of the targets as text. `test/native/check.sh` compiles it with the tools of the platforms, which Vitest does not have, so CI does not run it. Run it after a change to `lib/ios.js`, `lib/android.js` or their output, on a machine with Xcode and the Android SDK. `pnpm icons:native` builds a copy of the fixture with `pnpm icons:fixture` and runs it on `.cache/fixture`. It takes any built repository of icons, and the targets to check:

```bash
packages/icons/test/native/check.sh <repository> [ios] [android]
```

For `ios`, it compiles each asset catalog of `dist/ios/` with actool, checks that each image set is a template image, and type-checks the Swift file in the Swift 5 and the Swift 6 language modes. For `android`, it compiles `dist/android/res/` with aapt2, links it against `android.jar`, and checks that `R.drawable` has a drawable per file. It finds the newest build tools and platform of `ANDROID_HOME` or `ANDROID_SDK_ROOT`, and `AAPT2` and `ANDROID_JAR` name them. Without a target, it checks those that `dist/` has. It writes to a temporary folder only.

## The test of the site

The site has a test of its own, in `packages/site/test/`, which `pnpm site:test` runs. The site is the documentation of the builder and shows no set: the test checks the built site, that every page is there, that every icon a page draws is in a sprite that the site serves, and that every link leads to a page that exists. It needs the files of `vendor/assets`, which `pnpm vendor` writes, so it runs in the Site job of CI and not with these tests.

## Adding a case

- A rule of a module: add an `it` to the test file of that module. Give it the smallest input that shows the rule.
- Something a set can hold, such as a new kind of drawing: add an SVG file to `fixture/source/`, in both styles, and write the golden files again.
- A setting: add it to `fixture/package.json` with a value that is not the default, a row to the refused settings of `config.test.js`, and write the golden files again.
- A file of `init`: add it to `templates/`, to the plan in `init.js`, and to the files that `journey.test.js` expects in the repository it writes.

`helpers.js` has `copyFixture()`, which gives a test a copy of the fixture that it may build and change, and `temporaryDir()`, an empty folder for a repository that `init` writes. Both are removed after the test.
