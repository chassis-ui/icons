# Security Policy

## Supported versions

`@chassis-ui/icons` is pre-1.0. Only the latest published version gets fixes; there are no
maintenance branches for older versions.

The published package is the builder: the `chassis-icons` command, its templates and its
dependencies. It runs on the machines and in the CI of the teams that build a set with it, and
never in an app. What it writes into a repository of icons, in `dist/`, is generated files
only: SVG files, an SVG sprite, the icon font, its CSS and SCSS, and JSON. The page of a set,
which `chassis-icons preview` writes into `preview/`, holds a script, and `--serve` serves it on
`localhost` only. The scripts in `build/` and the documentation site run on contributors'
machines, in CI and on Vercel.

## Reporting a vulnerability

**Please don't open a public GitHub issue for a security vulnerability.**

Instead, use GitHub's private vulnerability reporting for this repository:
[github.com/chassis-ui/icons/security/advisories/new](https://github.com/chassis-ui/icons/security/advisories/new).
This opens a private thread visible only to you and the maintainers, so a fix can be released
before any public write-up.

If you can't use GitHub's private reporting, open a regular issue asking a maintainer to reach out
for a private channel, without including any details of the vulnerability.

We'll acknowledge new reports and keep you updated while we investigate and fix a confirmed issue.
Please give us reasonable time to release a fix before any public disclosure.
