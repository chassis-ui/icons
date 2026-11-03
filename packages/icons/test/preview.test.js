import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { build } from '../lib/build.js'
import { loadConfig, resolveConfig } from '../lib/config.js'
import { silentLogger as logger } from '../lib/logger.js'
import { CHASSIS, renderPreview, servePreview, writePreview } from '../lib/preview.js'
import { createIndex } from '../lib/set-index.js'
import { copyFixture, fixtureDir, listFiles } from './helpers.js'

const config = loadConfig(fixtureDir)
const names = ['bar-fill', 'bar-line', 'ring-line']
const index = createIndex(config, names, {
  'bar-fill': 0xe900,
  'bar-line': 0xe901,
  'ring-line': 0xe905
})

/**
 * @param {import('../lib/config.js').Config} [of]
 * @param {import('../lib/set-index.js').SetIndex} [indexOf]
 * @returns {Promise<string>} The HTML of the page
 */
async function page(of = config, indexOf = index) {
  return (await renderPreview(of, indexOf))['index.html']
}

/**
 * @param {string} html - The page
 * @returns {any} The set that the page carries as JSON
 */
function setOf(html) {
  const match = html.match(/<script id="page_set" type="application\/json">\n([^]*?)\n<\/script>/)

  return JSON.parse(/** @type {RegExpMatchArray} */ (match)[1])
}

/**
 * @param {string} html - The page
 * @returns {string[]} The addresses of the stylesheets and the scripts that the page loads
 */
function loads(html) {
  return [...html.matchAll(/<(?:link rel="stylesheet" href|script[^>]* src)="([^"]+)"/g)].map(
    (match) => match[1]
  )
}

describe('the page of the set', () => {
  it('is a page, its stylesheet and its script', async () => {
    const files = await renderPreview(config, index)

    expect(Object.keys(files)).toEqual(['index.html', 'preview.css', 'preview.js'])
    expect(files['preview.css']).toContain('.page_grid {')
    expect(files['preview.js']).toContain("const sprite = set.name + '.svg'")
  })

  it('loads Chassis CSS and its script at a fixed version, with their hashes, and the files beside it', async () => {
    const html = await page()

    expect(html.startsWith('<!DOCTYPE html>\n<html lang="en">\n')).toBe(true)
    expect(html).toContain('<title>@acme/glyphs</title>')
    expect(loads(html)).toEqual([
      CHASSIS.stylesheet.url,
      'acme-glyphs.css',
      'preview.css',
      CHASSIS.script.url,
      'preview.js'
    ])

    for (const { url, integrity } of Object.values(CHASSIS)) {
      expect(url).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/npm\/@chassis-ui\/css@\d+\.\d+\.\d+\//)
      expect(integrity).toMatch(/^sha384-[\w+/]{64}$/)
      expect(html).toContain(`"${url}" integrity="${integrity}" crossorigin="anonymous"`)
    }
  })

  it('draws every icon from the sprite with its name, and does not hold the sprite', async () => {
    const html = await page()

    expect(html).not.toContain('<symbol')
    expect(html).toContain('<h1 class="font-title mb-0">@acme/glyphs <span class="badge')
    expect(html).toContain('3 icons on a frame of 16 by 16, in the font <code>acme-glyphs</code>')

    for (const name of names) {
      expect(html).toMatch(
        new RegExp(
          `<li data-name="${name}" data-style="\\w+"><button [^>]*data-cx-toggle="drawer" data-cx-target="#page_drawer"[^>]*><svg class="icon" width="16" height="16" aria-hidden="true"><use href="#${name}"></use></svg><span>${name}</span></button></li>`
        )
      )
    }
  })

  it('names its own elements apart from the icons, whose names are in kebab-case', async () => {
    const html = await page()
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
    const own = ids.filter((id) => !names.includes(id))

    expect(own.length).toBeGreaterThan(0)

    for (const id of own) {
      expect(id).toMatch(/^page_/)
    }
  })

  it('has a drawer with the examples and the code of an icon, and a filter of the styles', async () => {
    const html = await page()

    expect(html).toContain('<dialog class="drawer drawer-end page_drawer" id="page_drawer"')

    for (const part of ['sprite', 'font', 'embedded']) {
      expect(html).toContain(`<code data-page-snippet="${part}"></code>`)
      expect(html).toContain(`data-page-copy="${part}"`)
    }

    for (const part of ['unicode', 'css', 'js', 'html']) {
      expect(html).toContain(`data-page-codepoint="${part}"`)
    }

    for (const component of ['button primary', 'button-group', 'input-group', 'notification']) {
      expect(html).toContain(`class="${component}`)
    }

    for (const style of ['', 'line', 'fill']) {
      expect(html).toContain(`data-page-style="${style}"`)
    }
  })

  it('carries the icons with their code points and styles as JSON', async () => {
    const html = await page()

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
  })

  it('names no style for a set without styles', async () => {
    const manifest = { name: 'marks', chassis: { build: { name: 'marks', prefix: 'mk' } } }
    const marks = resolveConfig(manifest, fixtureDir)
    const html = await page(marks, createIndex(marks, ['dot'], { dot: 0xf101 }))

    expect(setOf(html)).toEqual({
      name: 'marks',
      prefix: 'mk',
      frame: 24,
      styles: [],
      icons: [{ name: 'dot', codepoint: 'f101' }]
    })
    expect(html).toContain('<title>marks</title>')
    expect(html).toContain('<h1 class="font-title mb-0">marks</h1>')
    expect(html).toContain('1 icon on a frame of 24 by 24')
    expect(html).toContain('<li data-name="dot"><button')
    expect(html).not.toContain('data-page-style="')
  })

  it('is written into preview/ from the output, with the files it draws and links', async () => {
    const dir = copyFixture()
    const built = loadConfig(dir)

    await build(built, { logger })
    fs.mkdirSync(path.join(dir, 'preview'))
    fs.writeFileSync(path.join(dir, 'preview/stale.html'), '')

    const files = await writePreview(built)
    const web = listFiles(path.join(dir, 'dist/web'))
    const svgs = listFiles(path.join(dir, 'dist/svgs')).map((name) => `svgs/${name}`)

    expect(files).toEqual(['index.html', 'preview.css', 'preview.js', ...web, ...svgs].sort())
    expect(listFiles(path.join(dir, 'preview'))).toEqual(files)

    const html = fs.readFileSync(path.join(dir, 'preview/index.html'), 'utf8')
    const registry = JSON.parse(fs.readFileSync(path.join(dir, 'codepoints.json'), 'utf8'))

    expect(
      Object.fromEntries(
        setOf(html).icons.map((/** @type {{ name: string, codepoint: string }} */ icon) => [
          icon.name,
          icon.codepoint
        ])
      )
    ).toEqual(registry.icons)
    expect(fs.readFileSync(path.join(dir, 'preview/acme-glyphs.svg'))).toEqual(
      fs.readFileSync(path.join(dir, 'dist/web/acme-glyphs.svg'))
    )
  })

  it('needs the output', async () => {
    await expect(writePreview(loadConfig(copyFixture()))).rejects.toThrow(
      'There is no dist/icons.json. Run the build first.'
    )
  })
})

describe('the server of the page', () => {
  it('serves the files of the folder, and nothing outside it', async () => {
    const dir = copyFixture()
    const built = loadConfig(dir)

    await build(built, { logger })
    await writePreview(built)

    const { server, url } = await servePreview(built.previewDir, { port: 0 })

    try {
      const get = (/** @type {string} */ address) => fetch(new URL(address, url))
      const index = await get('/')
      const sprite = await get('acme-glyphs.svg')

      expect(url).toMatch(/^http:\/\/localhost:\d+\/$/)
      expect(index.status).toBe(200)
      expect(index.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(await index.text()).toBe(
        fs.readFileSync(path.join(built.previewDir, 'index.html'), 'utf8')
      )
      expect(sprite.headers.get('content-type')).toBe('image/svg+xml')
      expect((await get('svgs/bar-fill.svg')).status).toBe(200)
      expect((await get('missing.svg')).status).toBe(404)
      expect((await get('/%2e%2e/package.json')).status).toBe(404)
    } finally {
      server.close()
    }
  })
})
