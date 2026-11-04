# @chassis-ui/icons

The builder of icon sets of Chassis UI, for any team that wants a library of icons of its
own: the `chassis-icons` command builds a repository of SVG files into one optimized
SVG file per icon, an SVG sprite, an icon font with its CSS and SCSS and the index of the
set, and writes the manifest and the README of the package that holds them. For a set that
names the targets `ios` and `android`, it also writes an asset catalog with a Swift file and
vector drawables. The build is file-driven: save
`<name>.svg` into `source/` and the icon is in the next build. The font name, the class
prefix, the frame and the styles are settings. The package holds the build and no icons.

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
pnpm build     # chassis-icons build: dist/, codepoints.json, README.md, package.json
pnpm verify    # chassis-icons verify: the source builds, and the committed files are up to date
pnpm preview   # chassis-icons preview --serve: the page of the set, at http://localhost:4325/
```

`pnpm build` writes `dist/svgs/<name>.svg`, `dist/web/<font>.{css,min.css,scss,json,svg,woff,woff2}`
and `dist/icons.json`, the index of the set. `dist/` is not committed: `.gitignore` names
it, and the release workflow builds it again. The build also writes `codepoints.json`, the
registry of the code points, the fields of `package.json` that name the files, and
`README.md`, which shows the four ways to use an icon of your set: the font class, the
sprite, the SVG file and Sass. Commit those with `source/`. The package publishes
`dist/icons.json`, `dist/svgs/` and `dist/web/`.

With `"targets": ["ios", "android"]` in `chassis.build`, the build also writes
`dist/ios/<module>.xcassets`, an image set per icon that renders as a template image in the
tint of its view, and `dist/ios/<module>.swift`, an enum with a case per icon; and
`dist/android/res/drawable/<prefix>_<name>.xml`, a vector drawable per icon. `<module>` is
the font name in PascalCase, `acme-icons` gives `AcmeIcons`. The package does not publish
them: the release attaches `<font>-ios-<version>.zip` and `<font>-android-<version>.zip` to
its GitHub release, and the README shows how an app adds them.

`pnpm preview` writes the page of the set into `preview/` from `dist/`, and serves it until
stopped. The page is drawn with Chassis CSS: search the icons, and click one for a drawer
with the icon at size, examples of it in Chassis components, and the code that draws it, to
copy. `preview/` is not committed and not published.

## Commands

| Command                       | What it does                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chassis-icons build`         | Writes the output. `--only svgs\|sprite\|font\|ios\|android\|package` runs one step, `--dry-run` lists the files that would change                                                                         |
| `chassis-icons verify`        | Fails when the source does not build twice to the same files, `codepoints.json`, `README.md` or `package.json` is out of date, an icon lost its code point, or an icon of `chassis.checks.json` is missing |
| `chassis-icons lint-source`   | Checks the files of `source/`: names, frame, one color, no stroke, the pairs of the styles                                                                                                                 |
| `chassis-icons preview`       | Writes the page of the set into `preview/`. `--serve` serves it at `http://localhost:4325/`, `--port <n>` at another port                                                                                  |
| `chassis-icons archive`       | Writes `archives/<font>-web-<version>.zip`, with `icons.json`, `svgs/`, `web/` and `preview/` in it, and `archives/<font>-<target>-<version>.zip` of each target, for a release                            |
| `chassis-icons release-notes` | Prints the `CHANGELOG.md` entry of the version, and fails without one                                                                                                                                      |
| `chassis-icons init [dir]`    | Writes the files of a new repository of icons                                                                                                                                                              |

Every command but `init` works on one repository of icons: `--cwd <dir>`, by default the
nearest folder upward from the working directory whose `package.json` has a `chassis` block.
`chassis-icons --help` prints every option.

## Configuration

The `chassis.build` block of `package.json`:

| Setting          | Default                 | What it sets                                                                                      |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `name`           | required                | The name of the font, and of every file of `dist/web/`                                            |
| `prefix`         | required                | What a class starts with: `<prefix>-<icon>`                                                       |
| `source`         | `"source"`              | The folder of your SVG files                                                                      |
| `checks`         | `"chassis.checks.json"` | The file of the icons that others read by name. It may not exist                                  |
| `frame`          | `24`                    | The width and the height of the frame an icon is drawn on                                         |
| `styles`         | `[]`                    | The last part a name may have, such as `["outline", "solid"]`. Any kebab-case name when empty     |
| `pairs`          | `[]`                    | The styles an icon comes in together, such as `[["outline", "solid"]]`                            |
| `startCodepoint` | `"f101"`                | The code point of the first icon of a new set, in the Private Use Area                            |
| `formats`        | `["woff2", "woff"]`     | The font formats, in the order of the `src` of the font face: `woff2`, `woff`, `ttf`              |
| `header`         | `[]`                    | The lines of the comment at the top of each stylesheet. `{version}` is the version of the package |
| `targets`        | `[]`                    | The targets besides the web, which is always built: `ios`, `android`                              |

The [documentation](https://chassis-ui.com/icons/docs/) describes the build, drawing icons
for a set and using the output in a project. The [repository](https://github.com/chassis-ui/icons)
holds the build and its site.

## License

MIT
