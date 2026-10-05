/**
 * @file The site of a set. A copy of the repository is built as it is, and again after a
 * team replaced the set with its own: the fixture of the tests of the build. The site has
 * to show the set of the copy, whatever its font, its prefix and its icons are, to draw its
 * own interface with icons that exist, and to hold no link to a page that it does not have.
 *
 * Needs the build of `vendor/assets`, which `pnpm vendor` writes: `pnpm site:build` runs it.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { main } from '../../icons/build/cli.js'
import { loadConfig } from '../../icons/build/config.js'
import { listIcons } from '../../icons/build/names.js'
import { fixtureDir, recordingConsole } from '../../icons/test/helpers.js'

const siteDir = path.resolve(import.meta.dirname, '..')
const repositoryDir = path.resolve(siteDir, '../..')
const packageDir = path.join(repositoryDir, 'packages/icons')

// What a copy of the site is built with, and is not a part of: the installed packages and
// the assets of the interface. They are linked, not copied.
const LINKED = ['packages/site/node_modules', 'vendor']
// What Astro writes into the folder of the site
const WRITTEN = ['node_modules', 'public', '.astro', 'dist']

const BUILD_TIMEOUT = 300_000

const copies = []

afterEach(() => {
  for (const dir of copies.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

/**
 * A copy of what a team gets when it clones the repository: the package of the set with its
 * build and its output, the source, and the site. It is made in the cache folder of the
 * repository and not in the temporary folder of the machine: Astro reads a file of a linked
 * package by its path only when that path and the site have a folder in common.
 * @returns {string} The folder of the copy, removed after the test
 */
function cloneRepository() {
  const cache = path.join(repositoryDir, '.cache')

  fs.mkdirSync(cache, { recursive: true })

  const dir = fs.mkdtempSync(path.join(cache, 'site-test-'))

  copies.push(dir)

  const copy = (/** @type {string} */ file, /** @type {fs.CopySyncOptions} */ options = {}) =>
    fs.cpSync(path.join(repositoryDir, file), path.join(dir, file), {
      recursive: true,
      ...options
    })

  for (const file of ['build', 'svgs', 'icons', 'codepoints.json', 'package.json']) {
    copy(path.join('packages/icons', file))
  }

  copy(path.relative(repositoryDir, loadConfig(packageDir).sourceDir))
  copy('pnpm-workspace.yaml')
  copy('packages/site', {
    filter: (source) =>
      !WRITTEN.includes(path.relative(siteDir, source).split(path.sep)[0]) &&
      path.basename(source) !== '.DS_Store'
  })

  for (const file of LINKED) {
    fs.symlinkSync(path.join(repositoryDir, file), path.join(dir, file))
  }

  return dir
}

/**
 * Builds the site of a copy of the repository, as `pnpm astro:build` does.
 * @param {string} dir - The folder of the copy
 * @returns {string} The folder of the built site
 */
function buildSite(dir) {
  const astro = path.join(siteDir, 'node_modules/astro/bin/astro.mjs')

  try {
    execFileSync(process.execPath, [astro, 'build'], {
      cwd: path.join(dir, 'packages/site'),
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe'
    })
  } catch (error) {
    const { stdout, stderr } = /** @type {{ stdout: Buffer, stderr: Buffer }} */ (error)

    throw new Error(`The site did not build:\n${stdout}\n${stderr}`, { cause: error })
  }

  return path.join(dir, '_site')
}

/**
 * @param {string} dir
 * @returns {string[]} The HTML files of a folder and of its folders, from `dir`, sorted
 */
function listPages(dir) {
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
    .sort()
}

/**
 * @param {string} html
 * @returns {string} The text of a page, without its tags
 */
function textOf(html) {
  return html
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

/**
 * The ids of the symbols of a sprite file.
 * @param {string} file
 * @returns {Set<string>}
 */
function symbolsOf(file) {
  return new Set(
    [...fs.readFileSync(file, 'utf8').matchAll(/<symbol[^>]*\sid="([^"]+)"/g)].map(
      (match) => match[1]
    )
  )
}

/**
 * Checks the built site of a copy of the repository against the set of that copy.
 * @param {string} dir - The folder of the copy
 * @param {string} out - The folder of the built site
 */
function expectSiteOfSet(dir, out) {
  const config = loadConfig(path.join(dir, 'packages/icons'))
  const names = listIcons(config.svgsDir)
  const setPath = 'icons/static/set'
  const sprite = `/${setPath}/icons/${config.name}.svg`
  const read = (/** @type {string} */ file) => fs.readFileSync(path.join(out, file), 'utf8')

  expect(names.length).toBeGreaterThan(0)

  // The set is served as the package holds it, and nothing but the set
  expect(fs.readdirSync(path.join(out, setPath, 'svgs')).sort()).toEqual(
    names.map((name) => `${name}.svg`)
  )
  expect(fs.readdirSync(path.join(out, setPath, 'icons')).sort()).toEqual(
    ['css', 'json', 'min.css', 'scss', 'svg', ...config.formats]
      .map((extension) => `${config.name}.${extension}`)
      .sort()
  )

  // The list of the home page is the set
  const listed = [...read('icons/index.html').matchAll(/<li[^>]*\sdata-name="([^"]+)"/g)].map(
    (match) => match[1]
  )

  expect(listed).toEqual(names)

  // Each icon has a page, with the code that draws it
  for (const name of names) {
    const html = read(`icons/${name}/index.html`)
    const text = textOf(html)

    expect(html).toContain(`<link rel="stylesheet" href="/${setPath}/icons/${config.name}.css">`)
    expect(html).toContain(`href="/${setPath}/svgs/${name}.svg"`)
    expect(text).toContain(`<i class="${config.prefix}-${name}"></i>`)
    expect(text).toContain(`<use href="${config.name}.svg#${name}"></use>`)
    expect(text).toContain(`width="${config.frame}" height="${config.frame}"`)
  }

  // Every icon that a page draws is in the sprite that it is drawn from: an icon of the set
  // in the sprite of the set, and an icon of the interface in a sprite that the site serves
  const sprites = new Map()
  const missing = []
  let drawn = 0

  for (const page of listPages(out)) {
    const html = read(page)

    for (const [, href] of html.matchAll(/<use[^>]*\shref="([^"]*)"/g)) {
      const [file, id] = href.split('#')

      if (file === '') {
        // A symbol of the page itself
        if (!html.includes(`id="${id}"`)) {
          missing.push(`${page}: ${href}`)
        }

        continue
      }

      if (!sprites.has(file)) {
        const spriteFile = path.join(out, file)

        sprites.set(file, fs.existsSync(spriteFile) ? symbolsOf(spriteFile) : new Set())
      }

      if (!sprites.get(file).has(id)) {
        missing.push(`${page}: ${href}`)
      }

      drawn += file === sprite ? 1 : 0
    }
  }

  expect(missing).toEqual([])
  expect(drawn).toBeGreaterThan(names.length)
  // The interface is drawn from a sprite of its own
  expect([...sprites.keys()].filter((file) => file !== sprite).length).toBeGreaterThan(0)

  expect(brokenLinks(out)).toEqual([])
}

/**
 * The links of the built pages to a page or a heading of the site that is not there. A link
 * to another site of the host, outside the path of this one, is not followed.
 * @param {string} out - The folder of the built site
 * @returns {string[]} One line per broken link: the page and the address
 */
function brokenLinks(out) {
  const sitePath = '/icons'
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

  for (const page of listPages(path.join(out, sitePath))) {
    const pageFile = path.join(out, sitePath, page)
    const html = fs.readFileSync(pageFile, 'utf8')

    for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
      const [address, anchor] = href.split('#')

      if (/^[a-z]+:/.test(href) || (address !== '' && !address.startsWith(sitePath))) continue

      let file = address === '' ? pageFile : path.join(out, address)

      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html')
      }

      if (!fs.existsSync(file)) {
        broken.add(`${page}: ${href}`)
      } else if (anchor && file.endsWith('.html') && !idsOf(file).has(decodeURIComponent(anchor))) {
        broken.add(`${page}: ${href}`)
      }
    }
  }

  return [...broken]
}

describe('the site of a set', () => {
  it(
    'shows the set that the repository ships with',
    () => {
      const dir = cloneRepository()

      expectSiteOfSet(dir, buildSite(dir))
    },
    BUILD_TIMEOUT
  )

  it(
    'shows the set of a team that replaced the source and the configuration',
    async () => {
      const dir = cloneRepository()
      const adopted = path.join(dir, 'packages/icons')
      const shipped = loadConfig(adopted)
      const shippedNames = listIcons(shipped.svgsDir)
      const out = recordingConsole()

      // The team saves its own SVG files in place of those the repository ships with,
      fs.rmSync(shipped.sourceDir, { recursive: true })
      fs.cpSync(path.join(fixtureDir, 'source'), shipped.sourceDir, { recursive: true })

      // describes its set in the configuration,
      const manifestFile = path.join(adopted, 'package.json')
      const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
      const team = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'package.json'), 'utf8'))
      const { source } = manifest.chassis.build

      for (const key of ['name', 'version', 'private', 'description', 'homepage', 'repository']) {
        manifest[key] = team[key]
      }

      manifest.chassis.build = { ...team.chassis.build, source, checks: undefined }
      fs.writeFileSync(manifestFile, JSON.stringify(manifest))

      // starts a new set, and builds it,
      expect(await main(['init'], { packageDir: adopted, console: out })).toBe(0)
      expect(await main(['build'], { packageDir: adopted, console: out })).toBe(0)
      expect(out.lines.error).toEqual([])

      // and takes the example icon of the other set out of the configuration of the site
      const configFile = path.join(dir, 'packages/site/config.yml')
      const siteConfig = fs.readFileSync(configFile, 'utf8')

      expect(siteConfig).toMatch(/^exampleIcon:.*\n/m)
      fs.writeFileSync(configFile, siteConfig.replace(/^exampleIcon:.*\n/m, ''))

      const site = buildSite(dir)
      const teamNames = listIcons(path.join(fixtureDir, 'source'))

      expect(listIcons(loadConfig(adopted).svgsDir)).toEqual(teamNames)
      expectSiteOfSet(dir, site)

      // Nothing of the set that the repository ships with is left: not a page of an icon,
      // not a file of the set, not its font or its prefix in the code of a page
      for (const name of shippedNames) {
        expect(fs.existsSync(path.join(site, 'icons', name))).toBe(false)
      }

      for (const name of teamNames) {
        const text = textOf(fs.readFileSync(path.join(site, 'icons', name, 'index.html'), 'utf8'))

        expect(text).not.toContain(`class="${shipped.prefix}-`)
        expect(text).not.toContain(`${shipped.name}.svg#`)
      }
    },
    BUILD_TIMEOUT
  )

  it(
    'does not build with an example icon that the set does not have',
    () => {
      const dir = cloneRepository()
      const configFile = path.join(dir, 'packages/site/config.yml')
      const siteConfig = fs.readFileSync(configFile, 'utf8')

      fs.writeFileSync(
        configFile,
        siteConfig.replace(/^exampleIcon:.*\n/m, 'exampleIcon: "not-an-icon-of-the-set"\n')
      )

      expect(() => buildSite(dir)).toThrow(
        /`exampleIcon` of config\.yml is "not-an-icon-of-the-set"/
      )
    },
    BUILD_TIMEOUT
  )
})
