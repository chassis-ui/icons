/**
 * @file What the tests share: the fixture set, copied to a temporary folder for each test
 * that builds, and a few ways to look at folders.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach } from 'vitest'
import { PREVIEW_FILE } from '../build/config.js'

export const packageDir = path.resolve(import.meta.dirname, '..')
export const fixtureDir = path.join(import.meta.dirname, 'fixture')
export const goldenDir = path.join(import.meta.dirname, 'golden')

const temporary = []

afterEach(() => {
  for (const dir of temporary.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

/**
 * @returns {string} A new folder, removed after the test
 */
export function temporaryDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-test-'))

  temporary.push(dir)
  return dir
}

/**
 * @returns {string} A copy of the fixture set that a test may build and change
 */
export function copyFixture() {
  const dir = temporaryDir()

  fs.cpSync(fixtureDir, dir, { recursive: true })
  return dir
}

/**
 * The files of a folder and of its folders, without the preview page and hidden files.
 * @param {string} dir
 * @returns {string[]} Their paths from `dir`, with `/`, sorted
 */
export function listFiles(dir) {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== PREVIEW_FILE && !entry.name.startsWith('.'))
    .map((entry) =>
      path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
    )
    .sort()
}

/**
 * The output of a package: `svgs/`, `icons/` and the registry.
 * @param {string} dir - The folder of the package
 * @returns {Record<string, Buffer>} The contents of each file, by its path from `dir`
 */
export function readOutput(dir) {
  const files = [
    ...listFiles(path.join(dir, 'svgs')).map((file) => `svgs/${file}`),
    ...listFiles(path.join(dir, 'icons')).map((file) => `icons/${file}`),
    'codepoints.json'
  ]

  return Object.fromEntries(files.map((file) => [file, fs.readFileSync(path.join(dir, file))]))
}

/**
 * @returns {{ log: string[], warn: string[], error: string[] } & Pick<Console, 'log' | 'warn' | 'error'>}
 *   A console that keeps what it is told
 */
export function recordingConsole() {
  const lines = { log: [], warn: [], error: [] }

  return /** @type {any} */ ({
    lines,
    log: (/** @type {string} */ message) => lines.log.push(message),
    warn: (/** @type {string} */ message) => lines.warn.push(message),
    error: (/** @type {string} */ message) => lines.error.push(message)
  })
}
