/**
 * @file The archives of a release, one per target, for a project that does not install from
 * npm or Swift Package Manager: `<font>-web-<version>.zip` holds the output for the web as
 * `dist/` has it, `icons.json`, `svgs/` and `web/`, and the page of the set in `preview/`,
 * written for the archive; `<font>-ios-<version>.zip` and `<font>-android-<version>.zip`
 * hold `dist/ios/` and `dist/android/` at their top level. The release workflow attaches them
 * to the GitHub release of the version.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PREVIEW_DIR } from './config.js'
import { writePreview } from './preview.js'

/** Where the archives are written, from the root of the repository, unless `--to` says. */
export const ARCHIVES_DIR = 'archives'

/**
 * The files of a folder and of its folders, without hidden ones.
 * @param {string} dir
 * @returns {string[]} Their paths from `dir`, with `/`, sorted
 */
function listTree(dir) {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) =>
      path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
    )
    .sort()
}

/**
 * Writes one archive of the files of a folder, at its top level.
 * @param {string} dir
 * @param {string} file - The archive
 * @returns {string[]} The files in it
 */
function zip(dir, file) {
  const entries = listTree(dir)

  // -X leaves out the extra file attributes, -@ reads the names of the files
  execFileSync('zip', ['-q', '-X', file, '-@'], {
    cwd: dir,
    input: `${entries.join('\n')}\n`,
    stdio: ['pipe', 'inherit', 'inherit']
  })

  return entries
}

/**
 * Writes the archives of the output of a set: one for the web, and one for each target of
 * `targets`. Needs the `zip` command.
 * @param {import('./config.js').Config} config
 * @param {object} [options]
 * @param {string} [options.to] - The folder the archives are written to; `archives/` of the
 *   repository by default. The archives of the font that are already there are removed
 * @returns {Promise<Array<{ file: string, entries: string[] }>>} Each archive, and the files
 *   in it
 * @throws {Error} When the package has no version, or the output is not built
 */
export async function writeArchives(
  config,
  { to = path.join(config.packageDir, ARCHIVES_DIR) } = {}
) {
  if (!config.version) {
    throw new Error(`${path.join(config.packageDir, 'package.json')} has no version`)
  }

  const folders = config.targets.map((target) => path.join(config.distDir, target))

  for (const file of [config.indexFile, config.webDir, ...folders]) {
    if (!fs.existsSync(file)) {
      throw new Error(`No ${path.relative(config.packageDir, file)}. Run the build first.`)
    }
  }

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-archive-'))

  try {
    const web = path.join(staging, 'web')

    for (const file of [config.indexFile, config.svgsDir, config.webDir]) {
      fs.cpSync(file, path.join(web, path.basename(file)), { recursive: true })
    }

    await writePreview(config, { outDir: path.join(web, PREVIEW_DIR) })
    fs.mkdirSync(to, { recursive: true })

    for (const name of fs.readdirSync(to)) {
      if (name.startsWith(`${config.name}-`) && name.endsWith('.zip')) {
        fs.rmSync(path.join(to, name))
      }
    }

    return [
      ['web', web],
      ...config.targets.map((target) => [target, path.join(config.distDir, target)])
    ].map(([target, dir]) => {
      const file = path.join(to, `${config.name}-${target}-${config.version}.zip`)

      return { file, entries: zip(dir, file) }
    })
  } finally {
    fs.rmSync(staging, { recursive: true, force: true })
  }
}
