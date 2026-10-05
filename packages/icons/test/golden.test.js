import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { build, compareWithBuild } from '../build/build.js'
import { PREVIEW_FILE, loadConfig } from '../build/config.js'
import { silentLogger as logger } from '../build/logger.js'
import { copyFixture, goldenDir, readOutput } from './helpers.js'

describe('the build of the fixture set', () => {
  it('writes the golden output, byte for byte', async () => {
    const dir = copyFixture()

    await build(loadConfig(dir), { logger })

    const built = readOutput(dir)
    const golden = readOutput(goldenDir)

    expect(Object.keys(built)).toEqual(Object.keys(golden))

    for (const file of Object.keys(golden)) {
      expect(built[file].equals(golden[file]), `${file} is not its golden file`).toBe(true)
    }
  })

  it('writes the same files when it runs again', async () => {
    const dir = copyFixture()
    const config = loadConfig(dir)

    await build(config, { logger })

    const first = readOutput(dir)

    await build(config, { logger })
    expect(readOutput(dir)).toEqual(first)
    expect((await compareWithBuild(config, { logger })).differences).toEqual([])
  })

  it('only reads the source folder', async () => {
    const dir = copyFixture()
    const read = () =>
      Object.fromEntries(
        fs
          .readdirSync(path.join(dir, 'source'))
          .map((file) => [file, fs.readFileSync(path.join(dir, 'source', file), 'utf8')])
      )
    const before = read()

    await build(loadConfig(dir), { logger })
    expect(read()).toEqual(before)
  })

  it('writes a page that shows the sprite', async () => {
    const dir = copyFixture()

    await build(loadConfig(dir), { logger })
    expect(fs.readFileSync(path.join(dir, 'icons', PREVIEW_FILE), 'utf8')).toContain('bar-fill')
  })
})

describe('the steps of the build', () => {
  it('runs one step with `only`', async () => {
    const dir = copyFixture()
    const config = loadConfig(dir)

    await build(config, { only: 'svgs', logger })
    expect(fs.readdirSync(path.join(dir, 'svgs'))).toHaveLength(8)
    expect(fs.existsSync(path.join(dir, 'icons', 'acme-glyphs.svg'))).toBe(false)

    await build(config, { only: 'sprite', logger })
    expect(fs.readdirSync(path.join(dir, 'icons')).sort()).toEqual([
      'acme-glyphs.svg',
      PREVIEW_FILE
    ])

    await build(config, { only: 'font', logger })
    expect(fs.existsSync(path.join(dir, 'README.md'))).toBe(false)

    await build(config, { only: 'package', logger })
    expect(readOutput(dir)).toEqual(readOutput(goldenDir))
  })

  it('refuses a step it does not have', async () => {
    await expect(build(loadConfig(copyFixture()), { only: 'fonts', logger })).rejects.toThrow(
      'There is no step "fonts"'
    )
  })

  it('removes what it did not write from the output', async () => {
    const dir = copyFixture()
    const config = loadConfig(dir)

    await build(config, { logger })
    fs.writeFileSync(path.join(dir, 'icons', 'old-name.woff'), '')
    fs.writeFileSync(path.join(dir, 'svgs', 'gone-fill.svg'), '<svg/>')

    await build(config, { logger })
    expect(readOutput(dir)).toEqual(readOutput(goldenDir))
  })
})

describe('the code points of a set that changes', () => {
  it('keeps every code point when an icon is added, and retires that of a removed icon', async () => {
    const dir = copyFixture()
    const config = loadConfig(dir)
    const registry = () => JSON.parse(fs.readFileSync(path.join(dir, 'codepoints.json'), 'utf8'))

    await build(config, { logger })

    const first = registry()

    fs.copyFileSync(path.join(dir, 'source/bar-fill.svg'), path.join(dir, 'source/anvil-fill.svg'))
    fs.copyFileSync(path.join(dir, 'source/bar-line.svg'), path.join(dir, 'source/anvil-line.svg'))
    fs.rmSync(path.join(dir, 'source/diamond-fill.svg'))
    fs.rmSync(path.join(dir, 'source/diamond-line.svg'))

    const result = await build(config, { logger })
    const second = registry()

    expect(result).toMatchObject({
      icons: 8,
      added: ['anvil-fill', 'anvil-line'],
      removed: ['diamond-fill', 'diamond-line']
    })
    expect(second.retired).toEqual([first.icons['diamond-fill'], first.icons['diamond-line']])
    expect(second.icons).toMatchObject({ 'anvil-fill': 'e908', 'anvil-line': 'e909' })

    for (const [name, codepoint] of Object.entries(second.icons)) {
      if (name in first.icons) expect(codepoint, name).toBe(first.icons[name])
    }

    const css = fs.readFileSync(path.join(dir, 'icons/acme-glyphs.css'), 'utf8')

    expect(css).not.toContain('diamond')
    expect(css).toContain('.ag-anvil-fill::before { content: "\\e908"; }')
    expect(fs.existsSync(path.join(dir, 'svgs/diamond-fill.svg'))).toBe(false)
  })
})
