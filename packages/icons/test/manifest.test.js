import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { build } from '../lib/build.js'
import { loadConfig, resolveConfig } from '../lib/config.js'
import { silentLogger as logger } from '../lib/logger.js'
import {
  applyManifestFields,
  manifestFields,
  renderManifest,
  renderReadme,
  repositoryUrl
} from '../lib/manifest.js'
import { listIcons } from '../lib/names.js'
import { writePreview } from '../lib/preview.js'
import { copyFixture, fixtureDir, listFiles, packageDir, temporaryDir } from './helpers.js'

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
    'dist/icons.json',
    ...['css', 'json', 'min.css', 'scss', 'svg', ...config.formats].map(
      (extension) => `dist/web/${config.name}.${extension}`
    ),
    ...listIcons(config.sourceDir).map((name) => `dist/svgs/${name}.svg`)
  ].sort()
}

describe('the fields of package.json', () => {
  const config = loadConfig(fixtureDir)

  it('point at the files of the font name', () => {
    expect(manifestFields(config)).toEqual({
      main: 'dist/web/acme-glyphs.css',
      style: 'dist/web/acme-glyphs.css',
      sass: 'dist/web/acme-glyphs.scss',
      files: ['dist'],
      exports: {
        '.': {
          sass: './dist/web/acme-glyphs.scss',
          style: './dist/web/acme-glyphs.css',
          default: './dist/web/acme-glyphs.css'
        },
        './dist/*': './dist/*',
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

  it('keep their place, and replace what another font name or the layout before dist/ left', () => {
    const applied = applyManifestFields(
      {
        main: 'icons/old-name.css',
        name: '@acme/glyphs',
        files: [
          'icons/old-name.*',
          'svgs/*.svg',
          '!svgs/draft-*.svg',
          'dist/web/old-name.*',
          'CHANGELOG.md'
        ],
        exports: {
          '.': './icons/old-name.css',
          './icons/*': './icons/*',
          './svgs/*': './svgs/*',
          './dist/web/old-name.css': './dist/web/old-name.css',
          './names': './names.js'
        }
      },
      config
    )

    expect(Object.keys(applied).slice(0, 4)).toEqual(['main', 'name', 'files', 'exports'])
    expect(applied.main).toBe('dist/web/acme-glyphs.css')
    // What a team added for a file of its own stays
    expect(applied.files).toEqual(['dist', 'CHANGELOG.md'])
    expect(Object.keys(applied.exports)).toEqual(['.', './dist/*', './package.json', './names'])
  })

  it('leave the text of a manifest that has them as it is', () => {
    const text = JSON.stringify(applyManifestFields(read(fixtureDir), config), null, '\t')

    expect(renderManifest(text, config)).toBe(text)
    expect(renderManifest('{"name":"@acme/glyphs"}', config)).toMatch(
      /^\{\n {2}"name": "@acme\/glyphs",\n {2}"main": "dist\/web\/acme-glyphs\.css",[^]*\n\}\n$/
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

    expect(read(dir).exports['.'].default).toBe('./dist/web/acme-marks.css')
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
      '`dist/web/acme-glyphs.woff2`, `dist/web/acme-glyphs.ttf`: the icon font',
      '`dist/icons.json`: the index of the set',
      '`<name>-line` or `<name>-fill`',
      '<i class="ag-bar-fill"></i>',
      'dist/web/acme-glyphs.svg#bar-fill',
      'dist/svgs/bar-fill.svg',
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
    expect(readme).toContain('built from the SVG files of `source/` with')
    expect(readme).not.toContain('[repository]')
    expect(readme).not.toContain('`npm run build` writes')
    expect(readme).not.toContain('preview')
    expect(readme.endsWith('never in the files of `dist/`.\n')).toBe(true)
    expect(readme).not.toMatch(/\n{3}/)
  })
})

describe('the package', () => {
  it('of a team holds its output, its manifest and its README, and nothing else', async () => {
    const dir = copyFixture()

    await build(loadConfig(dir), { logger })
    await writePreview(loadConfig(dir))

    // Not the source, the registry, the checks file or the page of the set
    expect(packedFiles(dir)).toEqual([...expectedOutput(dir), 'README.md', 'package.json'].sort())
    expect(expectedOutput(dir)).toContain('dist/web/acme-glyphs.ttf')
  }, 30_000)

  it('of the build holds the command, its templates and its documents, and nothing else', () => {
    const documents = fs
      .readdirSync(packageDir)
      .filter((file) => /^(?:package\.json|readme|changelog|licen[cs]e)(?:\.|$)/i.test(file))
    const folder = (/** @type {string} */ name) =>
      listFiles(path.join(packageDir, name)).map((file) => `${name}/${file}`)

    expect(packedFiles(packageDir)).toEqual(
      [...folder('lib'), ...folder('templates'), ...documents].sort()
    )
    expect(packedFiles(packageDir)).toContain('lib/cli.js')
    expect(packedFiles(packageDir)).toContain('templates/workflows/release.yml')
  }, 30_000)

  it('resolves its stylesheet, its files and its manifest by name, and nothing else', async () => {
    const dir = copyFixture()
    const project = temporaryDir()

    await build(loadConfig(dir), { logger })
    fs.mkdirSync(path.join(project, 'node_modules/@acme'), { recursive: true })
    fs.symlinkSync(dir, path.join(project, 'node_modules/@acme/glyphs'), 'dir')

    const { resolve } = createRequire(path.join(project, 'index.js'))
    const file = (/** @type {string} */ name) => fs.realpathSync(path.join(dir, name))

    expect(resolve('@acme/glyphs')).toBe(file('dist/web/acme-glyphs.css'))
    expect(resolve('@acme/glyphs/dist/web/acme-glyphs.min.css')).toBe(
      file('dist/web/acme-glyphs.min.css')
    )
    expect(resolve('@acme/glyphs/dist/web/acme-glyphs.woff2')).toBe(
      file('dist/web/acme-glyphs.woff2')
    )
    expect(resolve('@acme/glyphs/dist/svgs/bar-fill.svg')).toBe(file('dist/svgs/bar-fill.svg'))
    expect(resolve('@acme/glyphs/dist/icons.json')).toBe(file('dist/icons.json'))
    expect(resolve('@acme/glyphs/package.json')).toBe(file('package.json'))
    expect(() => resolve('@acme/glyphs/codepoints.json')).toThrow('is not defined by "exports"')
  })
})
