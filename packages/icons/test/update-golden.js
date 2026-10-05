#!/usr/bin/env node

/**
 * @file Writes test/golden/: the output of the fixture set, built by the build as it is now.
 * Run it with `pnpm test:golden` after a change that is meant to change the output, and read
 * the diff before committing it.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build } from '../build/build.js'
import { PREVIEW_FILE, loadConfig } from '../build/config.js'
import { silentLogger } from '../build/logger.js'

const fixtureDir = path.join(import.meta.dirname, 'fixture')
const goldenDir = path.join(import.meta.dirname, 'golden')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-golden-'))

try {
  fs.cpSync(fixtureDir, dir, { recursive: true })
  await build(loadConfig(dir), { logger: silentLogger })
  fs.rmSync(path.join(dir, 'icons', PREVIEW_FILE))

  fs.rmSync(goldenDir, { recursive: true, force: true })
  fs.mkdirSync(goldenDir, { recursive: true })

  for (const entry of ['svgs', 'icons', 'codepoints.json', 'README.md']) {
    fs.cpSync(path.join(dir, entry), path.join(goldenDir, entry), { recursive: true })
  }

  console.log(`Wrote ${path.relative(process.cwd(), goldenDir)}`)
} finally {
  fs.rmSync(dir, { recursive: true, force: true })
}
