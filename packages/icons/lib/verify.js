/**
 * @file The check of the output: whether the committed files are what the source builds, and
 * whether the set keeps the promises that others rely on. An icon keeps its code point, and
 * the icons that a consumer reads by name are there.
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
 * Reads the code points of the set as they were at a commit, from `icons/<font>.json`.
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

  const file = path.join(config.iconsDir, `${config.name}.json`)
  // Where the file is in this repository, and where it was while the repository was the
  // package itself
  const candidates = [path.relative(root, file), path.relative(config.packageDir, file)]

  for (const candidate of new Set(candidates)) {
    const contents = git(root, ['show', `${ref}:${candidate.split(path.sep).join('/')}`])

    if (contents !== null) {
      return { ref, codepoints: JSON.parse(contents) }
    }
  }

  if (git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) === null) {
    throw new Error(`Git does not know "${ref}"`)
  }

  return { skipped: `${ref} has no ${candidates[0]}` }
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

  const { icons, differences } = await compareWithBuild(config, { logger })

  for (const difference of differences) {
    problems.push(`${difference}. The output is not what the source builds: run the build.`)
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
