## What this changes

<!-- One or two sentences. If it fixes an open issue, add "Fixes #123". -->

## Why

<!-- The problem this solves. For an icon, where it is needed. -->

## How to check it

<!--
The quickest way for a reviewer to see it: the icons to look at in
`packages/icons/icons/preview.html` or on the site, or the check that fails without the change.
-->

---

See [CONTRIBUTING.md](https://github.com/chassis-ui/icons/blob/develop/.github/CONTRIBUTING.md#what-a-pull-request-needs-before-merge)
for the details behind each of these.

- [ ] The pull request targets `develop`
- [ ] `pnpm icons:test`, `pnpm icons:lint`, `pnpm icons:typecheck` and `pnpm icons:lint:package`
      pass, and the golden files were written again with `pnpm icons:test:golden` if the output
      is meant to change, if the build, its templates or the manifest of the package changed
- [ ] `pnpm icons:verify` passes on `vendor/icons`, if the build changed: the Chassis set builds
      to its committed output, or the changeset says what changes in the output of a set
- [ ] **Changeset** (`pnpm changeset`) if `packages/icons/lib/` or `packages/icons/templates/`
      changed, saying what changes for a repository of icons; an empty one
      (`pnpm changeset --empty`) if it changed but nothing is released.
      `pnpm changeset:check develop` passes
- [ ] `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`, `pnpm check:astro`,
      `pnpm site:build` and `pnpm site:test` pass, if the site changed
- [ ] `pnpm lint:prettier` passes, and `pnpm spellcheck` if a Markdown file changed
