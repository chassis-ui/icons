/**
 * @file The `android` target: `dist/android/res/drawable/`, one vector drawable per icon,
 * converted from its optimized SVG file by svg2vectordrawable with the options of
 * `chassis-ui/tokens` for its icons. A path is filled black, which the tint of a view or of
 * `Icon` in Compose replaces, as `currentcolor` takes the color of the text on the web. A
 * drawable is named after the class of the icon in the font: `ag-bar-line` is
 * `ag_bar_line`, which a resource name has to be.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import convert from 'svg2vectordrawable'

/** The options of the conversion: a path without a fill draws nothing, so it is black. */
export const CONVERTER_OPTIONS = { fillBlack: true, floatPrecision: 3 }

/** The folder of the drawables in `dist/android/`, as a `res/` folder of Android has it. */
export const DRAWABLES_DIR = 'res/drawable'

/**
 * The name of the drawable of an icon, which is also its name in `R.drawable`.
 * @param {import('./config.js').Config} config
 * @param {string} name - The name of an icon
 * @returns {string}
 */
export function drawableName(config, name) {
  return `${config.prefix}-${name}`.replaceAll('-', '_')
}

/**
 * Converts an icon to a vector drawable.
 * @param {string} name - The name of the icon
 * @param {string} svg - Its optimized SVG file
 * @returns {Promise<string>} The XML of the drawable, ending with a line break
 * @throws {Error} When the file does not convert, or converts to a drawable without a path
 */
export async function convertIcon(name, svg) {
  let xml

  try {
    xml = await convert(svg, CONVERTER_OPTIONS)
  } catch (error) {
    throw new Error(`${name}.svg does not convert to a vector drawable: ${error.message}`, {
      cause: error
    })
  }

  if (!/<path\b/.test(xml)) {
    throw new Error(`${name}.svg converts to a vector drawable that draws nothing`)
  }

  return `${xml.trimEnd()}\n`
}

/**
 * The files of `dist/android/`.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} options.svgsDir - The optimized SVG files
 * @param {string[]} options.names - The names of the icons, sorted
 * @returns {Promise<Record<string, string>>} The contents of each file, by its path from
 *   `dist/android/`
 */
export async function renderAndroid(config, { svgsDir, names }) {
  /** @type {Record<string, string>} */
  const files = {}

  for (const name of names) {
    const svg = await fs.readFile(path.join(svgsDir, `${name}.svg`), 'utf8')

    files[`${DRAWABLES_DIR}/${drawableName(config, name)}.xml`] = await convertIcon(name, svg)
  }

  return files
}
