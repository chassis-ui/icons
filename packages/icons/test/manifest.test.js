import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { build } from '../build/build.js'
import { loadConfig, resolveConfig } from '../build/config.js'
import { silentLogger as logger } from '../build/logger.js'
import {
  applyManifestFields,
  manifestFields,
  renderManifest,
  renderReadme,
  repositoryUrl
} from '../build/manifest.js'
import { listIcons } from '../build/names.js'
import { copyFixture, fixtureDir, packageDir, temporaryDir } from './helpers.js'

const read = (/** @type {string} */ dir) =>
  JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))

/**
 * @param {string} dir - The folder of a package
 * @returns {string[]} The files that npm would publish, sorted
 */
function packedFiles(dir) {
  const [{ files }] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
  )

  return files.map((/** @type {{ path: string }} */ file) => file.path).sort()
}

/**
 * @param {string} dir - The folder of a package
 * @returns {string[]} The output that the configuration of the package asks for, sorted
 */
function expectedOutput(dir) {
  const config = loadConfig(dir)

  return [
    ...['css', 'json', 'min.css', 'scss', 'svg', ...config.formats].map(
      (extension) => `icons/${config.name}.${extension}`
    ),
    ...listIcons(config.sourceDir).map((name) => `svgs/${name}.svg`)
  ].sort()
}

describe('the fields of package.json', () => {
  const config = loadConfig(fixtureDir)

  it('point at the files of the font name', () => {
    expect(manifestFields(config)).toEqual({
      main: 'icons/acme-glyphs.css',
      style: 'icons/acme-glyphs.css',
      sass: 'icons/acme-glyphs.scss',
      files: ['icons/acme-glyphs.*', 'svgs/*.svg'],
      exports: {
        '.': {
          sass: './icons/acme-glyphs.scss',
          style: './icons/acme-glyphs.css',
          default: './icons/acme-glyphs.css'
        },
        './icons/*': './icons/*',
        './svgs/*': './svgs/*',
        './package.json': './package.json'
      },
      sideEffects: ['*.css', '*.scss']
    })
  })

  it('go before the configuration when the manifest does not have them', () => {
    const applied = applyManifestFields(read(fixtureDir), config)

    expect(Object.keys(applied).slice(-7)).toEqual([
      'main',
      'style',
      'sass',
      'files',
      'exports',
      'sideEffects',
      'chassis'
    ])
    expect(applied.name).toBe('@acme/glyphs')
  })

  it('keep their place, and replace what another font name left', () => {
    const applied = applyManifestFields(
      {
        main: 'icons/old-name.css',
        name: '@acme/glyphs',
        files: ['icons/old-name.*', 'svgs/*.svg', '!svgs/draft-*.svg', 'CHANGELOG.md'],
        exports: {
          '.': './icons/old-name.css',
          './icons/old-name.css': './icons/old-name.css',
          './names': './names.js'
        }
      },
      config
    )

    expect(Object.keys(applied).slice(0, 4)).toEqual(['main', 'name', 'files', 'exports'])
    expect(applied.main).toBe('icons/acme-glyphs.css')
    // What a team added for a file of its own stays
    expect(applied.files).toEqual(['icons/acme-glyphs.*', 'svgs/*.svg', 'CHANGELOG.md'])
    expect(Object.keys(applied.exports)).toEqual([
      '.',
      './icons/*',
      './svgs/*',
      './package.json',
      './names'
    ])
  })

  it('leave the text of a manifest that has them as it is', () => {
    const text = JSON.stringify(applyManifestFields(read(fixtureDir), config), null, '\t')

    expect(renderManifest(text, config)).toBe(text)
    expect(renderManifest('{"name":"@acme/glyphs"}', config)).toMatch(
      /^\{\n {2}"name": "@acme\/glyphs",\n {2}"main": "icons\/acme-glyphs\.css",[^]*\n\}\n$/
    )
  })

  it('are written by the build, and by nothing else of it', async () => {
    const dir = copyFixture()
    const before = read(dir)

    await build(loadConfig(dir), { only: 'svgs', logger })
    expect(read(dir)).toEqual(before)

    await build(loadConfig(dir), { logger })
    expect(read(dir)).toEqual(applyManifestFields(before, config))

    const written = fs.statSync(path.join(dir, 'package.json')).mtimeMs

    await build(loadConfig(dir), { logger })
    expect(fs.statSync(path.join(dir, 'package.json')).mtimeMs).toBe(written)
  })

  it('follow the font name', async () => {
    const dir = copyFixture()
    const manifest = read(dir)

    await build(loadConfig(dir), { logger })

    manifest.chassis.build.name = 'acme-marks'
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest))
    await build(loadConfig(dir), { logger })

    expect(read(dir).exports['.'].default).toBe('./icons/acme-marks.css')
    expect(fs.readFileSync(path.join(dir, 'README.md'), 'utf8')).not.toContain('acme-glyphs')
    expect(packedFiles(dir).filter((file) => file.includes('acme-glyphs'))).toEqual([])
  }, 30_000)
})

describe('the address of the repository', () => {
  it.each([
    ['git+https://git.acme.example/design/glyphs.git', 'https://git.acme.example/design/glyphs'],
    [
      { type: 'git', url: 'https://git.acme.example/glyphs.git' },
      'https://git.acme.example/glyphs'
    ],
    ['git@git.acme.example:design/glyphs.git', null],
    [{ type: 'git' }, null],
    [undefined, null]
  ])('of %j is %j', (repository, url) => {
    expect(repositoryUrl(repository)).toBe(url)
  })
})

describe('the README of the package', () => {
  it('shows the package, the font, the prefix and an icon of the set', () => {
    const readme = renderReadme(loadConfig(fixtureDir), read(fixtureDir), ['bar-fill', 'bar-line'])

    for (const text of [
      '# @acme/glyphs\n',
      'The set has 2 icons. Each is drawn on a frame of 16 by 16',
      '`icons/acme-glyphs.woff2`, `icons/acme-glyphs.ttf`: the icon font',
      '`<name>-line` or `<name>-fill`',
      '<i class="ag-bar-fill"></i>',
      'icons/acme-glyphs.svg#bar-fill',
      "$acme-glyphs-font-dir: '/fonts'",
      '[site of the set](https://glyphs.acme.example/)',
      '[repository](https://git.acme.example/design/glyphs)'
    ]) {
      expect(readme).toContain(text)
    }
  })

  it('leaves out what the manifest does not say', () => {
    const manifest = {
      name: 'marks',
      chassis: { build: { name: 'marks', prefix: 'mk', formats: ['woff2'] } }
    }
    const readme = renderReadme(resolveConfig(manifest, fixtureDir), manifest, ['dot'])

    expect(readme).toContain('# marks\n\nThe set has 1 icon. It is drawn on a frame of 24 by 24')
    expect(readme).toContain('\n\nThe examples below show `dot`.\n\n## Use\n')
    expect(readme).not.toContain('style of the icon')
    expect(readme).not.toContain('## The source')
    expect(readme.endsWith("`@use 'pkg:marks'` loads the same file.\n")).toBe(true)
    expect(readme).not.toMatch(/\n{3}/)
  })
})

describe('the package', () => {
  it('of a team holds its output, its manifest and its README, and nothing else', async () => {
    const dir = copyFixture()

    await build(loadConfig(dir), { logger })

    // Not the source, the registry, the checks file or the preview page
    expect(packedFiles(dir)).toEqual([...expectedOutput(dir), 'README.md', 'package.json'].sort())
    expect(expectedOutput(dir)).toContain('icons/acme-glyphs.ttf')
  }, 30_000)

  it('of the repository holds the output of its own set', () => {
    const always = fs
      .readdirSync(packageDir)
      .filter((file) => /^(?:package\.json|readme|licen[cs]e)(?:\.|$)/i.test(file))

    expect(packedFiles(packageDir)).toEqual([...expectedOutput(packageDir), ...always].sort())
  }, 30_000)

  it('resolves its stylesheet, its files and its manifest by name, and nothing else', async () => {
    const dir = copyFixture()
    const project = temporaryDir()

    await build(loadConfig(dir), { logger })
    fs.mkdirSync(path.join(project, 'node_modules/@acme'), { recursive: true })
    fs.symlinkSync(dir, path.join(project, 'node_modules/@acme/glyphs'), 'dir')

    const { resolve } = createRequire(path.join(project, 'index.js'))
    const file = (/** @type {string} */ name) => fs.realpathSync(path.join(dir, name))

    expect(resolve('@acme/glyphs')).toBe(file('icons/acme-glyphs.css'))
    expect(resolve('@acme/glyphs/icons/acme-glyphs.min.css')).toBe(
      file('icons/acme-glyphs.min.css')
    )
    expect(resolve('@acme/glyphs/icons/acme-glyphs.woff2')).toBe(file('icons/acme-glyphs.woff2'))
    expect(resolve('@acme/glyphs/svgs/bar-fill.svg')).toBe(file('svgs/bar-fill.svg'))
    expect(resolve('@acme/glyphs/package.json')).toBe(file('package.json'))
    expect(() => resolve('@acme/glyphs/codepoints.json')).toThrow('is not defined by "exports"')
  })
})
