import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { build } from '../lib/build.js'
import { loadConfig, resolveConfig } from '../lib/config.js'
import { silentLogger as logger } from '../lib/logger.js'
import { renderPreview } from '../lib/preview.js'
import { copyFixture, fixtureDir } from './helpers.js'

const config = loadConfig(fixtureDir)
const names = ['bar-fill', 'bar-line', 'ring-line']
const codepoints = { 'bar-fill': 0xe900, 'bar-line': 0xe901, 'ring-line': 0xe905 }

/**
 * @param {string} html - The page
 * @returns {any} The set that the page carries as JSON
 */
function setOf(html) {
  const match = html.match(/<script id="set" type="application\/json">\n([^]*?)\n<\/script>/)

  return JSON.parse(/** @type {RegExpMatchArray} */ (match)[1])
}

describe('the page of the set', () => {
  it('links the stylesheet and the sprite beside it, and draws every icon from the sprite', async () => {
    const html = await renderPreview(config, { names, codepoints })

    expect(html.startsWith('<!DOCTYPE html>\n<html lang="en">\n')).toBe(true)
    expect(html).toContain('<title>@acme/glyphs</title>')
    expect(html).toContain('<link rel="stylesheet" href="acme-glyphs.css">')
    expect(html).toContain('<h1>@acme/glyphs 2.4.0</h1>')
    expect(html).toContain('3 icons on a frame of 16 by 16')

    for (const name of names) {
      expect(html).toContain(
        `<li data-name="${name}"><button type="button"><svg width="16" height="16" fill="currentcolor" aria-hidden="true"><use href="acme-glyphs.svg#${name}"></use></svg><span>${name}</span></button></li>`
      )
    }

    // The page needs nothing but the two files beside it
    expect(html).not.toMatch(/(?:href|src)="(?:https?:)?\/\//)
  })

  it('carries the icons with their code points and styles as JSON', async () => {
    const html = await renderPreview(config, { names, codepoints })

    expect(setOf(html)).toEqual({
      name: 'acme-glyphs',
      prefix: 'ag',
      frame: 16,
      styles: ['line', 'fill'],
      icons: [
        { name: 'bar-fill', codepoint: 'e900', style: 'fill' },
        { name: 'bar-line', codepoint: 'e901', style: 'line' },
        { name: 'ring-line', codepoint: 'e905', style: 'line' }
      ]
    })
    expect(html).toContain('<dt>Style</dt>')
  })

  it('names no style for a set without styles', async () => {
    const manifest = { name: 'marks', chassis: { build: { name: 'marks', prefix: 'mk' } } }
    const html = await renderPreview(resolveConfig(manifest, fixtureDir), {
      names: ['dot'],
      codepoints: { dot: 0xf101 }
    })

    expect(setOf(html)).toEqual({
      name: 'marks',
      prefix: 'mk',
      frame: 24,
      styles: [],
      icons: [{ name: 'dot', codepoint: 'f101' }]
    })
    expect(html).toContain('<title>marks</title>')
    expect(html).toContain('<h1>marks</h1>')
    expect(html).toContain('1 icon on a frame of 24 by 24')
    expect(html).not.toContain('<dt>Style</dt>')
  })

  it('is written by the font step, with the code points of the registry', async () => {
    const dir = copyFixture()

    await build(loadConfig(dir), { logger })

    const html = fs.readFileSync(path.join(dir, 'icons/acme-glyphs.html'), 'utf8')
    const registry = JSON.parse(fs.readFileSync(path.join(dir, 'codepoints.json'), 'utf8'))

    expect(
      Object.fromEntries(
        setOf(html).icons.map((/** @type {{ name: string, codepoint: string }} */ icon) => [
          icon.name,
          icon.codepoint
        ])
      )
    ).toEqual(registry.icons)
  })
})
