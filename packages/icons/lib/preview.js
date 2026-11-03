/**
 * @file The page of a set: every icon with its name, a search, a filter by style, and a
 * Chassis drawer with the icon at size, examples of it in Chassis components and the code that
 * draws it. It is a folder, `preview/`, written from the output of the build and not part of
 * it: `index.html` from a template, its stylesheet and its script, and the files of
 * `dist/web/` and `dist/svgs/` that it draws and links. It is not committed and not published;
 * the archive of a release holds it, and `chassis-icons preview --serve` serves it. It takes
 * Chassis CSS and its script from a CDN, at a fixed version and with their hashes.
 */

import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import Handlebars from 'handlebars'
import { parseIndex } from './set-index.js'

/** The files of Chassis CSS that draw the page, from jsDelivr, with their SRI hashes. */
export const CHASSIS = {
  stylesheet: {
    url: 'https://cdn.jsdelivr.net/npm/@chassis-ui/css@0.14.0/dist/css/chassis.min.css',
    integrity: 'sha384-lDzLKprPM68pAchvByLYQJxnW5mqsw6+40MjyE9EeXG1sub3gmOItrSXLUUnmZLf'
  },
  script: {
    url: 'https://cdn.jsdelivr.net/npm/@chassis-ui/css@0.14.0/dist/js/chassis.bundle.min.js',
    integrity: 'sha384-Du/Sv3rXK6JMypXaEI9ayalblI5XrFGBAEMRKSaYOskg7H7AhcFx0QAdqmf8vTUf'
  }
}

/** The files of the page that are not written from a template, beside it in `templates/preview/`. */
const STATIC_FILES = ['preview.css', 'preview.js']

/**
 * The JSON of the set that the page carries: the index, with one line per icon.
 * @param {import('./set-index.js').SetIndex} index
 * @returns {string}
 */
function setJson(index) {
  const { name, prefix, frame, styles } = index
  const head = Object.entries({ name, prefix, frame, styles }).map(
    ([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`
  )
  const icons = index.icons.map(
    ({ name: icon, codepoint, style }) =>
      `    ${JSON.stringify(style ? { name: icon, codepoint, style } : { name: icon, codepoint })}`
  )

  // Names are in kebab-case, so the JSON holds no "<" that could end the script element
  return `{\n${head.join(',\n')},\n  "icons": [\n${icons.join(',\n')}\n  ]\n}`
}

/**
 * The files of the page that come from the templates: `index.html`, its stylesheet and its
 * script.
 * @param {import('./config.js').Config} config
 * @param {import('./set-index.js').SetIndex} index - The index of the set, as the build wrote it
 * @returns {Promise<Record<string, string>>} The contents of each file, by file name
 */
export async function renderPreview(config, index) {
  const dir = path.join(config.templatesDir, 'preview')
  const template = await fs.readFile(path.join(dir, 'index.hbs'), 'utf8')
  const count = index.icons.length

  return {
    'index.html': Handlebars.compile(template)({
      title: config.packageName || index.name,
      version: config.version,
      name: index.name,
      prefix: index.prefix,
      frame: index.frame,
      styles: index.styles,
      count,
      single: count === 1,
      icons: index.icons,
      // The drawer shows the first icon until another is chosen
      first: index.icons[0]?.name,
      set: setJson(index),
      chassis: CHASSIS
    }),
    ...Object.fromEntries(
      await Promise.all(
        STATIC_FILES.map(async (file) => [file, await fs.readFile(path.join(dir, file), 'utf8')])
      )
    )
  }
}

/**
 * Writes the page of the set from its output. The folder is emptied first: it holds nothing
 * but the page.
 * @param {import('./config.js').Config} config
 * @param {object} [options]
 * @param {string} [options.outDir] - Where the page is written; `preview/` of the repository
 * @returns {Promise<string[]>} The files of the page, by their paths from `outDir`, sorted
 * @throws {Error} When the output is not built
 */
export async function writePreview(config, { outDir = config.previewDir } = {}) {
  const indexText = await fs.readFile(config.indexFile, 'utf8').catch(() => null)

  if (indexText === null) {
    throw new Error(
      `There is no ${path.relative(config.packageDir, config.indexFile)}. Run the build first.`
    )
  }

  const index = parseIndex(indexText)

  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(path.join(outDir, 'svgs'), { recursive: true })

  for (const [name, contents] of Object.entries(await renderPreview(config, index))) {
    await fs.writeFile(path.join(outDir, name), contents)
  }

  // The stylesheets of the font, the font and the sprite beside the page, as in `dist/web/`,
  // so that the page links them by name; and the SVG files for the downloads
  await fs.cp(config.webDir, outDir, { recursive: true })

  for (const { name } of index.icons) {
    await fs.copyFile(
      path.join(config.svgsDir, `${name}.svg`),
      path.join(outDir, 'svgs', `${name}.svg`)
    )
  }

  const files = await fs.readdir(outDir, { recursive: true, withFileTypes: true })

  return files
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(outDir, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
    )
    .sort()
}

/** The media types of the files of the page. */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
}

/**
 * Serves a folder over HTTP on this machine, for the page of the set. It answers GET and HEAD
 * with the files of the folder, `index.html` for the folder itself, and 404 for anything else.
 * @param {string} dir
 * @param {object} [options]
 * @param {number} [options.port] - 0 for any free port
 * @param {string} [options.host]
 * @returns {Promise<{ server: http.Server, url: string }>}
 */
export function servePreview(dir, { port = 4325, host = 'localhost' } = {}) {
  const root = path.resolve(dir)
  const server = http.createServer(async (request, response) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost')
    const file = path.join(root, decodeURIComponent(pathname).replace(/\/$/, '/index.html'))
    const contents =
      file.startsWith(root + path.sep) && (request.method === 'GET' || request.method === 'HEAD')
        ? await fs.readFile(file).catch(() => null)
        : null

    if (contents === null) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found')
      return
    }

    response.writeHead(200, {
      'content-type':
        TYPES[/** @type {keyof typeof TYPES} */ (path.extname(file))] ?? 'application/octet-stream',
      'content-length': contents.length
    })
    response.end(request.method === 'HEAD' ? undefined : contents)
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      const address = /** @type {import('node:net').AddressInfo} */ (server.address())

      resolve({ server, url: `http://${host}:${address.port}/` })
    })
  })
}
