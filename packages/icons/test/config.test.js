import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig, resolveConfig } from '../build/config.js'
import { fixtureDir, temporaryDir } from './helpers.js'

const manifest = (build) => ({ name: '@acme/glyphs', version: '1.2.3', chassis: { build } })
const minimal = { name: 'acme-glyphs', prefix: 'ag' }

describe('resolveConfig', () => {
  it('fills in what the block leaves out', () => {
    const config = resolveConfig(manifest(minimal), '/set')

    expect(config).toMatchObject({
      name: 'acme-glyphs',
      prefix: 'ag',
      frame: 24,
      styles: [],
      pairs: [],
      startCodepoint: 0xf101,
      formats: ['woff2', 'woff'],
      header: [],
      packageName: '@acme/glyphs',
      version: '1.2.3'
    })
  })

  it('resolves the folders from the package', () => {
    const config = resolveConfig(manifest({ ...minimal, source: 'art' }), path.resolve('/set'))

    expect(config.sourceDir).toBe(path.resolve('/set/art'))
    expect(config.svgsDir).toBe(path.resolve('/set/svgs'))
    expect(config.iconsDir).toBe(path.resolve('/set/icons'))
    expect(config.registryFile).toBe(path.resolve('/set/codepoints.json'))
  })

  it('writes the version of the package into the header', () => {
    const config = resolveConfig(
      manifest({ ...minimal, header: ['Acme v{version}', 'MIT'] }),
      '/set'
    )

    expect(config.header).toEqual(['Acme v1.2.3', 'MIT'])
  })

  it.each([
    ['no block', undefined, 'no "chassis.build" block'],
    ['an unknown setting', { ...minimal, iconPrefix: 'x' }, 'Unknown setting'],
    ['no name', { prefix: 'ag' }, '"name"'],
    ['a name that is not in kebab-case', { ...minimal, name: 'Acme Glyphs' }, '"name"'],
    ['a prefix with a dot', { ...minimal, prefix: '.ag' }, '"prefix"'],
    ['a frame of zero', { ...minimal, frame: 0 }, '"frame"'],
    ['a frame that is not a whole number', { ...minimal, frame: 16.5 }, '"frame"'],
    ['styles that are not a list', { ...minimal, styles: 'solid' }, '"styles"'],
    ['a style twice', { ...minimal, styles: ['solid', 'solid'] }, '"styles"'],
    ['a pair of one', { ...minimal, styles: ['solid'], pairs: [['solid']] }, '"pairs"'],
    [
      'a pair of a style that is not listed',
      { ...minimal, styles: ['a'], pairs: [['a', 'b']] },
      'b'
    ],
    [
      'a first code point outside the Private Use Area',
      { ...minimal, startCodepoint: '0041' },
      '"startCodepoint"'
    ],
    [
      'a first code point that is a number',
      { ...minimal, startCodepoint: 61697 },
      '"startCodepoint"'
    ],
    ['a font format the build does not write', { ...minimal, formats: ['eot'] }, '"formats"'],
    ['no font format', { ...minimal, formats: [] }, '"formats"'],
    ['a header that closes its comment', { ...minimal, header: ['*/ body{}'] }, '"header"']
  ])('refuses %s', (_case, build, message) => {
    expect(() => resolveConfig(manifest(build), '/set')).toThrow(ConfigError)
    expect(() => resolveConfig(manifest(build), '/set')).toThrow(message)
  })
})

describe('loadConfig', () => {
  it('reads the block of the package.json of a package', () => {
    expect(loadConfig(fixtureDir)).toMatchObject({ name: 'acme-glyphs', prefix: 'ag', frame: 16 })
  })

  it('refuses a folder without a package.json', () => {
    expect(() => loadConfig(temporaryDir())).toThrow(ConfigError)
  })
})
