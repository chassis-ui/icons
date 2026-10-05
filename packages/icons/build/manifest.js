/**
 * @file The fourth step of the build: what the package says about its output. The files of
 * `icons/` are named after the font, so the fields of package.json that point at them, and
 * the README that shows how to use them, are written from the configuration.
 */

import fs from 'node:fs'
import path from 'node:path'
import Handlebars from 'handlebars'

/** The manifest of the package, and the template of its README beside the other templates. */
export const MANIFEST_FILE = 'package.json'
export const README_FILE = 'README.md'

/** The stylesheets load the font, so a bundler may not drop an import of one as unused. */
const SIDE_EFFECTS = ['*.css', '*.scss']

/**
 * The fields of package.json that follow from the configuration.
 * @param {import('./config.js').Config} config
 * @returns {{ main: string, style: string, sass: string, files: string[], exports: Record<string, any>, sideEffects: string[] }}
 */
export function manifestFields(config) {
  const css = `icons/${config.name}.css`
  const scss = `icons/${config.name}.scss`

  return {
    main: css,
    style: css,
    sass: scss,
    // Every file of the font name, and so not the preview page
    files: [`icons/${config.name}.*`, 'svgs/*.svg'],
    exports: {
      '.': { sass: `./${scss}`, style: `./${css}`, default: `./${css}` },
      './icons/*': './icons/*',
      './svgs/*': './svgs/*',
      './package.json': './package.json'
    },
    sideEffects: SIDE_EFFECTS
  }
}

/**
 * Whether an entry of `files` or a key of `exports` is about the output, which the build
 * writes, or is one that a team added for a file of its own.
 * @param {string} entry
 * @returns {boolean}
 */
function isOutput(entry) {
  return /^!?(?:\.\/)?(?:icons|svgs)(?:\/|$)/.test(entry)
}

/**
 * Puts the fields of the configuration into a manifest. A field that is there keeps its
 * place, and a new one goes before the `chassis` block. An entry of `files` and a key of
 * `exports` that are not about the output are kept.
 * @param {Record<string, any>} manifest - The contents of package.json
 * @param {import('./config.js').Config} config
 * @returns {Record<string, any>} A new manifest
 */
export function applyManifestFields(manifest, config) {
  const fields = manifestFields(config)
  const ownFiles = Array.isArray(manifest.files)
    ? manifest.files.filter(
        (entry) => typeof entry === 'string' && !isOutput(entry) && !fields.files.includes(entry)
      )
    : []
  const ownExports =
    manifest.exports && typeof manifest.exports === 'object' && !Array.isArray(manifest.exports)
      ? Object.fromEntries(
          Object.entries(manifest.exports).filter(
            ([key]) => !(key in fields.exports) && !isOutput(key)
          )
        )
      : {}

  fields.files = [...fields.files, ...ownFiles]
  fields.exports = { ...fields.exports, ...ownExports }

  /** @type {Record<string, any>} */
  const result = {}
  const missing = Object.keys(fields).filter((key) => !(key in manifest))
  const insert = () => {
    for (const key of missing.splice(0)) result[key] = fields[key]
  }

  for (const [key, value] of Object.entries(manifest)) {
    if (key === 'chassis') insert()
    result[key] = key in fields ? fields[key] : value
  }

  insert()
  return result
}

/**
 * The text of package.json with the fields of the configuration.
 * @param {string} text - The text of package.json as it is
 * @param {import('./config.js').Config} config
 * @returns {string} The same text when every field is what the configuration gives
 */
export function renderManifest(text, config) {
  const manifest = JSON.parse(text)
  const applied = applyManifestFields(manifest, config)

  return JSON.stringify(applied) === JSON.stringify(manifest)
    ? text
    : `${JSON.stringify(applied, null, 2)}\n`
}

/**
 * The address of a repository as a browser opens it.
 * @param {unknown} repository - `repository` of package.json: an address, or `{ url }`
 * @returns {string | null}
 */
export function repositoryUrl(repository) {
  const url = typeof repository === 'string' ? repository : /** @type {any} */ (repository)?.url

  if (typeof url !== 'string' || !/^(?:git\+)?https?:\/\//.test(url)) {
    return null
  }

  return url.replace(/^git\+/, '').replace(/\.git$/, '')
}

/**
 * The README of the package: what it holds and the ways to use an icon of the set.
 * @param {import('./config.js').Config} config
 * @param {Record<string, any>} manifest - The contents of package.json
 * @param {string[]} names - The names of the icons of the set
 * @returns {string}
 */
export function renderReadme(config, manifest, names) {
  const template = fs.readFileSync(path.join(config.templatesDir, 'readme.hbs'), 'utf8')
  const text = (/** @type {unknown} */ value) =>
    typeof value === 'string' && value !== '' ? value : null

  return Handlebars.compile(template, { noEscape: true })({
    name: config.name,
    prefix: config.prefix,
    frame: config.frame,
    formats: config.formats,
    styles: config.styles,
    packageName: config.packageName,
    description: text(manifest.description),
    homepage: text(manifest.homepage),
    repository: repositoryUrl(manifest.repository),
    license: text(manifest.license),
    count: names.length,
    single: names.length === 1,
    icon: names[0]
  })
}

/**
 * The manifest and the README of the package, as the configuration makes them.
 * @param {import('./config.js').Config} config
 * @param {string[]} names - The names of the icons of the set
 * @returns {Record<string, string>} The contents of each file, by file name
 */
export function renderPackageFiles(config, names) {
  const text = fs.readFileSync(path.join(config.packageDir, MANIFEST_FILE), 'utf8')
  const manifest = renderManifest(text, config)

  return {
    [MANIFEST_FILE]: manifest,
    [README_FILE]: renderReadme(config, JSON.parse(manifest), names)
  }
}
