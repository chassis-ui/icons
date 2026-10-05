#!/usr/bin/env node

/*!
 * Release Archives Script
 *
 * Writes the archive of the output of packages/icons, for the GitHub release of a version:
 * <font>-<version>.zip, with the folders `icons/` and `svgs/` at its top level, as the
 * package has them. <font> is `name` of the `chassis.build` block.
 *
 * Usage:
 *   node build/release-archives.js [--to <dir>]
 *
 * --to is the folder the archive is written to, `.cache/release` by default; an archive of
 * the font that is already in it is removed. Needs the `zip` command. Fails when the output
 * is not built.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PREVIEW_FILE, loadConfig } from '../packages/icons/build/config.js'

const PACKAGE = 'packages/icons'

function option(name, fallback) {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1]
}

/**
 * Writes the archive of the output of a package
 * @param {object} options
 * @param {string} options.packageDir - The folder of the package
 * @param {string} options.to - The folder the archive is written to
 * @returns {{ file: string, entries: string[] }} The archive, and the files in it
 */
export function releaseArchive({ packageDir, to }) {
  const config = loadConfig(packageDir)
  const entries = [config.iconsDir, config.svgsDir].flatMap((dir) =>
    (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
      .filter((name) => name !== PREVIEW_FILE && !name.startsWith('.'))
      .sort()
      .map((name) => `${path.basename(dir)}/${name}`)
  )

  if (!config.version) {
    throw new Error(`${path.join(packageDir, 'package.json')} has no version`)
  }

  if (!entries.some((entry) => entry.startsWith('icons/'))) {
    throw new Error(`No file in ${config.iconsDir}. Run the build first.`)
  }

  fs.mkdirSync(to, { recursive: true })

  for (const name of fs.readdirSync(to)) {
    if (name.startsWith(`${config.name}-`) && name.endsWith('.zip')) {
      fs.rmSync(path.join(to, name))
    }
  }

  const file = path.join(to, `${config.name}-${config.version}.zip`)

  // -X leaves out the extra file attributes, -@ reads the names of the files
  execFileSync('zip', ['-q', '-X', file, '-@'], {
    cwd: packageDir,
    input: `${entries.join('\n')}\n`,
    stdio: ['pipe', 'inherit', 'inherit']
  })

  return { file, entries }
}

function main() {
  const to = path.resolve(option('--to', '.cache/release'))
  const { file, entries } = releaseArchive({ packageDir: path.resolve(PACKAGE), to })
  const { size } = fs.statSync(file)

  console.log(
    `📦 ${path.relative(process.cwd(), file)}: ${entries.length} files, ${(size / 1024).toFixed(0)} kB`
  )
}

// Only when this file is what Node was started with, not when a test imports it
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`❌ ${error.message}`)
    process.exitCode = 1
  }
}
