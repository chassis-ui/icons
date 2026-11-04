# Changesets

A change to `packages/icons/lib/` or to `packages/icons/templates/` adds a changeset: a
Markdown file in this folder that names the version bump and the text of the changelog
entry. Run `pnpm changeset` to write one. Changes to the site, the tests and the documents
need none. A set of icons is a repository of its own, with a changelog of its own.

Before 1.0, a change that changes the output of a set, a file that `init` writes, the
options of a command or a default of `chassis.build` is a `minor` bump, and its summary
starts with `**Breaking.**` and says what a repository of icons sees. A new command or
option is a `minor` bump too. Everything else is a `patch`.

To release, run `pnpm changeset:version` on `develop`. It bumps the version in
`packages/icons/package.json`, writes `packages/icons/CHANGELOG.md` and copies the version to
the places that show it. Commit that, and push it to `develop`, then to `main`. The push to
`main` publishes the package and creates the tag and the GitHub release. See
[Releases](../.github/CONTRIBUTING.md#releases).
