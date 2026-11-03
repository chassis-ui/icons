/**
 * @file The archive of a release: `<font>-web-<version>.zip`, for a project that does not
 * install from npm. It holds the output for the web as `dist/` has it, `icons.json`, `svgs/`
 * and `web/`, and the page of the set in `preview/`, written for the archive. The release
 * workflow attaches it to the GitHub release of the version. The target is in the name, so
 * that a later target of the build, for a platform, has an archive of its own beside it.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PREVIEW_DIR } from './config.js'
import { writePreview } from './preview.js'

/** Where the archives are written, from the root of the repository, unless `--to` says. */
export const ARCHIVES_DIR = 'archives'

/** The target of the archive, in its name. */
export const ARCHIVE_TARGET = 'web'

/**
 * Writes the archive of the output of a set. Needs the `zip` command.
 * @param {import('./config.js').Config} config
 * @param {object} [options]
 * @param {string} [options.to] - The folder the archive is written to; `archives/` of the
 *   repository by default. An archive of the font that is already there is removed
 * @returns {Promise<{ file: string, entries: string[] }>} The archive, and the files in it
 * @throws {Error} When the package has no version, or the output is not built
 */
export async function writeArchive(
  config,
  { to = path.join(config.packageDir, ARCHIVES_DIR) } = {}
) {
  if (!config.version) {
    throw new Error(`${path.join(config.packageDir, 'package.json')} has no version`)
  }

  if (!fs.existsSync(config.indexFile) || !fs.existsSync(config.webDir)) {
    throw new Error(`No output in ${config.distDir}. Run the build first.`)
  }

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-archive-'))

  try {
    for (const file of [config.indexFile, config.svgsDir, config.webDir]) {
      fs.cpSync(file, path.join(staging, path.basename(file)), { recursive: true })
    }

    await writePreview(config, { outDir: path.join(staging, PREVIEW_DIR) })

    const entries = fs
      .readdirSync(staging, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
      .map((entry) =>
        path.relative(staging, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
      )
      .sort()

    fs.mkdirSync(to, { recursive: true })

    for (const name of fs.readdirSync(to)) {
      if (name.startsWith(`${config.name}-`) && name.endsWith('.zip')) {
        fs.rmSync(path.join(to, name))
      }
    }

    const file = path.join(to, `${config.name}-${ARCHIVE_TARGET}-${config.version}.zip`)

    // -X leaves out the extra file attributes, -@ reads the names of the files
    execFileSync('zip', ['-q', '-X', file, '-@'], {
      cwd: staging,
      input: `${entries.join('\n')}\n`,
      stdio: ['pipe', 'inherit', 'inherit']
    })

    return { file, entries }
  } finally {
    fs.rmSync(staging, { recursive: true, force: true })
  }
}
