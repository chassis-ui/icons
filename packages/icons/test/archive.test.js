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

  it('writes the output for the web and the page of the set into an archive of the font name', async () => {
    const dir = copyFixture()
    const to = path.join(temporaryDir(), 'release')
    const config = loadConfig(dir)

    await build(config, { logger })
    fs.mkdirSync(to)
    fs.writeFileSync(path.join(to, 'acme-glyphs-2.3.0.zip'), '')
    fs.writeFileSync(path.join(to, 'acme-glyphs-web-2.3.0.zip'), '')
    fs.writeFileSync(path.join(to, 'other-1.0.0.zip'), '')

    const { file } = await writeArchive(config, { to })

    expect(path.relative(to, file)).toBe('acme-glyphs-web-2.4.0.zip')
    // The older archives of the font are gone, and nothing else
    expect(fs.readdirSync(to).sort()).toEqual(['acme-glyphs-web-2.4.0.zip', 'other-1.0.0.zip'])

    const svgs = listFiles(path.join(dir, 'dist/svgs')).map((name) => `svgs/${name}`)
    const web = listFiles(path.join(dir, 'dist/web'))

    // dist/ as the package has it, and the page with the files it draws and links
    expect(entries(file)).toEqual(
      [
        'icons.json',
        ...svgs,
        ...web.map((name) => `web/${name}`),
        ...['index.html', 'preview.css', 'preview.js', ...web, ...svgs].map(
          (name) => `preview/${name}`
        )
      ].sort()
    )
    expect(entries(file)).toHaveLength(34)
    // The page is not left in the repository
    expect(fs.existsSync(path.join(dir, 'preview'))).toBe(false)
  })

  it('writes to archives/ of the repository by default', async () => {
    const dir = copyFixture()
    const config = loadConfig(dir)

    await build(config, { logger })

    const { file } = await writeArchive(config)

    expect(path.relative(dir, file)).toBe('archives/acme-glyphs-web-2.4.0.zip')
  })

  it('fails when the output is not built', async () => {
    await expect(writeArchive(loadConfig(copyFixture()), { to: temporaryDir() })).rejects.toThrow(
      'Run the build first'
    )
  })
})
