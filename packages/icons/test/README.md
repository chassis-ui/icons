# Tests of the build

`pnpm icons:test` runs these with [Vitest](https://vitest.dev). They use no mocks: a test that builds copies a set to a temporary folder and runs the real build there.

## The fixture

`fixture/` is the set of another team, and nothing in it is like the set that the repository ships with: eight icons on a frame of 16, the font `acme-glyphs`, the prefix `ag`, the styles `line` and `fill`, code points from `e900`, the formats `woff2` and `ttf`, and a `checks.json` of its own. Its `package.json` holds the `chassis.build` block and the site, the repository and the license of that team, and `fixture/source/` the SVG files as a design tool exports them. The manifest has none of the fields that the build writes, so that a test sees the build write them.

The tests build the fixture, not the default set, so that a part of the build that works for one set only fails here.

## The golden output

`golden/` is what the build writes for the fixture: `svgs/`, `icons/`, `codepoints.json` and `README.md`. `golden.test.js` builds the fixture and compares every file with it, byte for byte.

After a change that is meant to change the output, write the golden files again and read the diff before you commit it:

```sh
pnpm icons:test:golden
git diff packages/icons/test/golden
```

Never edit a golden file by hand. Prettier leaves the folder alone.

## The test files

| File                  | What it covers                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `names.test.js`       | The names of the icons: kebab-case, the styles, the order                                     |
| `config.test.js`      | The `chassis.build` block: its defaults, and every setting that is refused                    |
| `codepoints.test.js`  | The registry: an icon keeps its code point, a removed one is retired, the checks              |
| `templates.test.js`   | The templates of the stylesheets, and the minified CSS                                        |
| `lint-source.test.js` | The check of the source: frame, color, strokes, scripts, names, pairs                         |
| `golden.test.js`      | The build of the fixture against the golden output, its steps, and a set that changes         |
| `verify.test.js`      | `verify`: an output that is not built again, a moved code point, a missing icon of a contract |
| `manifest.test.js`    | The fields of `package.json` and the README; what npm packs, and what resolves by name        |
| `journey.test.js`     | A team that adopts the repository: its set has nothing left of the one it replaced            |
| `cli.test.js`         | The command line: its commands, its options and its exit codes                                |
| `scripts.test.js`     | The scripts of the root `build/` and the changelog entries of `.changeset/changelog.js`       |

## Adding a case

- A rule of a module: add an `it` to the test file of that module. Give it the smallest input that shows the rule.
- Something a set can hold, such as a new kind of drawing: add an SVG file to `fixture/source/`, in both styles, and write the golden files again.
- A setting: add it to `fixture/package.json` with a value that is not the default, a row to the refused settings of `config.test.js`, and write the golden files again.

`helpers.js` has `copyFixture()`, which gives a test a copy of the fixture that it may build and change. The copy is removed after the test.
