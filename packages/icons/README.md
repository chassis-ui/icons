# @chassis-ui/icons

The builder of icon sets of the Chassis Design System, and of any team that wants a library
of its own: the `chassis-icons` command builds a repository of SVG files into one optimized
SVG file per icon, an SVG sprite and an icon font with its CSS and SCSS, and writes the
manifest and the README of the package that holds them. The build is file-driven: save
`<name>.svg` into `source/` and the icon is in the next build. The font name, the class
prefix, the frame and the styles are settings.

The icons of the Chassis Design System are a repository of icons built with it:
[`@chassis-ui/website-icons`](https://www.npmjs.com/package/@chassis-ui/website-icons).

## A repository of icons

```bash
npx @chassis-ui/icons init acme-icons --pm pnpm
cd acme-icons
git init
pnpm install
```

`init` writes `package.json` with the `chassis.build` block, the scripts and the dependency
on this package, `.gitignore`, `.nvmrc`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, a CI
workflow and a release workflow. Save the SVG files of your icons into `source/`, one per
icon, and build:

```bash
pnpm lint      # chassis-icons lint-source: each file that cannot be an icon, and why
pnpm build     # chassis-icons build: svgs/, icons/, codepoints.json, README.md, package.json
pnpm verify    # chassis-icons verify: the output is what the source builds
```

Commit `source/` and the output together. `pnpm build` writes `svgs/<name>.svg`,
`icons/<font>.{css,min.css,scss,json,svg,woff,woff2}`, `codepoints.json`, the registry of
the code points, and `README.md`, which shows the four ways to use an icon of your set: the
font class, the sprite, the SVG file and Sass.

## Commands

| Command                       | What it does                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `chassis-icons build`         | Writes the output. `--only svgs\|sprite\|font\|package` runs one step, `--dry-run` lists the files that would change          |
| `chassis-icons verify`        | Fails when the output differs from a fresh build, an icon lost its code point, or an icon of `chassis.checks.json` is missing |
| `chassis-icons lint-source`   | Checks the files of `source/`: names, frame, one color, no stroke, the pairs of the styles                                    |
| `chassis-icons archive`       | Writes `archives/<font>-<version>.zip`, with `icons/` and `svgs/` in it, for a release                                        |
| `chassis-icons release-notes` | Prints the `CHANGELOG.md` entry of the version, and fails without one                                                         |
| `chassis-icons init [dir]`    | Writes the files of a new repository of icons                                                                                 |

Every command but `init` works on one repository of icons: `--cwd <dir>`, by default the
nearest folder upward from the working directory whose `package.json` has a `chassis` block.
`chassis-icons --help` prints every option.

## Configuration

The `chassis.build` block of `package.json`:

| Setting          | Default                 | What it sets                                                                                      |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `name`           | required                | The name of the font, and of every file of `icons/`                                               |
| `prefix`         | required                | What a class starts with: `<prefix>-<icon>`                                                       |
| `source`         | `"source"`              | The folder of your SVG files                                                                      |
| `checks`         | `"chassis.checks.json"` | The file of the icons that others read by name. It may not exist                                  |
| `frame`          | `24`                    | The width and the height of the frame an icon is drawn on                                         |
| `styles`         | `[]`                    | The last part a name may have, such as `["outline", "solid"]`. Any kebab-case name when empty     |
| `pairs`          | `[]`                    | The styles an icon comes in together, such as `[["outline", "solid"]]`                            |
| `startCodepoint` | `"f101"`                | The code point of the first icon of a new set, in the Private Use Area                            |
| `formats`        | `["woff2", "woff"]`     | The font formats, in the order of the `src` of the font face: `woff2`, `woff`, `ttf`              |
| `header`         | `[]`                    | The lines of the comment at the top of each stylesheet. `{version}` is the version of the package |

The [documentation](https://chassis-ui.com/icons/docs/) describes the build, drawing icons
for a set and using the output in a project. The [repository](https://github.com/chassis-ui/icons)
holds the build and its site.

## License

MIT
