# Changesets

A change to `source/`, to `packages/icons/build/` or to the output in `packages/icons/icons/`
and `packages/icons/svgs/` adds a changeset: a Markdown file in this folder that names the
version bump and the text of the changelog entry. Run `pnpm changeset` to write one. Changes
to the site, the tests and the documents need none.

Before 1.0, a change that removes or renames an icon, a file of the package, the class prefix
or the font is a `minor` bump, and its summary starts with `**Breaking.**` and names the old
and the new name. A new icon is a `minor` bump too. Everything else is a `patch`.

To release, run `pnpm changeset:version` on `develop`. It bumps the version in
`packages/icons/package.json`, writes `packages/icons/CHANGELOG.md`, copies the version to the
places that show it and builds the output again. Commit that, and push it to `develop`, then
to `main`. The push to `main` publishes the package and creates the tag and the GitHub
release. See [Releases](../.github/CONTRIBUTING.md#releases).
