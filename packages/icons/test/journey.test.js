import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { main } from '../build/cli.js'
import { listIcons } from '../build/names.js'
import { fixtureDir, listFiles, packageDir, recordingConsole, temporaryDir } from './helpers.js'

const repositoryDir = path.resolve(packageDir, '../..')

/**
 * A copy of what a team gets when it clones the repository: the package with the
 * configuration, the output and the registry of the set it ships with, and its source.
 * @returns {string} The folder of the copy
 */
function cloneRepository() {
  const dir = temporaryDir()
  const copy = (/** @type {string} */ file) =>
    fs.cpSync(path.join(repositoryDir, file), path.join(dir, file), { recursive: true })

  for (const file of ['svgs', 'icons', 'codepoints.json', 'package.json']) {
    copy(path.join('packages/icons', file))
  }

  copy(path.relative(repositoryDir, sourceOf(packageDir)))
  return dir
}

/**
 * @param {string} dir - The folder of a package
 * @returns {string} Its source folder
 */
function sourceOf(dir) {
  const { source } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).chassis
    .build

  return path.resolve(dir, source)
}

describe('the journey of a team that adopts the repository', () => {
  it('replaces the source and the configuration, and builds a set that is its own', async () => {
    const dir = cloneRepository()
    const adopted = path.join(dir, 'packages/icons')
    const shippedNames = listIcons(sourceOf(adopted))
    const out = recordingConsole()

    expect(shippedNames.length).toBeGreaterThan(0)

    // The team saves its own SVG files in place of those the repository ships with,
    fs.rmSync(sourceOf(adopted), { recursive: true })
    fs.cpSync(path.join(fixtureDir, 'source'), sourceOf(adopted), { recursive: true })

    // describes its set in the configuration,
    const manifestFile = path.join(adopted, 'package.json')
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
    const team = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'package.json'), 'utf8'))
    const { source } = manifest.chassis.build

    for (const key of ['name', 'version', 'description', 'homepage', 'repository', 'license']) {
      manifest[key] = team[key]
    }

    manifest.chassis.build = { ...team.chassis.build, source, checks: undefined }
    fs.writeFileSync(manifestFile, JSON.stringify(manifest))

    // starts a new set, and builds it
    expect(await main(['init'], { packageDir: adopted, console: out })).toBe(0)
    expect(await main(['lint-source'], { packageDir: adopted, console: out })).toBe(0)
    expect(await main(['build'], { packageDir: adopted, console: out })).toBe(0)
    expect(await main(['verify'], { packageDir: adopted, console: out })).toBe(0)
    expect(out.lines.error).toEqual([])

    const teamNames = listIcons(path.join(fixtureDir, 'source'))
    const files = [
      ...listFiles(path.join(adopted, 'svgs')).map((file) => `svgs/${file}`),
      ...listFiles(path.join(adopted, 'icons')).map((file) => `icons/${file}`),
      'codepoints.json',
      'README.md'
    ].sort()

    // The output is the team's set, and nothing but it
    expect(files).toEqual(
      [
        'README.md',
        'codepoints.json',
        ...['css', 'json', 'min.css', 'scss', 'svg', 'ttf', 'woff2'].map(
          (extension) => `icons/acme-glyphs.${extension}`
        ),
        ...teamNames.map((name) => `svgs/${name}.svg`)
      ].sort()
    )

    const registry = JSON.parse(fs.readFileSync(path.join(adopted, 'codepoints.json'), 'utf8'))

    expect(Object.keys(registry.icons)).toEqual(teamNames)
    expect(Object.values(registry.icons)[0]).toBe('e900')
    expect(registry.retired).toEqual([])

    // Nothing of the set that the repository ships with is left in it: not its font name,
    // not its prefix, not the name of one of its icons
    const shipped = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'))
    const { name: fontName, prefix } = shipped.chassis.build
    // The first part of the font name is the name of the set itself
    const words = [fontName, fontName.split('-')[0], shipped.name, `${prefix}-`]

    // The manifest names the files of the team's font, where it named those of the other
    const built = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
    const fields = JSON.stringify(
      ['main', 'style', 'sass', 'files', 'exports'].map((key) => built[key])
    )

    expect(built.main).toBe('icons/acme-glyphs.css')
    expect(fields).toContain('acme-glyphs')
    expect(fields).not.toContain(fontName)

    for (const file of files) {
      const contents = fs.readFileSync(path.join(adopted, file))
      // A font holds its name in UTF-16, big-endian in a TrueType file
      const even = contents.subarray(0, contents.length - (contents.length % 2))
      const text = [
        contents.toString('utf8'),
        contents.toString('utf16le'),
        Buffer.from(even).swap16().toString('utf16le')
      ].join('\n')

      for (const word of words) {
        expect(text.toLowerCase().includes(word.toLowerCase()), `${file} holds "${word}"`).toBe(
          false
        )
      }

      for (const name of shippedNames) {
        expect(text.includes(name), `${file} holds the icon "${name}"`).toBe(false)
      }
    }
  })
})
