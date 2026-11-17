/**
 * @file The third step of the build: the icon font of the files of `dist/svgs/`, its
 * stylesheets and its glyph map, the code point of each icon by name. Fantasticon draws the
 * SVG font, the tools that Fantasticon uses make the other formats of it, the templates of
 * `lib/templates/` write the stylesheets, and clean-css minifies the CSS.
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { generateFonts } from 'fantasticon'
import svg2ttf from 'svg2ttf'
import ttf2woff from 'ttf2woff'
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
  // is what every other format is made of, and what the hash is taken from. Fantasticon gives
  // a glyph its code point only, so the names are added to the SVG font, and the other
  // formats are made of it here, with the tools and the options of Fantasticon.
  const { assetsOut } = await generateFonts(
    /** @type {any} */ ({
      inputDir: svgsDir,
      name: config.name,
      fontTypes: ['svg'],
      assetTypes: [],
      codepoints
    })
  )
  const svg = config.ligatures
    ? addLigatures(String(assetsOut.svg), Object.keys(codepoints))
    : String(assetsOut.svg)
  const ttf = Buffer.from(svg2ttf(svg, { ts: 0 }).buffer)
  /** @type {Record<string, () => Promise<Buffer>>} */
  const convert = {
    ttf: async () => ttf,
    woff: async () => Buffer.from(ttf2woff(new Uint8Array(ttf)).buffer),
    woff2: async () => Buffer.from((await import('ttf2woff2')).default(ttf).buffer)
  }
  /** @type {Record<string, Buffer>} */
  const fonts = {}

  for (const format of config.formats) {
    fonts[format] = await convert[format]()
  }

  return { fonts, hash: crypto.createHash('md5').update(svg).digest('hex') }
}

/**
 * Adds a ligature of its name to each glyph of an SVG font: a second glyph with the same
 * drawing, whose characters are the name, which svg2ttf writes into the `liga` feature of the
 * font. It is the glyph that svgicons2svgfont writes for a second `unicode` of an icon.
 * @param {string} svg - The SVG font that Fantasticon wrote
 * @param {string[]} names - The names of the icons
 * @returns {string}
 */
export function addLigatures(svg, names) {
  const glyph =
    /^( {4}<glyph glyph-name=")([^"]+)("\n {6}unicode=")[^"]*("\n {6}horiz-adv-x="[^"]*" d="[^"]*" \/>\n)/gm
  /** @type {string[]} */
  const found = []
  const output = svg.replace(glyph, (element, open, name, unicode, rest) => {
    found.push(name)
    return `${element}${open}${name}-1${unicode}${toEntities(name)}${rest}`
  })

  if (found.toSorted().join() !== names.toSorted().join()) {
    throw new Error(
      'The SVG font of Fantasticon does not have a glyph per icon in the form that the build adds the ligatures to'
    )
  }

  return output
}

/**
 * @param {string} text
 * @returns {string} Each character of `text` as a hexadecimal character reference
 */
function toEntities(text) {
  return [...text]
    .map((character) => `&#x${character.codePointAt(0).toString(16).toUpperCase()};`)
    .join('')
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
    ligatures: config.ligatures,
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
