/**
 * @file The archive of a release: `<font>-<version>.zip`, with the folders `icons/` and
 * `svgs/` at its top level, as the package has them, for a project that does not install
 * from npm. The release workflow attaches it to the GitHub release of the version.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/** Where the archives are written, from the root of the repository, unless `--to` says. */
export const ARCHIVES_DIR = 'archives'

/**
 * Writes the archive of the output of a set. Needs the `zip` command.
 * @param {import('./config.js').Config} config
 * @param {object} [options]
 * @param {string} [options.to] - The folder the archive is written to; `archives/` of the
 *   repository by default. An archive of the font that is already there is removed
 * @returns {{ file: string, entries: string[] }} The archive, and the files in it
 * @throws {Error} When the package has no version, or the output is not built
 */
export function writeArchive(config, { to = path.join(config.packageDir, ARCHIVES_DIR) } = {}) {
  const entries = [config.iconsDir, config.svgsDir].flatMap((dir) =>
    (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
      .filter((name) => !name.startsWith('.'))
      .sort()
      .map((name) => `${path.basename(dir)}/${name}`)
  )

  if (!config.version) {
    throw new Error(`${path.join(config.packageDir, 'package.json')} has no version`)
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
    cwd: config.packageDir,
    input: `${entries.join('\n')}\n`,
    stdio: ['pipe', 'inherit', 'inherit']
  })

  return { file, entries }
}
