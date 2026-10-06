/**
 * @file The first step of the build: the SVG files of the source folder, optimized with SVGO
 * and given the root attributes of the set, are written to `svgs/`. The source folder is only
 * read. This module also holds the one SVGO configuration of the build, in the two forms that
 * its two users need: the files, and the symbols of the sprite.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { optimize } from 'svgo'
import { listIcons } from './names.js'

/**
 * The plugins that both forms share. A drawing loses its own colors, so that an icon takes
 * the color of the text around it.
 * @param {object} options
 * @param {boolean} options.convertPathData - Rewrite the path data in its shortest form
 * @returns {import('svgo').PluginConfig[]}
 */
function sharedPlugins({ convertPathData }) {
  return [
    {
      name: 'preset-default',
      params: {
        overrides: {
          ...(convertPathData ? {} : { convertPathData: false }),
          removeUnknownsAndDefaults: {
            keepDataAttrs: false, // remove all `data` attributes
            keepRoleAttr: true // keep the `role` attribute
          }
        }
      }
    },
    // Part of SVGO, and not of preset-default
    'cleanupListOfValues'
  ]
}

/** @type {import('svgo').PluginConfig} */
const removeColors = { name: 'removeAttrs', params: { attrs: ['clip-rule', 'fill'] } }

/**
 * The SVGO configuration of a file of `svgs/`: readable, with the path data as it was drawn,
 * and with the root attributes of the set in a fixed order.
 * @param {import('./config.js').Config} config
 * @param {string} name - The name of the icon
 * @returns {import('svgo').Config}
 */
export function fileConfig(config, name) {
  const attributes = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: String(config.frame),
    height: String(config.frame),
    fill: 'currentcolor',
    class: `${config.prefix}-${name}`,
    viewBox: `0 0 ${config.frame} ${config.frame}`
  }

  return {
    multipass: true,
    js2svg: { pretty: true, indent: 2, eol: 'lf' },
    plugins: [
      ...sharedPlugins({ convertPathData: false }),
      removeColors,
      {
        name: 'rootAttributes',
        fn() {
          return {
            element: {
              enter(node, parentNode) {
                if (node.name === 'svg' && parentNode.type === 'root') {
                  node.attributes = { ...attributes }
                }
              }
            }
          }
        }
      }
    ]
  }
}

/**
 * The SVGO configuration of a symbol of the sprite: as short as it gets, without a namespace
 * of its own.
 * @returns {import('svgo').Config}
 */
export function spriteConfig() {
  return {
    multipass: true,
    plugins: [...sharedPlugins({ convertPathData: true }), 'removeXMLNS', removeColors]
  }
}

/**
 * Optimizes one SVG file.
 * @param {import('./config.js').Config} config
 * @param {string} name - The name of the icon
 * @param {string} svg - The contents of its source file
 * @returns {string} The contents of its file in `svgs/`
 */
export function optimizeIcon(config, name, svg) {
  const { data } = optimize(svg, { path: `${name}.svg`, ...fileConfig(config, name) })

  // SVGO ends a pretty file with a line break
  return data.trim()
}

/**
 * Writes the optimized file of every icon of the source folder to `outDir`, and removes the
 * files of `outDir` that have no source.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} options.outDir - Where the files are written
 * @param {boolean} [options.dryRun] - Change no file
 * @param {import('./logger.js').Logger} options.logger
 * @returns {Promise<{ names: string[], written: string[], removed: string[] }>}
 */
export async function buildSvgs(config, { outDir, dryRun = false, logger }) {
  const names = listIcons(config.sourceDir)

  if (names.length === 0) {
    throw new Error(`There is no SVG file in ${config.sourceDir}`)
  }

  if (!dryRun) {
    await fs.mkdir(outDir, { recursive: true })
  }

  const written = []

  await Promise.all(
    names.map(async (name) => {
      const file = path.join(outDir, `${name}.svg`)
      const source = await fs.readFile(path.join(config.sourceDir, `${name}.svg`), 'utf8')
      let optimized

      try {
        optimized = optimizeIcon(config, name, source)
      } catch (error) {
        throw new Error(`${name}.svg is not an SVG file that SVGO reads: ${error.message}`, {
          cause: error
        })
      }

      if (optimized !== (await fs.readFile(file, 'utf8').catch(() => null))) {
        written.push(name)

        if (!dryRun) {
          await fs.writeFile(file, optimized)
        }
      }
    })
  )

  const removed = listIcons(outDir).filter((name) => !names.includes(name))

  if (!dryRun) {
    await Promise.all(removed.map((name) => fs.rm(path.join(outDir, `${name}.svg`))))
  }

  written.sort()

  for (const name of written) logger.debug(`  ${name}.svg written`)
  for (const name of removed) logger.debug(`  ${name}.svg removed: it has no source`)

  return { names, written, removed }
}
