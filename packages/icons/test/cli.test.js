import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { main } from '../lib/cli.js'
import {
  copyFixture,
  goldenDir,
  packageDir,
  readOutput,
  recordingConsole,
  temporaryDir
} from './helpers.js'

/**
 * @param {string[]} args
 * @param {string} [dir] - The folder of the package
 */
async function run(args, dir = copyFixture()) {
  const out = recordingConsole()
  const code = await main(args, { cwd: dir, console: out })

  return { code, dir, log: out.lines.log.join('\n'), error: out.lines.error.join('\n') }
}

describe('the command line', () => {
  it('shows its commands with --help', async () => {
    const { code, log } = await run(['--help'])

    expect(code).toBe(0)

    for (const word of [
      'build',
      'verify',
      'lint-source',
      'archive',
      'release-notes',
      'init',
      '--cwd',
      '--only',
      '--dry-run',
      '--since',
      '--to'
    ]) {
      expect(log).toContain(word)
    }
  })

  it.each([
    [[], 'No command'],
    [['frobnicate'], 'There is no command "frobnicate"'],
    [['build', 'extra'], 'Too many arguments'],
    [['build', '--frobnicate'], "Unknown option '--frobnicate'"],
    [['build', '--dry-run', '--only', 'font'], 'leave out --only']
  ])('answers %j with the exit code 2', async (args, message) => {
    const { code, error } = await run(args)

    expect(code).toBe(2)
    expect(error).toContain(message)
  })

  it('builds the set', async () => {
    const { code, dir, log } = await run(['build'])

    expect(code).toBe(0)
    expect(log).toContain('8 SVG files')
    expect(readOutput(dir)).toEqual(readOutput(goldenDir))
  })

  it('lists what a build would change with --dry-run, and changes nothing', async () => {
    const { code, dir, log } = await run(['build', '--dry-run'])

    expect(code).toBe(0)
    expect(log).toContain('svgs/bar-fill.svg: missing')
    expect(log).toContain('README.md: missing')
    expect(log).toContain('package.json: changed')
    expect(log).toContain('A build would change 19 files')
    expect(fs.readdirSync(dir).sort()).toEqual(['checks.json', 'package.json', 'source'])
  })

  it('fails with the exit code 1 and a message when the build fails', async () => {
    const { code, error } = await run(['build', '--only', 'fonts'])

    expect(code).toBe(1)
    expect(error).toContain('There is no step "fonts"')
  })

  it('fails on a configuration it cannot use', async () => {
    const { code, error } = await run(['build'], temporaryDir())

    expect(code).toBe(1)
    expect(error).toContain('There is no package.json')
  })

  it('verifies the output, and fails when it is not what the source builds', async () => {
    const { dir } = await run(['build'])

    expect((await run(['verify'], dir)).code).toBe(0)

    fs.rmSync(path.join(dir, 'svgs/bar-fill.svg'))

    const { code, error } = await run(['verify'], dir)

    expect(code).toBe(1)
    expect(error).toContain('svgs/bar-fill.svg: missing')
  })

  it('checks the source, and fails on a file that cannot be an icon', async () => {
    const dir = copyFixture()

    expect((await run(['lint-source'], dir)).code).toBe(0)

    fs.renameSync(path.join(dir, 'source/bar-fill.svg'), path.join(dir, 'source/Bar_Filled.svg'))

    const { code, error } = await run(['lint-source'], dir)

    expect(code).toBe(1)
    expect(error).toContain('Bar_Filled.svg is not in kebab-case')
    expect(error).toContain('bar-line.svg has no "bar-fill" beside it')
  })

  it('finds the repository upward from the working directory, or takes --cwd', async () => {
    const dir = copyFixture()
    const inside = path.join(dir, 'source')
    const { code, log } = await run(['build', '--dry-run'], inside)

    expect(code).toBe(0)
    expect(log).toContain('A build would change 19 files')

    const elsewhere = temporaryDir()
    const withCwd = await main(['build', '--dry-run', '--cwd', dir], {
      cwd: elsewhere,
      console: recordingConsole()
    })

    expect(withCwd).toBe(0)
  })

  it('prints the version of the build with --version', async () => {
    const { code, log } = await run(['--version'])

    expect(code).toBe(0)
    expect(log.trim()).toBe(
      JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version
    )
  })

  it('writes the archive of the output with archive', async () => {
    const { dir } = await run(['build'])
    const to = path.join(dir, 'out')
    const { code, log } = await run(['archive', '--to', 'out'], dir)

    expect(code).toBe(0)
    expect(log).toContain('acme-glyphs-2.4.0.zip: 16 files')
    expect(fs.readdirSync(to)).toEqual(['acme-glyphs-2.4.0.zip'])
  })

  it('prints the changelog entry of the version with release-notes, and fails without one', async () => {
    const dir = copyFixture()

    fs.writeFileSync(
      path.join(dir, 'CHANGELOG.md'),
      '# Changelog\n\n## [2.4.0]\n\n### Added\n\n- Two icons\n\n## [2.3.0]\n\n- One icon\n'
    )

    const { code, log } = await run(['release-notes'], dir)

    expect(code).toBe(0)
    expect(log).toBe('### Added\n\n- Two icons')
    expect((await run(['release-notes', 'v2.3.0'], dir)).log).toBe('- One icon')

    const missing = await run(['release-notes', '2.5.0'], dir)

    expect(missing.code).toBe(1)
    expect(missing.error).toContain('no entry for 2.5.0')
  })

  it('writes the files of a new repository with init', async () => {
    const dir = temporaryDir()
    const { code, log } = await run(['init', 'glyphs', '--pm', 'pnpm'], dir)

    expect(code).toBe(0)
    expect(log).toContain('package.json')
    expect(log).toContain('pnpm install')
    expect(fs.readdirSync(path.join(dir, 'glyphs')).sort()).toEqual([
      '.github',
      '.gitignore',
      '.nvmrc',
      'AGENTS.md',
      'CHANGELOG.md',
      'CLAUDE.md',
      'package.json'
    ])
  })
})
