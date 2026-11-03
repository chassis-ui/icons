/**
 * @file The index of a set, `dist/icons.json`: the settings of the set that a reader needs to
 * draw an icon, and every icon with its code point and its style. It is what the page of the
 * set reads, and what a later target of the build, for a platform or a framework, reads in
 * place of the configuration. It holds no version, so a release or a new version of the build
 * that changes nothing else changes no file.
 */

import { toHex } from './codepoints.js'
import { parseName } from './names.js'

/**
 * @typedef {object} IndexEntry
 * @property {string} name - The name of the icon, of its file, its symbol and its class
 * @property {string} codepoint - Its code point in the font, as four hexadecimal digits
 * @property {string} [base] - The name without its style, when the set has styles
 * @property {string} [style] - Its style, when the set has styles
 */

/**
 * @typedef {object} SetIndex
 * @property {string} name - The name of the font, and of the files of `dist/web/`
 * @property {string} prefix - What a class of the font starts with, before `-<icon>`
 * @property {number} frame - The width and the height of the frame of an icon
 * @property {string[]} styles - The styles of the set; none when a name may end in anything
 * @property {string[][]} pairs - The styles an icon comes in together
 * @property {IndexEntry[]} icons - Every icon, in the order of the names
 */

/**
 * The index of a set.
 * @param {import('./config.js').Config} config
 * @param {string[]} names - The names of the icons, sorted
 * @param {Record<string, number>} codepoints - The code point of each of them
 * @returns {SetIndex}
 */
export function createIndex(config, names, codepoints) {
  return {
    name: config.name,
    prefix: config.prefix,
    frame: config.frame,
    styles: config.styles,
    pairs: config.pairs,
    icons: names.map((name) => {
      /** @type {IndexEntry} */
      const entry = { name, codepoint: toHex(codepoints[name]) }
      const parsed = config.styles.length > 0 ? parseName(name, config.styles) : null

      if (parsed && 'style' in parsed && parsed.style) {
        entry.base = parsed.base
        entry.style = parsed.style
      }

      return entry
    })
  }
}

/**
 * The text of the index: the settings as indented JSON, and one line per icon, so that the
 * diff of an added or a removed icon is one line.
 * @param {SetIndex} index
 * @returns {string}
 */
export function formatIndex(index) {
  const { icons, ...settings } = index
  const head = Object.entries(settings).map(
    ([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`
  )
  const lines = icons.map((icon) => `    ${JSON.stringify(icon)}`)

  return `{\n${head.join(',\n')},\n  "icons": [\n${lines.join(',\n')}\n  ]\n}\n`
}

/**
 * Reads an index that the build wrote.
 * @param {string} text - The contents of `dist/icons.json`
 * @returns {SetIndex}
 */
export function parseIndex(text) {
  return JSON.parse(text)
}
