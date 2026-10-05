/**
 * @file The build of a set: the optimized SVG files, the sprite, the font with its
 * stylesheets, and the manifest and the README of the package, written from the source folder
 * and the configuration. It can write to the folders of the package or to any others, which
 * is how `--dry-run` and `verify` build without changing a file of the package.
 */

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { PREVIEW_FILE } from './config.js'
import { allocate, formatRegistry, readRegistry, toHex } from './codepoints.js'
import { renderFontFiles } from './font.js'
import { renderPackageFiles } from './manifest.js'
import { listIcons } from './names.js'
import { buildSvgs } from './optimize.js'
import { renderSprite } from './sprite.js'

/** The steps of the build, in their order. `--only` runs one of them. */
export const STEPS = ['svgs', 'sprite', 'font', 'package']

/**
 * @typedef {object} BuildResult
 * @property {number} icons - The number of icons of the set
 * @property {string[]} added - The icons that got a code point in this build
 * @property {string[]} removed - The icons whose code point this build retired
 * @property {boolean} registryChanged - Whether the registry is not what the build needs
 */

/**
 * Builds the set of `config`.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} [options.only] - One of `STEPS`; every step when left out
 * @param {string} [options.svgsDir] - Where the SVG files are written; `svgs/` of the package
 * @param {string} [options.iconsDir] - Where the rest is written; `icons/` of the package
 * @param {string} [options.packageDir] - Where package.json and the README are written; the
 *   folder of the package
 * @param {boolean} [options.writeRegistry] - Write the registry when the build changes it
 * @param {import('./logger.js').Logger} options.logger
 * @returns {Promise<BuildResult>}
 */
export async function build(
  config,
  {
    only,
    svgsDir = config.svgsDir,
    iconsDir = config.iconsDir,
    packageDir = config.packageDir,
    writeRegistry = true,
    logger
  }
) {
  if (only !== undefined && !STEPS.includes(only)) {
    throw new Error(`There is no step "${only}". The steps are ${STEPS.join(', ')}.`)
  }

  const runs = (/** @type {string} */ step) => only === undefined || only === step
  /** @type {BuildResult} */
  const result = { icons: 0, added: [], removed: [], registryChanged: false }
  /** @type {Record<string, Buffer | string>} */
  const files = {}

  if (runs('svgs')) {
    const { names, written, removed } = await buildSvgs(config, { outDir: svgsDir, logger })

    logger.success(
      `${count(names.length, 'SVG file')}: ${written.length} written, ${removed.length} removed`
    )
  }

  const names = listIcons(svgsDir)
  result.icons = names.length

  if (names.length === 0) {
    throw new Error(`There is no SVG file in ${svgsDir}. Run the "svgs" step first.`)
  }

  if (runs('sprite')) {
    Object.assign(files, await renderSprite(config, { svgsDir }))
    logger.success(`The sprite of ${count(names.length, 'symbol')}`)
  }

  if (runs('font')) {
    const before = readRegistry(config.registryFile)
    const { registry, added, removed } = allocate(before, names, config.startCodepoint)
    const registryFile = formatRegistry(registry)

    result.added = added
    result.removed = removed
    result.registryChanged =
      registryFile !== (await fs.readFile(config.registryFile, 'utf8').catch(() => null))

    for (const name of added) {
      logger.debug(`  ${name} gets the code point ${toHex(registry.icons[name])}`)
    }

    for (const name of removed) {
      logger.debug(`  ${name} is gone: the code point ${toHex(before.icons[name])} is retired`)
    }

    Object.assign(
      files,
      await renderFontFiles(config, { svgsDir, outDir: iconsDir, codepoints: registry.icons })
    )

    if (result.registryChanged && writeRegistry) {
      await fs.writeFile(config.registryFile, registryFile)
    }

    logger.success(
      `The font of ${count(names.length, 'glyph')} as ${config.formats.join(', ')}: ${added.length} new, ${removed.length} retired`
    )
  }

  await fs.mkdir(iconsDir, { recursive: true })

  for (const [name, contents] of Object.entries(files)) {
    await fs.writeFile(path.join(iconsDir, name), contents)
  }

  if (runs('package')) {
    const written = []

    await fs.mkdir(packageDir, { recursive: true })

    for (const [name, contents] of Object.entries(renderPackageFiles(config, names))) {
      const file = path.join(packageDir, name)

      // package.json is the configuration too: it is written only when a field changes
      if (contents !== (await fs.readFile(file, 'utf8').catch(() => null))) {
        await fs.writeFile(file, contents)
        written.push(name)
      }
    }

    logger.success(
      `The manifest and the README of the package: ${written.length === 0 ? 'no change' : `${written.join(' and ')} written`}`
    )
  }

  // A whole build leaves nothing in the folder that it did not write: the files of another
  // font name, or of a format that the configuration no longer asks for.
  if (only === undefined) {
    for (const name of await fs.readdir(iconsDir)) {
      if (!(name in files) && !name.startsWith('.')) {
        await fs.rm(path.join(iconsDir, name), { recursive: true })
        logger.debug(`  ${name} removed: the build does not write it`)
      }
    }
  }

  return result
}

/**
 * Builds the whole set into a temporary folder, and lists how the output of the package
 * differs from it. Changes no file of the package.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {import('./logger.js').Logger} options.logger
 * @returns {Promise<BuildResult & { differences: string[] }>} The paths of the files that a
 *   build would write, add or remove, each relative to the package and with what would happen
 */
export async function compareWithBuild(config, { logger }) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'icons-build-'))

  try {
    const built = {
      svgsDir: path.join(tmp, 'svgs'),
      iconsDir: path.join(tmp, 'icons'),
      packageDir: path.join(tmp, 'package')
    }
    const result = await build(config, { ...built, writeRegistry: false, logger })
    const differences = [
      ...(await compareFolders(config.svgsDir, built.svgsDir, config.packageDir)),
      ...(await compareFolders(config.iconsDir, built.iconsDir, config.packageDir))
    ]

    for (const name of await fs.readdir(built.packageDir)) {
      const [committed, fresh] = await Promise.all(
        [config.packageDir, built.packageDir].map((dir) =>
          fs.readFile(path.join(dir, name), 'utf8').catch(() => null)
        )
      )

      if (committed !== fresh) {
        differences.push(`${name}: ${committed === null ? 'missing' : 'changed'}`)
      }
    }

    if (result.registryChanged) {
      differences.push(`${relative(config.registryFile, config.packageDir)}: changed`)
    }

    return { ...result, differences }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true })
  }
}

/**
 * @param {string} committedDir - A folder of the package
 * @param {string} builtDir - The same folder of a fresh build
 * @param {string} packageDir
 * @returns {Promise<string[]>}
 */
async function compareFolders(committedDir, builtDir, packageDir) {
  const list = async (/** @type {string} */ dir) =>
    (await fs.readdir(dir).catch(() => [])).filter(
      (name) => name !== PREVIEW_FILE && !name.startsWith('.')
    )
  const committed = await list(committedDir)
  const built = await list(builtDir)
  const differences = []

  for (const name of [...new Set([...committed, ...built])].sort()) {
    const file = relative(path.join(committedDir, name), packageDir)

    if (!built.includes(name)) {
      differences.push(`${file}: the build does not write it`)
    } else if (!committed.includes(name)) {
      differences.push(`${file}: missing`)
    } else {
      const [a, b] = await Promise.all([
        fs.readFile(path.join(committedDir, name)),
        fs.readFile(path.join(builtDir, name))
      ])

      if (!a.equals(b)) {
        differences.push(`${file}: changed`)
      }
    }
  }

  return differences
}

/**
 * Empties the output and the registry, so that the next build is the first build of a new
 * set: its first icon gets the first code point.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {import('./logger.js').Logger} options.logger
 */
export async function init(config, { logger }) {
  for (const dir of [config.svgsDir, config.iconsDir]) {
    await fs.rm(dir, { recursive: true, force: true })
    await fs.mkdir(dir, { recursive: true })
    logger.success(`Emptied ${relative(dir, config.packageDir)}`)
  }

  await fs.rm(config.registryFile, { force: true })
  logger.success(`Removed ${relative(config.registryFile, config.packageDir)}`)
}

/**
 * @param {number} number
 * @param {string} noun
 * @returns {string}
 */
function count(number, noun) {
  return `${number} ${noun}${number === 1 ? '' : 's'}`
}

/**
 * @param {string} file
 * @param {string} from
 * @returns {string} The path of the file from a folder, with `/` on every platform
 */
function relative(file, from) {
  return path.relative(from, file).split(path.sep).join('/')
}
