/**
 * @file The configuration of a set: the `chassis.build` block of the package's package.json.
 * Everything that is particular to a set is read here, so that no other module of the build
 * names a font, a prefix or an icon.
 */

import fs from 'node:fs'
import path from 'node:path'

/** The first and the last code point of the Private Use Area of the Basic Multilingual Plane. */
export const PRIVATE_USE_AREA = { first: 0xe000, last: 0xf8ff }

/** The font formats the build writes, with the name of each in a `src` descriptor. */
export const FONT_FORMATS = { woff2: 'woff2', woff: 'woff', ttf: 'truetype' }

/** The page of the sprite, for a look at the set. It is not a part of the published output. */
export const PREVIEW_FILE = 'preview.html'

const NAME = /^[a-z][\da-z]*(?:-[\da-z]+)*$/

const DEFAULTS = {
  source: '../../source',
  checks: '../../chassis.checks.json',
  frame: 24,
  styles: [],
  pairs: [],
  startCodepoint: 'f101',
  formats: ['woff2', 'woff'],
  header: []
}

/** A configuration that the build cannot use. Its message says which setting, and why. */
export class ConfigError extends Error {
  name = 'ConfigError'
}

/**
 * @typedef {object} Config
 * @property {string} name - The name of the font, and of every file of `icons/`
 * @property {string} prefix - What a class of the font starts with, before `-<icon>`
 * @property {number} frame - The width and the height of the frame an icon is drawn on
 * @property {string[]} styles - The last part a name may have; any name when empty
 * @property {string[][]} pairs - The styles an icon has to come in together
 * @property {number} startCodepoint - The code point of the first icon of a new set
 * @property {string[]} formats - The font formats, in the order of the `src` descriptor
 * @property {string[]} header - The lines of the comment at the top of each stylesheet
 * @property {string} packageName - `name` of package.json
 * @property {string} version - `version` of package.json
 * @property {string} packageDir - The folder of the package
 * @property {string} sourceDir - The SVG files a team saves. The build only reads it
 * @property {string} checksFile - The icons that others read by name. It may not exist
 * @property {string} svgsDir - Output: the optimized SVG files
 * @property {string} iconsDir - Output: the font, its stylesheets and the sprite
 * @property {string} registryFile - The code points the set has given out
 * @property {string} templatesDir - The templates of the stylesheets, beside this file
 */

/**
 * Reads and checks the configuration of the package in `packageDir`.
 * @param {string} packageDir
 * @returns {Config}
 */
export function loadConfig(packageDir) {
  const manifestFile = path.join(packageDir, 'package.json')

  if (!fs.existsSync(manifestFile)) {
    throw new ConfigError(`There is no package.json in ${packageDir}`)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))

  return resolveConfig(manifest, packageDir)
}

/**
 * Checks the `chassis.build` block of a manifest and fills in what it leaves out.
 * @param {Record<string, any>} manifest - The contents of package.json
 * @param {string} packageDir
 * @returns {Config}
 */
export function resolveConfig(manifest, packageDir) {
  const block = manifest.chassis?.build

  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    throw new ConfigError('package.json has no "chassis.build" block')
  }

  const unknown = Object.keys(block).filter(
    (key) => !(key in DEFAULTS) && key !== 'name' && key !== 'prefix'
  )

  if (unknown.length > 0) {
    throw new ConfigError(`Unknown setting in "chassis.build": ${unknown.join(', ')}`)
  }

  const settings = { ...DEFAULTS, ...block }
  const { name, prefix, source, checks, frame, styles, pairs, formats, header } = settings

  if (typeof name !== 'string' || !NAME.test(name)) {
    throw new ConfigError(
      `"name" has to be a kebab-case name such as "acme-icons", and is ${show(name)}`
    )
  }

  if (typeof prefix !== 'string' || !NAME.test(prefix)) {
    throw new ConfigError(
      `"prefix" has to be a kebab-case name such as "ac", and is ${show(prefix)}`
    )
  }

  if (typeof source !== 'string' || source === '') {
    throw new ConfigError(`"source" has to be a folder, and is ${show(source)}`)
  }

  if (typeof checks !== 'string' || checks === '') {
    throw new ConfigError(`"checks" has to be a file, and is ${show(checks)}`)
  }

  if (!Number.isInteger(frame) || frame <= 0) {
    throw new ConfigError(`"frame" has to be a whole number above zero, and is ${show(frame)}`)
  }

  if (!isStringArray(styles) || styles.some((style) => !NAME.test(style))) {
    throw new ConfigError(`"styles" has to be a list of kebab-case names, and is ${show(styles)}`)
  }

  if (new Set(styles).size !== styles.length) {
    throw new ConfigError(`"styles" names a style twice: ${show(styles)}`)
  }

  if (
    !Array.isArray(pairs) ||
    pairs.some(
      (pair) => !isStringArray(pair) || pair.length < 2 || new Set(pair).size !== pair.length
    )
  ) {
    throw new ConfigError(
      `"pairs" has to be a list of lists of two or more styles, and is ${show(pairs)}`
    )
  }

  const unlisted = pairs.flat().filter((style) => !styles.includes(style))

  if (unlisted.length > 0) {
    throw new ConfigError(`"pairs" names a style that "styles" does not: ${unlisted.join(', ')}`)
  }

  if (
    !isStringArray(formats) ||
    formats.length === 0 ||
    formats.some((format) => !(format in FONT_FORMATS)) ||
    new Set(formats).size !== formats.length
  ) {
    throw new ConfigError(
      `"formats" has to be a list of ${Object.keys(FONT_FORMATS).join(', ')}, and is ${show(formats)}`
    )
  }

  if (!isStringArray(header)) {
    throw new ConfigError(`"header" has to be a list of lines, and is ${show(header)}`)
  }

  if (header.some((line) => line.includes('*/') || /[\n\r]/.test(line))) {
    throw new ConfigError('A line of "header" cannot hold "*/" or a line break')
  }

  const version = typeof manifest.version === 'string' ? manifest.version : ''

  return {
    name,
    prefix,
    frame,
    styles,
    pairs,
    startCodepoint: parseStartCodepoint(settings.startCodepoint),
    formats,
    header: header.map((line) => line.replaceAll('{version}', version)),
    packageName: typeof manifest.name === 'string' ? manifest.name : '',
    version,
    packageDir,
    sourceDir: path.resolve(packageDir, source),
    checksFile: path.resolve(packageDir, checks),
    svgsDir: path.join(packageDir, 'svgs'),
    iconsDir: path.join(packageDir, 'icons'),
    registryFile: path.join(packageDir, 'codepoints.json'),
    templatesDir: path.join(import.meta.dirname, 'templates')
  }
}

/**
 * @param {unknown} value - A code point in hexadecimal, such as "f101"
 * @returns {number}
 */
function parseStartCodepoint(value) {
  const codepoint =
    typeof value === 'string' && /^[\da-f]{4}$/i.test(value) ? parseInt(value, 16) : NaN

  if (!(codepoint >= PRIVATE_USE_AREA.first && codepoint <= PRIVATE_USE_AREA.last)) {
    throw new ConfigError(
      `"startCodepoint" has to be a code point of the Private Use Area, "e000" to "f8ff", and is ${show(value)}`
    )
  }

  return codepoint
}

/**
 * @param {unknown} value
 * @returns {value is string[]}
 */
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function show(value) {
  return value === undefined ? 'missing' : JSON.stringify(value)
}
