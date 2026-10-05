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
- [ ] **`packages/icons/` rebuilt** with `pnpm icons` and committed, and the pages of the new
      icons written with `pnpm site:pages`, if `source/` or the font templates changed
- [ ] `pnpm icons:lint:source`, `pnpm icons:verify`, `pnpm icons:test` and `pnpm icons:lint` pass
- [ ] **Changeset** (`pnpm changeset`) if the output in `packages/icons/` changed, naming the
      icons that are added, renamed or removed; an empty one (`pnpm changeset --empty`) if it
      changed but nothing is released
- [ ] `pnpm site:lint:eslint`, `pnpm site:lint:stylelint`, `pnpm site:lint:prettier`,
      `pnpm check:astro` and `pnpm site:build` pass, if the site changed
