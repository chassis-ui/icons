#!/usr/bin/env node

/**
 * @file Writes `<font>-<version>.zip` into the package: the files of `icons/` and, in a
 * folder of their own, those of `svgs/`.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { PREVIEW_FILE, loadConfig } from './config.js'
import { createLogger } from './logger.js'

const logger = createLogger()
const config = loadConfig(path.resolve(import.meta.dirname, '..'))
const folder = `${config.name}-${config.version}`
const staging = path.join(config.packageDir, folder)
const archive = `${folder}.zip`

fs.rmSync(staging, { recursive: true, force: true })
fs.rmSync(path.join(config.packageDir, archive), { force: true })

try {
  fs.cpSync(config.iconsDir, staging, {
    recursive: true,
    filter: (source) => path.basename(source) !== PREVIEW_FILE
  })
  fs.cpSync(config.svgsDir, path.join(staging, 'svgs'), { recursive: true })
  execFileSync('zip', ['-qr9', archive, folder], { cwd: config.packageDir, stdio: 'inherit' })
  logger.success(`Created ${path.relative(process.cwd(), path.join(config.packageDir, archive))}`)
} finally {
  fs.rmSync(staging, { recursive: true, force: true })
}
