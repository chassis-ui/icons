/**
 * @file The built site: the documentation of the builder, which shows no set. Every page is a
 * page of the documentation or the home page, every icon that a page draws is in a sprite
 * that the site serves, and every link leads to a page of the site that is there.
 *
 * Reads `_site/`, which `pnpm site:build` writes: CI builds the site before this test.
 */

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const siteDir = path.resolve(import.meta.dirname, '..')
const out = path.resolve(siteDir, '../../_site')
/** The path that chassis-ui.com serves this site from */
const sitePath = '/icons'

/**
 * @param {string} dir
 * @returns {string[]} The HTML files of a folder and of its folders, from `dir`, sorted
 */
function listPages(dir) {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) =>
      path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
    )
    .sort()
}

/**
 * @param {string} file - A sprite
 * @returns {Set<string>} The ids of its symbols
 */
function symbolsOf(file) {
  return new Set(
    [...fs.readFileSync(file, 'utf8').matchAll(/<symbol[^>]*\sid="([^"]+)"/g)].map(
      (match) => match[1]
    )
  )
}

const read = (/** @type {string} */ page) => fs.readFileSync(path.join(out, page), 'utf8')

describe('the site', () => {
  it('is built', () => {
    expect(
      fs.existsSync(path.join(out, sitePath.slice(1), 'index.html')),
      'Run pnpm site:build first'
    ).toBe(true)
  })

  it('is the documentation of the builder, and shows no set', () => {
    const pages = listPages(path.join(out, sitePath.slice(1)))
    // The home page, the pages of the documentation, the page of a missing address
    const others = pages.filter(
      (page) => page !== 'index.html' && !page.startsWith('docs/') && page !== '404.html'
    )

    expect(pages).toContain('index.html')
    expect(pages).toContain('docs/getting-started/quick-start/index.html')
    expect(others).toEqual([])
    expect(fs.existsSync(path.join(out, sitePath.slice(1), 'static/set'))).toBe(false)
  })

  it('draws every icon of its pages from a sprite that it serves', () => {
    const sprites = new Map()
    const missing = []
    let drawn = 0

    for (const page of listPages(out)) {
      const html = read(page)

      for (const [, href] of html.matchAll(/<use[^>]*\shref="([^"]*)"/g)) {
        // A shared sprite is linked with `?v=` and a hash of the file
        const [address, id] = href.split('#')

        if (address === '') {
          // A symbol of the page itself
          if (!html.includes(`id="${id}"`)) missing.push(`${page}: ${href}`)
          continue
        }

        const file = path.posix.resolve('/', path.posix.dirname(`/${page}`), address.split('?')[0])

        if (!sprites.has(file)) {
          const spriteFile = path.join(out, file)

          sprites.set(file, fs.existsSync(spriteFile) ? symbolsOf(spriteFile) : new Set())
        }

        if (!sprites.get(file).has(id)) missing.push(`${page}: ${href}`)
        drawn += 1
      }
    }

    expect(missing).toEqual([])
    expect(drawn).toBeGreaterThan(0)
  })

  it('holds no link to a page or a heading of the site that is not there', () => {
    const ids = new Map()
    const broken = new Set()

    const idsOf = (/** @type {string} */ file) => {
      if (!ids.has(file)) {
        ids.set(
          file,
          new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
        )
      }

      return ids.get(file)
    }

    for (const page of listPages(path.join(out, sitePath.slice(1)))) {
      const pageFile = path.join(out, sitePath, page)
      const html = fs.readFileSync(pageFile, 'utf8')

      for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
        const [address, anchor] = href.split('#')

        // A link to another site of the host, outside the path of this one, is not followed
        if (/^[a-z]+:/.test(href) || (address !== '' && !address.startsWith(sitePath))) continue

        let file = address === '' ? pageFile : path.join(out, address)

        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
          file = path.join(file, 'index.html')
        }

        if (!fs.existsSync(file)) {
          broken.add(`${page}: ${href}`)
        } else if (
          anchor &&
          file.endsWith('.html') &&
          !idsOf(file).has(decodeURIComponent(anchor))
        ) {
          broken.add(`${page}: ${href}`)
        }
      }
    }

    expect([...broken]).toEqual([])
  })
})
