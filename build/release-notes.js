#!/usr/bin/env node

/*!
 * Release Notes Script
 *
 * Prints the CHANGELOG entry of one version of @chassis-ui/icons, without its heading, for the
 * body of the GitHub release. Reads both heading styles of packages/icons/CHANGELOG.md: the
 * Changesets style (`## 0.4.0`) and the older hand-written style (`## [0.3.0] - 2026-07-04`).
 *
 * Usage:
 *   node build/release-notes.js [version]
 *
 * Without a version, it uses the version in packages/icons/package.json. Fails when the
 * CHANGELOG has no entry for the version, or the entry is empty.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import { realpathSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = 'packages/icons'
const CHANGELOG = path.join(PACKAGE, 'CHANGELOG.md')

function regExpQuote(string) {
  return string.replace(/[$()*+-.?[\\\]^{|}]/g, '\\$&')
}

/**
 * Returns the lines of one version's entry, between its `## ` heading and the next `## `
 * heading outside a code block
 * @param {string} changelog - The CHANGELOG text
 * @param {string} version - The version, without a leading `v`
 * @returns {string | null} The entry, trimmed, or null when there is no heading for the version
 */
export function releaseNotes(changelog, version) {
  const heading = new RegExp(`^## \\[?${regExpQuote(version)}\\]?(?:\\s|$)`)
  const lines = changelog.split('\n')
  const start = lines.findIndex((line) => heading.test(line))

  if (start === -1) {
    return null
  }

  let inFence = false
  let end = lines.length

  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index]

    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
    } else if (!inFence && /^##? /.test(line)) {
      end = index
      break
    }
  }

  return lines
    .slice(start + 1, end)
    .join('\n')
    .trim()
}

async function main() {
  let version = process.argv[2]

  if (!version) {
    const pkg = JSON.parse(await fs.readFile(path.join(PACKAGE, 'package.json'), 'utf8'))
    version = pkg.version
  }

  version = version.replace(/^v/, '')

  const notes = releaseNotes(await fs.readFile(CHANGELOG, 'utf8'), version)

  if (notes === null) {
    console.error(`❌ ${CHANGELOG} has no entry for ${version}`)
    process.exit(1)
  }

  if (notes === '') {
    console.error(`❌ The ${CHANGELOG} entry for ${version} is empty`)
    process.exit(1)
  }

  process.stdout.write(`${notes}\n`)
}

// Only when this file is what Node was started with, not when a test imports it
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`❌ Unexpected error: ${error.message}`)
    process.exit(1)
  })
}
