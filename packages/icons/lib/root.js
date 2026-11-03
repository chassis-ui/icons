/**
 * @file Where a command runs, and which version of the build it is. A repository of icons
 * holds `source/`, the output and the `chassis` block of its `package.json` at its root, and
 * the build is in a package that it installs. So the root is found, not assumed: from the
 * working directory upward, or given with `--cwd`.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Reads a package.json.
 * @param {string} dir - Its folder
 * @returns {Record<string, any> | undefined} Its contents, or undefined when there is none
 */
function readPackage(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * The nearest folder, from `start` upward, whose package.json has a `chassis` block.
 * @param {string} [start] - The working directory by default
 * @returns {string} That folder, or `start` when no folder above it has such a file
 */
export function findRoot(start = process.cwd()) {
  const from = path.resolve(start)

  for (let dir = from; ; dir = path.dirname(dir)) {
    if (readPackage(dir)?.chassis) return dir
    if (dir === path.dirname(dir)) return from
  }
}

/**
 * The repository of a run: `cwd` as it is when given, else the nearest repository upward.
 * @param {string} [cwd] - The `--cwd` option, relative to `from`
 * @param {string} [from] - The working directory by default
 * @returns {string} An absolute path
 */
export function resolveRoot(cwd, from = process.cwd()) {
  return cwd ? path.resolve(from, cwd) : findRoot(from)
}

/** The folder of this package: the build, its templates and its package.json. */
export const packageRoot = fileURLToPath(new URL('..', import.meta.url))

/**
 * The version of the build: that of the package.json of this package, wherever it runs.
 * @returns {string}
 */
export function buildVersion() {
  return readPackage(packageRoot)?.version ?? ''
}

/**
 * Whether a module is the file Node.js was started with, and not imported by a test.
 * @param {string} moduleUrl - `import.meta.url` of the module
 * @returns {boolean}
 */
export function isEntry(moduleUrl) {
  if (!process.argv[1]) return false

  // By the real paths: a folder reached through a link is the same file under another name
  try {
    return fs.realpathSync(fileURLToPath(moduleUrl)) === fs.realpathSync(process.argv[1])
  } catch {
    return false
  }
}
