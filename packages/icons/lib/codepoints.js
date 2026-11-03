/**
 * @file The code points of a set. An icon keeps the code point it was given, a new icon never
 * moves another, and the code point of a removed icon is retired: no later icon gets it. The
 * registry is the record of both, and the build is its only writer.
 */

import fs from 'node:fs'
import { PRIVATE_USE_AREA } from './config.js'
import { compareNames } from './names.js'

/**
 * @typedef {object} Registry
 * @property {Record<string, number>} icons - The code point of each icon, in the order the
 *   icons were added
 * @property {number[]} retired - The code points of the icons that were removed, ascending
 */

/** @returns {Registry} */
export function emptyRegistry() {
  return { icons: {}, retired: [] }
}

/**
 * @param {number} codepoint
 * @returns {string} Four hexadecimal digits, as in the `content` of a class
 */
export function toHex(codepoint) {
  return codepoint.toString(16).padStart(4, '0')
}

/**
 * @param {unknown} value - Four hexadecimal digits
 * @param {string} where - The file and the entry, for the message
 * @returns {number}
 */
function fromHex(value, where) {
  if (typeof value !== 'string' || !/^[\da-f]{4}$/.test(value)) {
    throw new Error(
      `${where} has to be a code point such as "f101", and is ${JSON.stringify(value)}`
    )
  }

  return parseInt(value, 16)
}

/**
 * Reads a registry. A file that does not exist is the registry of a new set.
 * @param {string} file
 * @returns {Registry}
 */
export function readRegistry(file) {
  if (!fs.existsSync(file)) {
    return emptyRegistry()
  }

  return parseRegistry(JSON.parse(fs.readFileSync(file, 'utf8')), file)
}

/**
 * @param {any} data - The contents of a registry file
 * @param {string} [file] - Its name, for the messages
 * @returns {Registry}
 */
export function parseRegistry(data, file = 'The registry') {
  const icons = data?.icons ?? {}
  const retired = data?.retired ?? []

  if (typeof icons !== 'object' || Array.isArray(icons) || !Array.isArray(retired)) {
    throw new Error(`${file} has to hold an "icons" object and a "retired" list`)
  }

  return {
    icons: Object.fromEntries(
      Object.entries(icons).map(([name, hex]) => [name, fromHex(hex, `${file}: "${name}"`)])
    ),
    retired: retired.map((hex) => fromHex(hex, `${file}: an entry of "retired"`))
  }
}

/**
 * @param {Registry} registry
 * @returns {string} The contents of its file
 */
export function formatRegistry(registry) {
  const data = {
    icons: Object.fromEntries(
      Object.entries(registry.icons).map(([name, codepoint]) => [name, toHex(codepoint)])
    ),
    retired: registry.retired.map((codepoint) => toHex(codepoint))
  }

  return `${JSON.stringify(data, null, 2)}\n`
}

/**
 * Brings a registry up to date with the icons of a set. An icon that is in both keeps its
 * code point and its place. The code point of an icon that is gone is retired. A new icon
 * gets the first code point, from `start`, that no icon has or had, and is added at the end.
 * @param {Registry} registry - It is not changed
 * @param {string[]} names - The names of the icons of the set
 * @param {number} start - The code point of the first icon of a new set
 * @returns {{ registry: Registry, added: string[], removed: string[] }}
 */
export function allocate(registry, names, start) {
  const present = new Set(names)
  /** @type {Record<string, number>} */
  const icons = {}
  const removed = []
  const retired = new Set(registry.retired)

  for (const [name, codepoint] of Object.entries(registry.icons)) {
    if (present.has(name)) {
      icons[name] = codepoint
    } else {
      removed.push(name)
      retired.add(codepoint)
    }
  }

  const taken = new Set([...Object.values(icons), ...retired])
  const added = names.filter((name) => !(name in icons)).sort(compareNames)
  let next = start

  for (const name of added) {
    while (taken.has(next)) next++

    if (next > PRIVATE_USE_AREA.last) {
      throw new Error(
        `There is no code point left for "${name}": the Private Use Area ends at ${toHex(PRIVATE_USE_AREA.last)}`
      )
    }

    icons[name] = next
    taken.add(next)
  }

  return {
    registry: { icons, retired: [...retired].sort((a, b) => a - b) },
    added,
    removed
  }
}

/**
 * What is wrong with a registry, if anything.
 * @param {Registry} registry
 * @returns {string[]} One message per problem
 */
export function checkRegistry(registry) {
  const problems = []
  const owners = new Map()
  const retired = new Set(registry.retired)

  for (const [name, codepoint] of Object.entries(registry.icons)) {
    const hex = toHex(codepoint)

    if (codepoint < PRIVATE_USE_AREA.first || codepoint > PRIVATE_USE_AREA.last) {
      problems.push(`"${name}" has the code point ${hex}, outside the Private Use Area`)
    }

    if (owners.has(codepoint)) {
      problems.push(`"${name}" and "${owners.get(codepoint)}" share the code point ${hex}`)
    } else {
      owners.set(codepoint, name)
    }

    if (retired.has(codepoint)) {
      problems.push(`"${name}" has the code point ${hex}, which is retired`)
    }
  }

  return problems
}

/**
 * The icons that do not have the code point they had before.
 * @param {Registry} registry
 * @param {Record<string, number>} baseline - The code points of an earlier state of the set
 * @returns {string[]} One message per problem
 */
export function checkAgainstBaseline(registry, baseline) {
  const problems = []
  const owners = new Map(Object.entries(registry.icons).map(([name, cp]) => [cp, name]))

  for (const [name, codepoint] of Object.entries(baseline)) {
    const current = registry.icons[name]

    if (current !== undefined && current !== codepoint) {
      problems.push(`"${name}" moved from the code point ${toHex(codepoint)} to ${toHex(current)}`)
    } else if (current === undefined && owners.has(codepoint)) {
      problems.push(
        `"${owners.get(codepoint)}" has the code point ${toHex(codepoint)}, which "${name}" had`
      )
    }
  }

  return problems
}
