import fs from 'node:fs'
import path from 'node:path'
import { generateFonts } from 'fantasticon'
import { describe, expect, it } from 'vitest'
import { build } from '../lib/build.js'
import { loadConfig } from '../lib/config.js'
import { addLigatures, renderFont } from '../lib/font.js'
import { silentLogger as logger } from '../lib/logger.js'
import { copyFixture } from './helpers.js'

/**
 * The fixture, built, with what the font step reads.
 * @returns {Promise<{ config: import('../lib/config.js').Config, svgsDir: string, codepoints: Record<string, number> }>}
 */
async function builtFixture() {
  const dir = copyFixture()
  const config = loadConfig(dir)

  await build(config, { logger })

  const codepoints = JSON.parse(
    fs.readFileSync(path.join(config.webDir, `${config.name}.json`), 'utf8')
  )

  return { config, svgsDir: config.svgsDir, codepoints }
}

/**
 * @param {Buffer} ttf
 * @returns {number} The number of glyphs of a TrueType font, from its `maxp` table
 */
function glyphCount(ttf) {
  for (let i = 0; i < ttf.readUInt16BE(4); i++) {
    if (ttf.toString('latin1', 12 + i * 16, 16 + i * 16) === 'maxp') {
      return ttf.readUInt16BE(ttf.readUInt32BE(12 + i * 16 + 8) + 4)
    }
  }

  throw new Error('The font has no maxp table')
}

describe('renderFont', () => {
  it('writes the font that Fantasticon writes, in every format, without ligatures', async () => {
    const { config, svgsDir, codepoints } = await builtFixture()
    const formats = ['woff2', 'woff', 'ttf']
    const { fonts } = await renderFont(
      { ...config, formats, ligatures: false },
      { svgsDir, codepoints }
    )
    const { assetsOut } = await generateFonts(
      /** @type {any} */ ({
        inputDir: svgsDir,
        name: config.name,
        fontTypes: formats,
        assetTypes: [],
        codepoints
      })
    )

    for (const format of formats) {
      expect(fonts[format].equals(assetsOut[format]), `the ${format} font differs`).toBe(true)
    }
  })

  it('adds a glyph per character of the names with ligatures only', async () => {
    const { config, svgsDir, codepoints } = await builtFixture()
    const withNames = await renderFont(
      { ...config, formats: ['ttf'], ligatures: true },
      { svgsDir, codepoints }
    )
    const without = await renderFont(
      { ...config, formats: ['ttf'], ligatures: false },
      { svgsDir, codepoints }
    )

    const names = Object.keys(codepoints)
    const characters = new Set(names.join(''))

    // .notdef, one glyph per icon, and one per character that a name holds
    expect(glyphCount(without.fonts.ttf)).toBe(1 + names.length)
    expect(glyphCount(withNames.fonts.ttf)).toBe(1 + names.length + characters.size)
    expect(withNames.hash).not.toBe(without.hash)
  })
})

describe('addLigatures', () => {
  const glyph = (/** @type {string} */ name, /** @type {string} */ unicode) =>
    `    <glyph glyph-name="${name}"\n      unicode="${unicode}"\n      horiz-adv-x="16" d="M0 0h16v16H0z" />\n`
  const font = (/** @type {string} */ glyphs) =>
    `<svg>\n<defs>\n  <font id="acme-glyphs" horiz-adv-x="16">\n${glyphs}  </font>\n</defs>\n</svg>\n`

  it('adds a glyph whose characters are the name of the icon', () => {
    expect(addLigatures(font(glyph('bar-fill', '&#xE900;')), ['bar-fill'])).toBe(
      font(
        glyph('bar-fill', '&#xE900;') +
          glyph('bar-fill-1', '&#x62;&#x61;&#x72;&#x2D;&#x66;&#x69;&#x6C;&#x6C;')
      )
    )
  })

  it('refuses a font without a glyph per icon', () => {
    expect(() =>
      addLigatures(font(glyph('bar-fill', '&#xE900;')), ['bar-fill', 'ring-line'])
    ).toThrow('a glyph per icon')
  })
})
