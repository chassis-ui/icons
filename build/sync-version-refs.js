#!/usr/bin/env node

/*!
 * Version Reference Sync Script
 *
 * Copies the version of the package into the places that show it and that `changeset version`
 * does not update: the badge of README.md and `currentVersion` of packages/site/config.yml.
 * Then it builds the output of the package again, so that the headers of its stylesheets name
 * the version. A version step that bumps nothing (only empty changesets) changes no file.
 *
 * Runs as part of `pnpm changeset:version`, from the root of the repository, after
 * `changeset version` has bumped packages/icons/package.json, which is the source of the
 * version.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = 'packages/icons'
const SEMVER = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?`
const SEMVER_RE = new RegExp(`^${SEMVER}$`)

// A file, the text around the version in it, and how the version is written there.
export const REFERENCES = [
  {
    file: 'README.md',
    pattern: new RegExp(`(\\[!\\[Version: )${SEMVER}(\\]\\()`),
    format: (version) => version
  },
  {
    file: 'README.md',
    // A dash separates the parts of a shields.io badge, so one in the version is doubled
    pattern: /(img\.shields\.io\/badge\/Version-)[^)]+?(-blue\.svg)/,
    format: (version) => version.replaceAll('-', '--')
  },
  {
    file: 'packages/site/config.yml',
    pattern: new RegExp(`^(currentVersion:\\s*")${SEMVER}(")`, 'm'),
    format: (version) => version
  }
]

/**
 * Reads the version of the package
 * @param {string} root - The root of the repository
 * @returns {string}
 */
export function readVersion(root) {
  const manifest = path.join(root, PACKAGE, 'package.json')
  const { version } = JSON.parse(fs.readFileSync(manifest, 'utf8'))

  if (!version || !SEMVER_RE.test(version)) {
    throw new Error(`Invalid or missing version in ${PACKAGE}/package.json: "${version}"`)
  }

  return version
}

/**
 * Writes the version into one reference
 * @param {(typeof REFERENCES)[number]} reference - The file and where the version is in it
 * @param {string} version - The package version
 * @param {string} root - The root of the repository
 * @returns {boolean} True if the file was changed
 */
export function syncReference({ file, pattern, format }, version, root) {
  const target = path.join(root, file)
  const original = fs.readFileSync(target, 'utf8')

  if (!pattern.test(original)) {
    throw new Error(`No version reference that matches ${pattern} in ${file}`)
  }

  const updated = original.replace(
    pattern,
    (_match, before, after) => `${before}${format(version)}${after}`
  )

  if (updated === original) {
    return false
  }

  fs.writeFileSync(target, updated, 'utf8')
  return true
}

/**
 * Syncs every reference, then builds the output of the package
 * @param {object} [options]
 * @param {string} [options.root] - The root of the repository
 * @param {() => void} [options.build] - Builds the output of the package
 * @param {(message: string) => void} [options.log]
 * @returns {string[]} The files that were changed
 */
export function syncVersionRefs({
  root = process.cwd(),
  build = () => execFileSync('pnpm', ['icons'], { cwd: root, stdio: 'inherit' }),
  log = console.log
} = {}) {
  const version = readVersion(root)
  log(`🔄 Syncing version references to v${version}`)

  const changed = new Set()

  for (const reference of REFERENCES) {
    if (syncReference(reference, version, root)) {
      changed.add(reference.file)
      log(`📄 Updated ${reference.file} → ${version}`)
    }
  }

  log('🔨 Building the output of the package, whose stylesheets name the version')
  build()

  log(
    changed.size > 0
      ? `✅ Synced ${[...changed].join(', ')}`
      : 'ℹ️  The references were in sync already'
  )

  return [...changed]
}

// Only when this file is what Node was started with, not when a test imports it
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    syncVersionRefs()
  } catch (error) {
    console.error(`❌ ${error.message}`)
    process.exitCode = 1
  }
}
