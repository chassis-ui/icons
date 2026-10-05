import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { build } from '../build/build.js'
import { loadConfig } from '../build/config.js'
import { silentLogger as logger } from '../build/logger.js'
import { checkContracts, verify } from '../build/verify.js'
import { copyFixture, goldenDir } from './helpers.js'

const goldenCodepoints = () =>
  JSON.parse(fs.readFileSync(path.join(goldenDir, 'icons/acme-glyphs.json'), 'utf8'))

/** @returns {Promise<{ dir: string, config: import('../build/config.js').Config }>} */
async function builtFixture() {
  const dir = copyFixture()
  const config = loadConfig(dir)

  await build(config, { logger })
  return { dir, config }
}

/**
 * Gives two icons each other's code point, as an edit of the registry by hand would, and
 * builds the output of that registry.
 * @param {string} dir
 * @param {import('../build/config.js').Config} config
 */
async function swapCodepoints(dir, config) {
  const file = path.join(dir, 'codepoints.json')
  const registry = JSON.parse(fs.readFileSync(file, 'utf8'))
  const { 'bar-fill': a, 'bar-line': b } = registry.icons

  Object.assign(registry.icons, { 'bar-fill': b, 'bar-line': a })
  fs.writeFileSync(file, `${JSON.stringify(registry, null, 2)}\n`)
  await build(config, { logger })
}

describe('verify', () => {
  it('passes for an output that the source builds', async () => {
    const { config } = await builtFixture()

    expect(await verify(config, { baseline: goldenCodepoints(), logger })).toEqual({
      icons: 8,
      problems: [],
      notes: []
    })
  })

  it('fails on an output that was not built again after the source changed', async () => {
    const { dir, config } = await builtFixture()
    const file = path.join(dir, 'source/ring-fill.svg')

    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('r="7"', 'r="6"'))
    fs.copyFileSync(path.join(dir, 'source/bar-fill.svg'), path.join(dir, 'source/anvil-fill.svg'))
    fs.copyFileSync(path.join(dir, 'source/bar-line.svg'), path.join(dir, 'source/anvil-line.svg'))

    const { problems } = await verify(config, { logger })

    expect(problems).toContainEqual(expect.stringContaining('svgs/ring-fill.svg: changed'))
    expect(problems).toContainEqual(expect.stringContaining('svgs/anvil-fill.svg: missing'))
    expect(problems).toContainEqual(expect.stringContaining('icons/acme-glyphs.woff2: changed'))
    expect(problems).toContainEqual(expect.stringContaining('codepoints.json: changed'))
    expect(problems.every((problem) => problem.includes('run the build'))).toBe(true)
  })

  it('fails on a file in the output that the build does not write', async () => {
    const { dir, config } = await builtFixture()

    fs.writeFileSync(path.join(dir, 'icons/acme-glyphs.eot'), '')

    expect((await verify(config, { logger })).problems).toEqual([
      expect.stringContaining('icons/acme-glyphs.eot: the build does not write it')
    ])
  })

  it('changes no file of the package', async () => {
    const { dir, config } = await builtFixture()

    fs.rmSync(path.join(dir, 'svgs/bar-fill.svg'))
    fs.rmSync(path.join(dir, 'codepoints.json'))
    await verify(config, { logger })

    expect(fs.existsSync(path.join(dir, 'svgs/bar-fill.svg'))).toBe(false)
    expect(fs.existsSync(path.join(dir, 'codepoints.json'))).toBe(false)
  })

  it('fails on an icon that moved to another code point', async () => {
    const { dir, config } = await builtFixture()

    await swapCodepoints(dir, config)

    expect((await verify(config, { baseline: goldenCodepoints(), logger })).problems).toEqual([
      '"bar-fill" moved from the code point e900 to e901',
      '"bar-line" moved from the code point e901 to e900'
    ])
  })

  it('fails on an icon that moved since the last tag of the repository', async () => {
    const { dir, config } = await builtFixture()
    const git = (/** @type {string[]} */ ...args) =>
      execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
        cwd: dir,
        stdio: 'ignore'
      })

    git('init', '--quiet')
    git('add', '.')
    git('commit', '--quiet', '--no-gpg-sign', '-m', 'A release')
    git('tag', 'v2.4.0')

    expect((await verify(config, { logger })).problems).toEqual([])

    await swapCodepoints(dir, config)

    expect((await verify(config, { logger })).problems).toEqual([
      '"bar-fill" moved from the code point e900 to e901 since v2.4.0',
      '"bar-line" moved from the code point e901 to e900 since v2.4.0'
    ])
    expect((await verify(config, { since: 'HEAD', logger })).problems).toHaveLength(2)
    await expect(verify(config, { since: 'no-such-ref', logger })).rejects.toThrow(
      'Git does not know'
    )
  })

  it('says so when there is no earlier state to compare the code points with', async () => {
    const { config } = await builtFixture()

    expect(await verify(config, { logger })).toMatchObject({
      problems: [],
      notes: [expect.stringContaining('not compared with an earlier state')]
    })
  })

  it('fails on a missing icon that a consumer reads by name', async () => {
    const { dir, config } = await builtFixture()

    fs.rmSync(path.join(dir, 'source/ring-line.svg'))
    fs.rmSync(path.join(dir, 'source/ring-fill.svg'))
    await build(config, { logger })

    expect((await verify(config, { baseline: goldenCodepoints(), logger })).problems).toEqual([
      '"ring-line" is missing, and the toolbar of the Acme app reads it by name'
    ])
  })

  it('passes without a checks file, and says that no icon was checked by name', async () => {
    const { dir, config } = await builtFixture()

    fs.rmSync(path.join(dir, 'checks.json'))

    expect(await verify(config, { baseline: goldenCodepoints(), logger })).toMatchObject({
      problems: [],
      notes: [expect.stringContaining('no checks file')]
    })
  })
})

describe('checkContracts', () => {
  it('passes for a file without contracts', () => {
    expect(checkContracts({}, ['a'])).toEqual([])
    expect(checkContracts({ contracts: [] }, ['a'])).toEqual([])
  })

  it('names the reader of each missing icon', () => {
    const checks = { contracts: [{ reader: 'the header', icons: ['a', 'b'] }, { icons: ['c'] }] }

    expect(checkContracts(checks, ['a'])).toEqual([
      '"b" is missing, and the header reads it by name',
      '"c" is missing, and a consumer reads it by name'
    ])
  })
})
