#!/usr/bin/env node

/*!
 * Version Reference Sync Script
 *
 * Copies the version of @chassis-ui/icons into the places that show it and that
 * `changeset version` does not update: the badge of README.md, `currentVersion` of
 * packages/site/config.yml, and the header of the font templates in
 * packages/icons/build/font/. When the header of packages/icons/icons/chassis-icons.css then
 * names another version, it rebuilds the output of the package with `pnpm icons`. A version
 * step that bumps nothing (only empty changesets) leaves them as they are.
 *
 * Runs as part of `pnpm changeset:version`, from the root of the repository, after
 * `changeset version` has bumped packages/icons/package.json, which is the source of the
 * version.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const PACKAGE = 'packages/icons'
const SEMVER = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?`
const SEMVER_RE = new RegExp(`^${SEMVER}$`)
const HEADER_RE = new RegExp(`Chassis Icons v(${SEMVER})`)

// A file, the text around the version in it, and how the version is written there.
const REFERENCES = [
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
  },
  {
    file: `${PACKAGE}/build/font/css.hbs`,
    pattern: new RegExp(`(Chassis Icons v)${SEMVER}()`),
    format: (version) => version
  },
  {
    file: `${PACKAGE}/build/font/scss.hbs`,
    pattern: new RegExp(`(Chassis Icons v)${SEMVER}()`),
    format: (version) => version
  }
]

async function readVersion() {
  const pkg = JSON.parse(await fs.readFile(path.join(PACKAGE, 'package.json'), 'utf8'))

  if (!pkg.version || !SEMVER_RE.test(pkg.version)) {
    console.error(`❌ Invalid or missing version in ${PACKAGE}/package.json: "${pkg.version}"`)
    process.exit(1)
  }

  return pkg.version
}

/**
 * Writes the version into one reference
 * @param {(typeof REFERENCES)[number]} reference - The file and where the version is in it
 * @param {string} version - The package version
 * @returns {Promise<boolean>} True if the file was changed
 */
async function syncReference({ file, pattern, format }, version) {
  const original = await fs.readFile(file, 'utf8')

  if (!pattern.test(original)) {
    console.error(`❌ No version reference that matches ${pattern} in ${file}`)
    process.exit(1)
  }

  const updated = original.replace(
    pattern,
    (_match, before, after) => `${before}${format(version)}${after}`
  )

  if (updated === original) {
    return false
  }

  await fs.writeFile(file, updated, 'utf8')
  console.log(`📄 Updated ${file} → ${version}`)
  return true
}

/**
 * Rebuilds the output of the package when the header of its stylesheet names another version
 * @param {string} version - The package version
 * @returns {Promise<boolean>} True if the output was rebuilt
 */
async function syncIcons(version) {
  const stylesheet = `${PACKAGE}/icons/chassis-icons.css`
  const match = HEADER_RE.exec(await fs.readFile(stylesheet, 'utf8'))

  if (match && match[1] === version) {
    return false
  }

  console.log(`🔨 ${stylesheet} names another version, rebuilding the output`)
  execFileSync('pnpm', ['icons'], { stdio: 'inherit' })
  return true
}

async function main() {
  const version = await readVersion()
  console.log(`🔄 Syncing version references to v${version}`)

  const results = []

  for (const reference of REFERENCES) {
    results.push(await syncReference(reference, version))
  }

  results.push(await syncIcons(version))

  const updatedCount = results.filter(Boolean).length

  console.log(
    updatedCount > 0
      ? `✅ Synced ${updatedCount} of ${results.length} references`
      : 'ℹ️  Already in sync, nothing to update'
  )
}

main().catch((error) => {
  console.error(`❌ Unexpected error: ${error.message}`)
  process.exit(1)
})
