/**
 * @file The page of a set: every icon drawn from the sprite with its name, a search box, and
 * a panel that shows what draws an icon. One HTML file beside the font and the sprite, which
 * it links with relative paths and needs nothing else, so that it opens from the file system
 * and from any static host.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import Handlebars from 'handlebars'
import { toHex } from './codepoints.js'
import { parseName } from './names.js'

/**
 * Writes the page of the set with its template.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string[]} options.names - The names of the icons of the set, in the order of the page
 * @param {Record<string, number>} options.codepoints - The code point of each of them
 * @returns {Promise<string>}
 */
export async function renderPreview(config, { names, codepoints }) {
  const template = await fs.readFile(path.join(config.templatesDir, 'preview.hbs'), 'utf8')
  const icons = names.map((name) => {
    const parsed = config.styles.length > 0 ? parseName(name, config.styles) : null

    return {
      name,
      codepoint: toHex(codepoints[name]),
      style: parsed && 'style' in parsed ? parsed.style : null
    }
  })

  return Handlebars.compile(template)({
    title: config.packageName || config.name,
    version: config.version,
    name: config.name,
    prefix: config.prefix,
    frame: config.frame,
    styles: config.styles,
    count: names.length,
    single: names.length === 1,
    icons
  })
}
