// The icon set of the repository, read from the configuration and the output of the build in
// `packages/icons`. The site shows this set, whatever its font, its prefix and its icons are.
//
// Only code that runs while Astro loads its configuration and its content imports this file:
// `astro.config.ts`, the integration and the content loader. Pages and components are
// bundled, so they read the set from `virtual:icon-set` and the icons from the collection.

import fs from 'node:fs'
import path from 'node:path'
import { loadConfig } from '../../../icons/build/config.js'
import { listIcons, parseName } from '../../../icons/build/names.js'

/**
 * URL path that the set of the repository is served from, in the folders of the package:
 * `icons/` and `svgs/`. It is under the path of the site, as the files of the Astro build
 * are, and apart from `/static/icons/`, which holds the icons of the site's own interface.
 */
export const SET_PATH = '/icons/static/set'

/** What the pages read of the set. It is the default export of `virtual:icon-set`. */
export interface IconSet {
  /** The name of the font, and of every file of `icons/`. */
  name: string
  /** The name of the set for a reader, made of the name of the font. */
  title: string
  /** What a class of the font starts with, before `-<icon>`. */
  prefix: string
  /** The width and the height of the frame an icon is drawn on. */
  frame: number
  /** The font formats, in the order of the `src` descriptor. */
  formats: string[]
  /** `name`, `version` and `description` of the package, and whether it is private. */
  package: { name: string; version: string; description: string; private: boolean }
  /** The icon that the examples of the pages show. */
  exampleIcon: string
  /** URL paths of the set on the site. */
  path: { stylesheet: string; sprite: string; svgs: string }
}

/** An icon of the set, as the content loader gives it to the `icons` collection. */
export interface SetIcon {
  name: string
  /** What the icon shows: the name without its style. */
  base: string
  /** The style it is drawn in, when the set has styles. */
  style?: string
  /** The code point of the icon in the font, in hexadecimal. */
  codepoint: string
  /** The optimized SVG file. */
  svg: string
}

/** Folder of the package of the set, from the root of the site. */
export function getSetDir(siteRoot: string): string {
  return path.resolve(siteRoot, '../icons')
}

/** The files of the set that the site reads. A change to one of them reloads the site. */
export function getSetFiles(siteRoot: string): string[] {
  const dir = getSetDir(siteRoot)
  const config = loadConfig(dir)

  return [path.join(dir, 'package.json'), path.join(config.iconsDir, `${config.name}.json`)]
}

/** A name in kebab-case as a title: `arrow-right` is "Arrow Right". */
export function toTitle(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function readCodepoints(file: string): Record<string, number> {
  if (!fs.existsSync(file)) {
    throw new Error(
      `The output of the icon set is missing: ${file} does not exist. Run \`pnpm icons\` first.`
    )
  }

  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/**
 * Reads the set of the repository.
 *
 * @param siteRoot The root of the site: the directory that holds `astro.config.ts`.
 * @param exampleIcon The icon that `config.yml` names for the examples. The first icon of the
 * set when it names none.
 */
export function loadIconSet(siteRoot: string, exampleIcon?: string): IconSet {
  const dir = getSetDir(siteRoot)
  const config = loadConfig(dir)
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  const names = listIcons(config.svgsDir)

  if (names.length === 0) {
    throw new Error(
      `The icon set has no icons: ${config.svgsDir} holds no SVG file. Run \`pnpm icons\` first.`
    )
  }

  if (exampleIcon !== undefined && !names.includes(exampleIcon)) {
    throw new Error(
      `\`exampleIcon\` of config.yml is "${exampleIcon}", and the icon set has no icon of that name. Name an icon of the set, or remove the key to show the first one.`
    )
  }

  return {
    name: config.name,
    title: toTitle(config.name),
    prefix: config.prefix,
    frame: config.frame,
    formats: config.formats,
    package: {
      name: config.packageName,
      version: config.version,
      description: typeof manifest.description === 'string' ? manifest.description : '',
      private: manifest.private === true
    },
    exampleIcon: exampleIcon ?? names[0],
    path: {
      stylesheet: `${SET_PATH}/icons/${config.name}.css`,
      sprite: `${SET_PATH}/icons/${config.name}.svg`,
      svgs: `${SET_PATH}/svgs`
    }
  }
}

/** Reads the icons of the set, in the order of their names. */
export function loadIcons(siteRoot: string): SetIcon[] {
  const config = loadConfig(getSetDir(siteRoot))
  const codepoints = readCodepoints(path.join(config.iconsDir, `${config.name}.json`))

  return listIcons(config.svgsDir).map((name) => {
    const codepoint = codepoints[name]

    if (codepoint === undefined) {
      throw new Error(
        `The icon "${name}" has no code point in ${config.name}.json. Run \`pnpm icons\` to build the font again.`
      )
    }

    const parsed = parseName(name, config.styles)
    const { base, style } = 'error' in parsed ? { base: name, style: null } : parsed

    return {
      name,
      base,
      style: style ?? undefined,
      codepoint: codepoint.toString(16).toUpperCase(),
      svg: fs.readFileSync(path.join(config.svgsDir, `${name}.svg`), 'utf8')
    }
  })
}

/**
 * Copies the output of the set into the `public` directory of the site, so that it is served
 * from `SET_PATH`. The stylesheet loads the font from its own folder, so the folders keep
 * the names they have in the package. Only the files that the package publishes are copied:
 * those of the font name, and the SVG files.
 */
export function copyIconSet(siteRoot: string, publicDir: string) {
  const config = loadConfig(getSetDir(siteRoot))
  const destination = path.join(publicDir, SET_PATH)

  fs.cpSync(config.iconsDir, path.join(destination, 'icons'), {
    recursive: true,
    filter: (source) =>
      source === config.iconsDir || path.basename(source).startsWith(`${config.name}.`)
  })
  fs.cpSync(config.svgsDir, path.join(destination, 'svgs'), {
    recursive: true,
    filter: (source) => source === config.svgsDir || path.extname(source) === '.svg'
  })
}
