---
'@chassis-ui/icons': minor
---

**Breaking.** The package is the builder of icon sets, and ships no icons. The `chassis-icons`
command builds a repository of icons: `build`, `verify`, `lint-source`, `archive`,
`release-notes`, and `init`, which writes a new repository with its `package.json`, its
workflows and its instructions. Every command works on the nearest folder upward whose
`package.json` has a `chassis` block, or on `--cwd <dir>`. The defaults of `source` and
`checks` in `chassis.build` are `source` and `chassis.checks.json`, beside `package.json`.
The icons of the Chassis website are `@chassis-ui/website-icons`, from
[chassis-ui/website-icons](https://github.com/chassis-ui/website-icons), with the files in
`dist/`: replace `@chassis-ui/icons` with `@chassis-ui/website-icons` in a project that uses
the set, `icons/` with `dist/web/`, and `svgs/` with `dist/svgs/`.
