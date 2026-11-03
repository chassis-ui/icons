import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { writeArchive } from '../lib/archive.js'
import { build } from '../lib/build.js'
import { loadConfig } from '../lib/config.js'
import { silentLogger as logger } from '../lib/logger.js'
import { copyFixture, listFiles, temporaryDir } from './helpers.js'

describe('writeArchive', () => {
  const entries = (/** @type {string} */ file) =>
    execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n').sort()

  it('writes the output of the package into an archive of the font name', async () => {
    const dir = copyFixture()
    const to = path.join(temporaryDir(), 'release')
    const config = loadConfig(dir)

    await build(config, { logger })
    fs.mkdirSync(to)
    fs.writeFileSync(path.join(to, 'acme-glyphs-2.3.0.zip'), '')
    fs.writeFileSync(path.join(to, 'other-1.0.0.zip'), '')

    const { file } = writeArchive(config, { to })

    expect(path.relative(to, file)).toBe('acme-glyphs-2.4.0.zip')
    // The older archive of the font is gone, and nothing else
    expect(fs.readdirSync(to).sort()).toEqual(['acme-glyphs-2.4.0.zip', 'other-1.0.0.zip'])
    // The two folders as the package has them
    expect(entries(file)).toEqual(
      [
        ...listFiles(path.join(dir, 'icons')).map((name) => `icons/${name}`),
        ...listFiles(path.join(dir, 'svgs')).map((name) => `svgs/${name}`)
      ].sort()
    )
    expect(entries(file)).toHaveLength(16)
  })

  it('writes to archives/ of the repository by default', async () => {
    const dir = copyFixture()
    const config = loadConfig(dir)

    await build(config, { logger })

    const { file } = writeArchive(config)

    expect(path.relative(dir, file)).toBe('archives/acme-glyphs-2.4.0.zip')
  })

  it('fails when the output is not built', () => {
    expect(() => writeArchive(loadConfig(copyFixture()), { to: temporaryDir() })).toThrow(
      'Run the build first'
    )
  })
})
