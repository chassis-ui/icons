#!/usr/bin/env node

/*!
 * Fixture Script
 *
 * Writes a fresh copy of the fixture of the tests, the repository of icons of another team in
 * `packages/icons/test/fixture/`, into `.cache/fixture/`, and builds it with the build of this
 * checkout. The fixture is the one set that the checks of this repository use: the scripts
 * that look at an output, the page of the set and the native check, run on this copy.
 *
 * Usage:
 *   node build/fixture.js
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import fs from 'node:fs'
import path from 'node:path'
import { main } from '../packages/icons/lib/cli.js'

const root = path.resolve(import.meta.dirname, '..')
const fixture = path.join(root, 'packages/icons/test/fixture')
const copy = path.join(root, '.cache/fixture')

fs.rmSync(copy, { recursive: true, force: true })
fs.mkdirSync(path.dirname(copy), { recursive: true })
fs.cpSync(fixture, copy, { recursive: true })

process.exitCode = await main(['build', '--cwd', copy])
