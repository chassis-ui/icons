import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { main } from '../build/cli.js'
import { copyFixture, goldenDir, readOutput, recordingConsole, temporaryDir } from './helpers.js'

/**
 * @param {string[]} args
 * @param {string} [dir] - The folder of the package
 */
async function run(args, dir = copyFixture()) {
  const out = recordingConsole()
  const code = await main(args, { packageDir: dir, console: out })

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
      'init',
      '--only',
      '--dry-run',
      '--since'
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
    expect(log).toContain('A build would change 18 files')
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

  it('empties the output and the registry with init', async () => {
    const { dir } = await run(['build'])
    const { code } = await run(['init'], dir)

    expect(code).toBe(0)
    expect(fs.readdirSync(path.join(dir, 'svgs'))).toEqual([])
    expect(fs.readdirSync(path.join(dir, 'icons'))).toEqual([])
    expect(fs.existsSync(path.join(dir, 'codepoints.json'))).toBe(false)
    expect(fs.readdirSync(path.join(dir, 'source'))).toHaveLength(8)
  })
})
