#!/usr/bin/env node

/*!
 * Changeset Check Script
 *
 * Fails when the commits since a base change what a release is made of and add no changeset:
 * the source folder of the icons, the build of packages/icons, or its output in `icons/` and
 * `svgs/`. `changeset status` cannot do this alone: the source folder is at the root of the
 * repository, outside the package that carries the version, so Changesets counts a change to
 * it for no package.
 *
 * A release commit passes: `pnpm changeset:version` removes the changesets and bumps the
 * version, so a changed version stands for them.
 *
 * Usage:
 *   node build/check-changeset.js <base>
 *
 * <base> is a commit or a branch: `origin/develop` for a pull request against `develop`,
 * the tip that a push replaced for a push. The comparison starts at the merge base. Needs
 * Git and the history up to the base.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = 'packages/icons'
const MANIFEST = `${PACKAGE}/package.json`
const DEFAULT_SOURCE = '../../source'
const CHANGESET_RE = /^\.changeset\/(?!README\.md$)[^/]+\.md$/

/**
 * The folders whose files a release is made of, from the root of the repository
 * @param {Record<string, any>} manifest - The contents of the package.json of the package
 * @returns {string[]} Each with a `/` at its end
 */
export function releasedPaths(manifest) {
  const source = path.posix.normalize(
    path.posix.join(PACKAGE, manifest.chassis?.build?.source ?? DEFAULT_SOURCE)
  )

  return [`${source}/`, `${PACKAGE}/build/`, `${PACKAGE}/icons/`, `${PACKAGE}/svgs/`]
}

/**
 * Decides whether a range of commits needs a changeset that it does not have
 * @param {object} range
 * @param {{ status: string, file: string }[]} range.changes - The files the commits change,
 *   with the status that `git diff --name-status` gives each
 * @param {string[]} range.released - The folders of `releasedPaths`
 * @param {string | null} range.versionBefore - The version of the package at the base
 * @param {string | null} range.versionAfter - The version of the package now
 * @returns {{ ok: boolean, message: string, files: string[] }} `files` are the released
 *   files that changed
 */
export function checkChangeset({ changes, released, versionBefore, versionAfter }) {
  const files = changes
    .filter(({ file }) => released.some((dir) => file.startsWith(dir)))
    .map(({ file }) => file)
  const changesets = changes.filter(({ status, file }) => status === 'A' && CHANGESET_RE.test(file))
  const count = `${files.length} released file${files.length === 1 ? '' : 's'} changed`

  if (files.length === 0) {
    return { ok: true, message: 'No released file changed, no changeset needed', files }
  }

  if (changesets.length > 0) {
    return {
      ok: true,
      message: `${count}, with ${changesets.length} changeset${changesets.length === 1 ? '' : 's'}`,
      files
    }
  }

  if (versionBefore !== versionAfter) {
    return { ok: true, message: `${count}, in the release of ${versionAfter}`, files }
  }

  return {
    ok: false,
    message: `${count}, and no changeset was added. Run pnpm changeset and commit the file.`,
    files
  }
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function versionAt(commit) {
  try {
    return JSON.parse(git('show', `${commit}:${MANIFEST}`)).version ?? null
  } catch {
    return null
  }
}

function main() {
  const base = process.argv[2]

  if (!base) {
    console.error('USAGE: check-changeset <base>')
    process.exit(1)
  }

  const mergeBase = git('merge-base', base, 'HEAD')
  const changes = git('diff', '--name-status', '--no-renames', mergeBase, 'HEAD')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, file] = line.split('\t')
      return { status, file }
    })
  const released = releasedPaths(JSON.parse(fs.readFileSync(MANIFEST, 'utf8')))
  const { ok, message, files } = checkChangeset({
    changes,
    released,
    versionBefore: versionAt(mergeBase),
    versionAfter: versionAt('HEAD')
  })

  if (ok) {
    console.log(`✅ ${message}`)
    return
  }

  console.error(`❌ ${message}`)
  console.error(`   A release is made of ${released.join(', ')}`)

  for (const file of files.slice(0, 10)) {
    console.error(`   ${file}`)
  }

  process.exit(1)
}

// Only when this file is what Node was started with, not when a test imports it
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
