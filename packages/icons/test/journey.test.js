import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { main } from '../lib/cli.js'
import { listIcons } from '../lib/names.js'
import {
  fixtureDir,
  goldenDir,
  listFiles,
  readOutput,
  recordingConsole,
  temporaryDir
} from './helpers.js'

describe('the journey of a team that makes a repository of icons', () => {
  it('writes the repository with init, saves its SVG files, and builds a set that is its own', async () => {
    const dir = path.join(temporaryDir(), 'glyphs')
    const out = recordingConsole()
    const run = (/** @type {string[]} */ args) => main(args, { cwd: dir, console: out })

    // The team writes the repository,
    expect(
      await main(
        [
          'init',
          dir,
          '--name',
          '@acme/glyphs',
          '--font',
          'acme-glyphs',
          '--prefix',
          'ag',
          '--pm',
          'pnpm',
          '--repository',
          'https://git.acme.example/design/glyphs.git',
          '--license',
          'UNLICENSED',
          '--author',
          'Acme Works'
        ],
        { console: out }
      )
    ).toBe(0)

    // describes its set in the configuration, as the fixture does,
    const manifestFile = path.join(dir, 'package.json')
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
    const team = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'package.json'), 'utf8'))

    expect(manifest.chassis.build).toMatchObject({ name: 'acme-glyphs', prefix: 'ag' })
    expect(manifest.scripts.build).toBe('chassis-icons build')
    expect(Object.keys(manifest.devDependencies)).toEqual(['@chassis-ui/icons'])

    for (const key of ['version', 'description', 'homepage', 'private']) {
      manifest[key] = team[key]
    }

    manifest.chassis.build = { ...team.chassis.build, source: undefined, checks: undefined }
    fs.writeFileSync(manifestFile, JSON.stringify(manifest))

    // gives the changelog the entry of that version,
    const changelogFile = path.join(dir, 'CHANGELOG.md')

    fs.writeFileSync(
      changelogFile,
      fs.readFileSync(changelogFile, 'utf8').replace('## [0.1.0]', `## [${team.version}]`)
    )
    // and the lockfile of its install
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '')

    // saves its SVG files into source/, with nothing else in the folder,
    fs.cpSync(path.join(fixtureDir, 'source'), path.join(dir, 'source'), { recursive: true })

    // and builds
    expect(await run(['lint-source'])).toBe(0)
    expect(await run(['build'])).toBe(0)
    expect(await run(['verify'])).toBe(0)
    expect(await run(['preview'])).toBe(0)
    expect(await run(['archive'])).toBe(0)
    expect(await run(['release-notes'])).toBe(0)
    expect(out.lines.error).toEqual([])

    const teamNames = listIcons(path.join(fixtureDir, 'source'))

    // The output is the team's set, as the golden output has it, and nothing but it
    expect(
      listFiles(dir).filter((file) => !file.startsWith('.github/') && !file.startsWith('preview/'))
    ).toEqual(
      [
        'AGENTS.md',
        'CHANGELOG.md',
        'CLAUDE.md',
        'README.md',
        'archives/acme-glyphs-web-2.4.0.zip',
        'codepoints.json',
        'dist/icons.json',
        ...['css', 'json', 'min.css', 'scss', 'svg', 'ttf', 'woff2'].map(
          (extension) => `dist/web/acme-glyphs.${extension}`
        ),
        ...teamNames.map((name) => `dist/svgs/${name}.svg`),
        'package.json',
        'pnpm-lock.yaml',
        ...teamNames.map((name) => `source/${name}.svg`)
      ].sort()
    )
    // The page of the set, which Git leaves out with the archives
    expect(listFiles(path.join(dir, 'preview'))).toContain('index.html')
    expect(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8')).toMatch(
      /^preview\/$[^]*^archives\/$/m
    )

    const built = readOutput(dir)
    const golden = readOutput(goldenDir)

    for (const file of Object.keys(golden).filter((file) => file !== 'README.md')) {
      expect(built[file].equals(golden[file]), `${file} is not its golden file`).toBe(true)
    }

    // The README names the commands of the repository, and its manifest the files of the font
    const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8')

    expect(readme).toContain('`pnpm build` writes the output again')
    expect(readme).toContain('`pnpm preview` writes the page of the set into `preview/`')
    expect(JSON.parse(fs.readFileSync(manifestFile, 'utf8'))).toMatchObject({
      main: 'dist/web/acme-glyphs.css',
      files: ['dist', 'CHANGELOG.md']
    })

    // The repository is what this version of init writes
    expect(await main(['init', dir, '--check'], { console: out })).toBe(0)
  }, 60_000)
})
