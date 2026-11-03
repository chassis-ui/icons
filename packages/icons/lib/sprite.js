/**
 * @file The second step of the build: the SVG sprite, one `<symbol>` per file of `svgs/` with
 * the name of the icon as its id.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import SVGSpriter from 'svg-sprite'
import { listIcons } from './names.js'
import { spriteConfig } from './optimize.js'

/**
 * Builds the sprite of the files of `svgsDir`.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} options.svgsDir - The optimized SVG files
 * @returns {Promise<Record<string, Buffer>>} The contents of the file, by file name
 */
export async function renderSprite(config, { svgsDir }) {
  const spriteFile = `${config.name}.svg`
  const spriter = new SVGSpriter({
    mode: {
      symbol: { dest: '.', sprite: spriteFile }
    },
    svg: { namespaceClassnames: false, xmlDeclaration: false },
    shape: { transform: [{ svgo: spriteConfig() }] }
  })

  for (const name of listIcons(svgsDir)) {
    const file = path.join(svgsDir, `${name}.svg`)

    spriter.add(file, `${name}.svg`, await fs.readFile(file, 'utf8'))
  }

  const { result } = await spriter.compileAsync()

  return { [spriteFile]: result.symbol.sprite.contents }
}
