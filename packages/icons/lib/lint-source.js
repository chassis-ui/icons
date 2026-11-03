/**
 * @file The check of the source folder: whether each SVG file can be an icon of the set that
 * the configuration describes. The build draws whatever it is given, so a file that this
 * check refuses would become a wrong class, a wrong glyph or a wrong symbol.
 */

import fs from 'node:fs'
import path from 'node:path'
import { optimize } from 'svgo'
import { listIcons, parseName } from './names.js'

// What a font or a sprite symbol in one color cannot hold, or should not
const FORBIDDEN_ELEMENTS = {
  image: 'holds a raster image',
  script: 'holds a script',
  foreignObject: 'holds content that is not SVG',
  linearGradient: 'holds a gradient: an icon has one color',
  radialGradient: 'holds a gradient: an icon has one color',
  pattern: 'holds a pattern: an icon has one color'
}

const NO_PAINT = new Set(['none', 'transparent'])

/**
 * @typedef {object} Problem
 * @property {string} file - The file of the source folder, or the name of the icon
 * @property {string} message
 */

/**
 * Checks the markup of one SVG file.
 * @param {string} svg - The contents of the file
 * @param {number} frame - The width and the height an icon is drawn on
 * @returns {string[]} One message per problem
 */
export function lintSvg(svg, frame) {
  const problems = new Set()
  const colors = new Set()
  let root = false

  const paint = (/** @type {string} */ value) => {
    const color = value.trim().toLowerCase()

    if (color !== '' && !NO_PAINT.has(color)) {
      colors.add(
        color === 'currentcolor'
          ? color
          : color.replace(/^#([\da-f])\1([\da-f])\2([\da-f])\3$/, '#$1$2$3')
      )
    }
  }

  try {
    optimize(svg, {
      plugins: [
        {
          name: 'lintSource',
          fn() {
            return {
              element: {
                enter(node, parentNode) {
                  if (node.name === 'svg' && parentNode.type === 'root') {
                    root = true
                    checkFrame(node.attributes, frame, problems)
                  }

                  if (node.name in FORBIDDEN_ELEMENTS) {
                    problems.add(FORBIDDEN_ELEMENTS[node.name])
                  }

                  for (const [attribute, value] of Object.entries(node.attributes)) {
                    if (/^on/i.test(attribute)) {
                      problems.add(`has the event handler "${attribute}"`)
                    }

                    if (attribute === 'fill' || attribute === 'stroke') {
                      paint(value)
                    }

                    if (attribute === 'stroke' && !NO_PAINT.has(value.trim().toLowerCase())) {
                      problems.add('has a stroke: a font draws filled shapes only, so outline it')
                    }

                    if (attribute === 'style') {
                      for (const [, property, color] of value.matchAll(
                        /(?:^|;)\s*(fill|stroke)\s*:\s*([^;]+)/g
                      )) {
                        paint(color)

                        if (property === 'stroke' && !NO_PAINT.has(color.trim().toLowerCase())) {
                          problems.add(
                            'has a stroke: a font draws filled shapes only, so outline it'
                          )
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    })
  } catch (error) {
    return [`is not an SVG file that SVGO reads: ${error.message.split('\n')[0]}`]
  }

  if (!root) {
    problems.add('has no <svg> root')
  }

  if (colors.size > 1) {
    problems.add(`has ${colors.size} colors (${[...colors].join(', ')}): an icon has one`)
  }

  return [...problems]
}

/**
 * @param {Record<string, string>} attributes - The attributes of the root
 * @param {number} frame
 * @param {Set<string>} problems
 */
function checkFrame(attributes, frame, problems) {
  const viewBox = attributes.viewBox
    ?.trim()
    .split(/[\s,]+/)
    .map(Number)

  if (!viewBox) {
    problems.add(`has no viewBox: it has to be "0 0 ${frame} ${frame}"`)
  } else if (viewBox.join(' ') !== `0 0 ${frame} ${frame}`) {
    problems.add(`has the viewBox "${attributes.viewBox}": it has to be "0 0 ${frame} ${frame}"`)
  }

  for (const side of ['width', 'height']) {
    const value = attributes[side]

    if (value !== undefined && Number(value.replace(/px$/, '')) !== frame) {
      problems.add(`has the ${side} "${value}": it has to be ${frame}`)
    }
  }
}

/**
 * The icons that come in one style of a pair and not in the others.
 * @param {string[]} names - The names of the icons of the set
 * @param {import('./config.js').Config} config
 * @returns {Problem[]}
 */
export function lintPairs(names, config) {
  const present = new Set(names)
  const problems = []

  for (const name of names) {
    const parsed = parseName(name, config.styles)

    if ('error' in parsed) continue

    for (const pair of config.pairs) {
      if (!pair.includes(parsed.style)) continue

      for (const style of pair) {
        if (!present.has(`${parsed.base}-${style}`)) {
          problems.push({
            file: `${name}.svg`,
            message: `has no "${parsed.base}-${style}" beside it: ${pair.join(' and ')} come together`
          })
        }
      }
    }
  }

  return problems
}

/**
 * Checks every file of the source folder.
 * @param {import('./config.js').Config} config
 * @returns {{ icons: number, problems: Problem[] }}
 */
export function lintSource(config) {
  /** @type {Problem[]} */
  const problems = []

  if (!fs.existsSync(config.sourceDir)) {
    return { icons: 0, problems: [{ file: config.sourceDir, message: 'does not exist' }] }
  }

  for (const file of fs.readdirSync(config.sourceDir).sort()) {
    if (file.startsWith('.')) continue

    if (path.extname(file) !== '.svg') {
      problems.push({ file, message: 'is not an SVG file: the source folder holds icons only' })
    }
  }

  const names = listIcons(config.sourceDir)

  for (const name of names) {
    const file = `${name}.svg`
    const parsed = parseName(name, config.styles)

    if ('error' in parsed) {
      problems.push({ file, message: parsed.error })
    }

    const svg = fs.readFileSync(path.join(config.sourceDir, file), 'utf8')

    for (const message of lintSvg(svg, config.frame)) {
      problems.push({ file, message })
    }
  }

  problems.push(...lintPairs(names, config))

  return { icons: names.length, problems }
}
