#!/usr/bin/env node

/*!
 * Release Notes Script
 *
 * Prints the CHANGELOG entry of one version of the package in packages/icons, without its
 * heading, for the body of the GitHub release, with the release-notes module of the build.
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
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readReleaseNotes } from '../packages/icons/lib/release-notes.js'

const PACKAGE = 'packages/icons'

function main() {
  try {
    process.stdout.write(readReleaseNotes(path.resolve(PACKAGE), process.argv[2]))
  } catch (error) {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  }
}

// Only when this file is what Node was started with, not when a test imports it
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
