/**
 * @file The names of the icons. An icon is named by its SVG file, and the name is its sprite
 * symbol, the last part of its class and its key in the map of code points.
 */

import fs from 'node:fs'
import path from 'node:path'

const KEBAB_CASE = /^[a-z][\da-z]*(?:-[\da-z]+)*$/

/**
 * Compares two names by code unit, so that the order of a set does not depend on the locale
 * or on the file system of the machine that builds it.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareNames(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * The names of the SVG files of a folder, sorted.
 * @param {string} dir
 * @returns {string[]} The names, without `.svg`; none when the folder does not exist
 */
export function listIcons(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file) === '.svg')
    .map((file) => path.basename(file, '.svg'))
    .sort(compareNames)
}

/**
 * Splits a name into what the icon shows and the style it is drawn in.
 * @param {string} name - The name of an icon, such as `arrow-right-solid`
 * @param {string[]} styles - The styles a name may end in; any name when empty
 * @returns {{ base: string, style: string | null } | { error: string }}
 */
export function parseName(name, styles) {
  if (!KEBAB_CASE.test(name)) {
    return {
      error: 'is not in kebab-case: lower-case letters and digits in parts joined by "-"'
    }
  }

  if (styles.length === 0) {
    return { base: name, style: null }
  }

  // The longest style first, so that `fill-solid` is found before `solid`
  const style = [...styles]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => name.endsWith(`-${candidate}`))

  if (!style) {
    return { error: `does not end in a style: ${styles.map((s) => `-${s}`).join(', ')}` }
  }

  return { base: name.slice(0, -style.length - 1), style }
}
