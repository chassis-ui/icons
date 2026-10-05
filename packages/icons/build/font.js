/**
 * @file The third step of the build: the icon font of the files of `svgs/`, its stylesheets
 * and the map of its code points. Fantasticon draws the font, the templates of
 * `build/templates/` write the stylesheets, and clean-css minifies the CSS.
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { generateFonts } from '@twbs/fantasticon'
import CleanCSS from 'clean-css'
import Handlebars from 'handlebars'
import { FONT_FORMATS } from './config.js'
import { toHex } from './codepoints.js'

/**
 * Draws the font of the files of `svgsDir`.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} options.svgsDir - The optimized SVG files
 * @param {Record<string, number>} options.codepoints - The code point of each of them
 * @returns {Promise<{ fonts: Record<string, Buffer>, hash: string }>} The font in each format
 *   of the configuration, by format, and the hash that the stylesheets ask for the font with
 */
export async function renderFont(config, { svgsDir, codepoints }) {
  // Without an output folder Fantasticon writes nothing and returns the files. The SVG font
  // is what every other format is made of, and what the hash is taken from.
  const { assetsOut } = await generateFonts(
    /** @type {any} */ ({
      inputDir: svgsDir,
      name: config.name,
      fontTypes: [...config.formats, 'svg'],
      assetTypes: [],
      codepoints
    })
  )

  return {
    fonts: Object.fromEntries(
      config.formats.map((format) => [format, /** @type {Buffer} */ (assetsOut[format])])
    ),
    hash: crypto.createHash('md5').update(String(assetsOut.svg)).digest('hex')
  }
}

/**
 * Writes the stylesheets of the font with the templates of the set.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {Record<string, number>} options.codepoints - The code point of each icon, in the
 *   order of the classes
 * @param {string} options.hash - The hash of the font
 * @returns {Promise<{ css: string, scss: string }>}
 */
export async function renderStylesheets(config, { codepoints, hash }) {
  const formats = config.formats.map((extension) => ({
    extension,
    format: FONT_FORMATS[extension]
  }))

  const context = {
    name: config.name,
    prefix: config.prefix,
    header: config.header,
    fontsUrl: '.',
    fontHash: hash,
    fontSrc: formats
      .map(
        ({ extension, format }) =>
          `url("./${config.name}.${extension}?${hash}") format("${format}")`
      )
      .join(',\n'),
    formats,
    codepoints
  }

  const render = async (/** @type {string} */ template) =>
    Handlebars.compile(await fs.readFile(path.join(config.templatesDir, template), 'utf8'))(
      context,
      { helpers: { codepoint: toHex } }
    )

  return { css: await render('css.hbs'), scss: await render('scss.hbs') }
}

/**
 * Minifies the CSS of the font.
 * @param {string} css
 * @param {string} file - Where the CSS is, or will be: its URLs are read from there
 * @returns {string}
 */
export function minifyCss(css, file) {
  const output = new CleanCSS({
    level: 1,
    format: 'breakWith=lf',
    rebase: true,
    rebaseTo: path.dirname(file)
  }).minify({ [file]: { styles: css } })

  if (output.errors.length > 0) {
    throw new Error(
      `clean-css could not minify ${path.basename(file)}: ${output.errors.join('; ')}`
    )
  }

  return output.styles
}

/**
 * Builds the font and everything that goes with it.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} options.svgsDir - The optimized SVG files
 * @param {string} options.outDir - Where the files will be
 * @param {Record<string, number>} options.codepoints - The code point of each icon, in the
 *   order of the classes
 * @returns {Promise<Record<string, Buffer | string>>} The contents of each file, by file name
 */
export async function renderFontFiles(config, { svgsDir, outDir, codepoints }) {
  const { fonts, hash } = await renderFont(config, { svgsDir, codepoints })
  const { css, scss } = await renderStylesheets(config, { codepoints, hash })
  const cssFile = `${config.name}.css`

  return {
    ...Object.fromEntries(
      Object.entries(fonts).map(([format, font]) => [`${config.name}.${format}`, font])
    ),
    [cssFile]: css,
    [`${config.name}.min.css`]: minifyCss(css, path.join(outDir, cssFile)),
    [`${config.name}.scss`]: scss,
    [`${config.name}.json`]: JSON.stringify(codepoints, null, 2)
  }
}
