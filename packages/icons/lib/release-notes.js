/**
 * @file The changelog entry of one version, without its heading, for the body of its GitHub
 * release. A step of CI and the release run it, so a version without an entry is not
 * released. It reads both heading styles: that of Changesets (`## 0.4.0`) and that of Keep a
 * Changelog (`## [0.3.1] - 2026-07-13`).
 */

import fs from 'node:fs'
import path from 'node:path'

/** The changelog of a repository, at its root. */
export const CHANGELOG_FILE = 'CHANGELOG.md'

/**
 * The entry of one version: the lines between its `## ` heading and the next heading of that
 * level or above, outside a code block.
 * @param {string} changelog - The text of the changelog
 * @param {string} version - The version, without a leading `v`
 * @returns {string | null} The entry, trimmed, or null when the version has no heading
 */
export function releaseNotes(changelog, version) {
  const quoted = version.replace(/[$()*+.?[\\\]^{|}-]/g, '\\$&')
  const heading = new RegExp(`^## \\[?${quoted}\\]?(?:\\s|$)`)
  const lines = changelog.split('\n')
  let start = -1
  let end = lines.length
  let inFence = false

  for (const [index, line] of lines.entries()) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
    } else if (!inFence && start === -1) {
      if (heading.test(line)) start = index
    } else if (!inFence && /^##? /.test(line)) {
      end = index
      break
    }
  }

  if (start === -1) return null

  return lines
    .slice(start + 1, end)
    .join('\n')
    .trim()
}

/**
 * The entry of a version in the changelog of a folder.
 * @param {string} dir - The folder of CHANGELOG.md and package.json
 * @param {string} [version] - The version; that of package.json when left out
 * @returns {string} The entry, with a line break at its end
 * @throws {Error} When there is no changelog, no entry for the version, or an empty one
 */
export function readReleaseNotes(dir, version) {
  let wanted = version

  if (wanted === undefined) {
    const manifestFile = path.join(dir, 'package.json')

    if (!fs.existsSync(manifestFile)) {
      throw new Error(`There is no package.json in ${dir}. Give the version.`)
    }

    wanted = JSON.parse(fs.readFileSync(manifestFile, 'utf8')).version

    if (typeof wanted !== 'string' || wanted === '') {
      throw new Error(`The package.json of ${dir} has no version. Give the version.`)
    }
  }

  wanted = wanted.replace(/^v/, '')

  const file = path.join(dir, CHANGELOG_FILE)

  if (!fs.existsSync(file)) {
    throw new Error(`${dir} has no ${CHANGELOG_FILE}. Add it, with an entry for ${wanted}.`)
  }

  const notes = releaseNotes(fs.readFileSync(file, 'utf8'), wanted)

  if (notes === null) {
    throw new Error(`${CHANGELOG_FILE} has no entry for ${wanted}. Add it.`)
  }

  if (notes === '') {
    throw new Error(`The entry of ${CHANGELOG_FILE} for ${wanted} is empty.`)
  }

  return `${notes}\n`
}
