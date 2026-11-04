/**
 * @file The check of a repository of icons: whether the source builds, twice to the same
 * bytes, whether the committed files that the build writes are up to date, and whether the set
 * keeps the promises that others rely on. An icon keeps its code point, and the icons that a
 * consumer reads by name are there. `dist/` is not committed, so it is not compared: the
 * release builds it.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { compareWithBuild } from './build.js'
import { checkAgainstBaseline, checkRegistry, readRegistry } from './codepoints.js'
import { listIcons } from './names.js'

/**
 * The icons that the contracts name and the set does not have.
 * @param {any} checks - The contents of the checks file
 * @param {string[]} names - The names of the icons of the set
 * @returns {string[]} One message per problem
 */
export function checkContracts(checks, names) {
  const contracts = checks?.contracts ?? []

  if (!Array.isArray(contracts)) {
    return ['"contracts" has to be a list of { "reader": "...", "icons": ["..."] }']
  }

  const present = new Set(names)
  const problems = []

  for (const { reader = 'a consumer', icons = [] } of contracts) {
    for (const icon of icons) {
      if (!present.has(icon)) {
        problems.push(`"${icon}" is missing, and ${reader} reads it by name`)
      }
    }
  }

  return problems
}

/**
 * Runs Git in the folder of the package.
 * @param {string} cwd
 * @param {string[]} args
 * @returns {string | null} What it wrote, or null when it failed
 */
function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

/**
 * Reads the code points of the set as they were at a commit: from the registry,
 * `codepoints.json`, or from the glyph map of the font at a commit that had none,
 * `dist/web/<font>.json` or `icons/<font>.json`.
 * @param {import('./config.js').Config} config
 * @param {string} [since] - A commit, a tag or a branch; the last tag when left out
 * @returns {{ ref: string, codepoints: Record<string, number> } | { skipped: string }}
 */
export function readBaseline(config, since) {
  const root = git(config.packageDir, ['rev-parse', '--show-toplevel'])?.trim()

  if (!root) {
    return { skipped: 'the package is not in a Git repository' }
  }

  const ref = since ?? git(config.packageDir, ['describe', '--tags', '--abbrev=0'])?.trim()

  if (!ref) {
    return { skipped: 'the repository has no tag, so there is no release to compare with' }
  }

  const glyphMap = `${config.name}.json`
  /** @type {Array<[string, (text: string) => Record<string, number>]>} */
  const files = [
    [
      config.registryFile,
      (text) =>
        Object.fromEntries(
          Object.entries(JSON.parse(text).icons ?? {}).map(([name, hex]) => [
            name,
            parseInt(String(hex), 16)
          ])
        )
    ],
    [path.join(config.webDir, glyphMap), JSON.parse],
    [path.join(config.packageDir, 'icons', glyphMap), JSON.parse]
  ]

  for (const [file, read] of files) {
    // Where the file is in this repository, and where it was while the repository was the
    // package itself
    const candidates = new Set([path.relative(root, file), path.relative(config.packageDir, file)])

    for (const candidate of candidates) {
      const contents = git(root, ['show', `${ref}:${candidate.split(path.sep).join('/')}`])

      if (contents !== null) {
        return { ref, codepoints: read(contents) }
      }
    }
  }

  if (git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) === null) {
    throw new Error(`Git does not know "${ref}"`)
  }

  return { skipped: `${ref} has no ${path.relative(root, config.registryFile)}` }
}

/**
 * @typedef {object} VerifyResult
 * @property {number} icons - The number of icons of the set
 * @property {string[]} problems - What is wrong, one message each
 * @property {string[]} notes - What was not checked, and why
 */

/**
 * Verifies the output of the package.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} [options.since] - The commit to compare the code points with
 * @param {Record<string, number>} [options.baseline] - The code points to compare with,
 *   in place of those of a commit
 * @param {import('./logger.js').Logger} options.logger
 * @returns {Promise<VerifyResult>}
 */
export async function verify(config, { since, baseline, logger }) {
  const problems = []
  const notes = []

  const { icons, differences, unstable } = await compareWithBuild(config, { repeat: true, logger })

  // dist/ is the scratch output of the working copy, and the release builds its own
  for (const difference of differences.filter((file) => !file.startsWith('dist/'))) {
    problems.push(`${difference}. It is not what the source builds: run the build, and commit it.`)
  }

  for (const file of unstable) {
    problems.push(`${file} differs between two builds: the build is not reproducible.`)
  }

  const registry = readRegistry(config.registryFile)

  problems.push(...checkRegistry(registry))

  if (baseline) {
    problems.push(...checkAgainstBaseline(registry, baseline))
  } else {
    const read = readBaseline(config, since)

    if ('skipped' in read) {
      notes.push(`The code points were not compared with an earlier state: ${read.skipped}.`)
    } else {
      problems.push(
        ...checkAgainstBaseline(registry, read.codepoints).map(
          (problem) => `${problem} since ${read.ref}`
        )
      )
    }
  }

  if (fs.existsSync(config.checksFile)) {
    const checks = JSON.parse(fs.readFileSync(config.checksFile, 'utf8'))

    problems.push(...checkContracts(checks, listIcons(config.sourceDir)))
  } else {
    notes.push('No icon is checked by name: there is no checks file.')
  }

  return { icons, problems, notes }
}
