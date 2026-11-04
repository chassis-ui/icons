import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import changelog from '../../../.changeset/changelog.js'
import { checkChangeset, RELEASED_PATHS } from '../../../build/check-changeset.js'
import { readVersion, syncVersionRefs } from '../../../build/sync-version-refs.js'
import { packageDir, temporaryDir } from './helpers.js'

describe('the scripts of the root', () => {
  const repositoryDir = path.resolve(packageDir, '../..')
  const scripts = (/** @type {string} */ dir) =>
    JSON.parse(fs.readFileSync(path.join(repositoryDir, dir, 'package.json'), 'utf8')).scripts

  // `pnpm --filter <package> init` is `pnpm init`, a command of pnpm, and not the script
  // `init` of the package. With `run`, a script is never taken for a command.
  it('run a script of a package by its name, and the package has it', () => {
    const delegated = Object.entries(scripts('.')).flatMap(([name, command]) =>
      [...command.matchAll(/pnpm --filter (\S+) (\S+)(?: (\S+))?/g)].map(
        ([, filter, verb, script]) => ({ name, filter, verb, script })
      )
    )

    expect(delegated.length).toBeGreaterThan(0)

    for (const { name, filter, verb, script } of delegated) {
      expect(filter, name).toMatch(/^\.\/packages\/[a-z-]+$/)
      expect(['run', 'exec'], `${name} has to run a script with "run"`).toContain(verb)

      if (verb === 'run') {
        expect(Object.keys(scripts(filter)), name).toContain(script)
      }
    }
  })

  // The repository builds no set of a team: a script that runs the command of this checkout
  // runs it on the copy of the fixture that `icons:fixture` writes
  it('run the command of this checkout on the fixture, and on no set of a team', () => {
    const commands = Object.entries(scripts('.')).filter(([, command]) =>
      command.includes('packages/icons/')
    )

    expect(scripts('.')['icons:fixture']).toBe('node build/fixture.js')
    expect(commands.map(([name]) => name)).toEqual(
      expect.arrayContaining(['icons:preview', 'icons:native'])
    )

    for (const [name, command] of commands) {
      expect(command, name).not.toContain('vendor/icons')

      if (command.includes('lib/cli.js') || command.includes('check.sh')) {
        expect(command, name).toContain('.cache/fixture')
      }
    }

    expect(fs.existsSync(path.join(repositoryDir, '.gitmodules'))).toBe(false)
  })
})

describe('the changelog entry of a changeset', () => {
  it('is its text as a list item, without a commit hash', () => {
    const summary = '**Breaking.** `bar-fill` is removed.\nUse `ring-fill`.  \n\n- Or another'

    expect(changelog.getReleaseLine({ summary, commit: 'abc1234' })).toBe(
      '- **Breaking.** `bar-fill` is removed.\n  Use `ring-fill`.\n\n  - Or another'
    )
    expect(changelog.getDependencyReleaseLine()).toBe('')
  })
})

describe('checkChangeset', () => {
  const check = (/** @type {[string, string][]} */ changes, versionAfter = '0.4.0') =>
    checkChangeset({
      changes: changes.map(([status, file]) => ({ status, file })),
      released: RELEASED_PATHS,
      versionBefore: '0.4.0',
      versionAfter
    })

  it('knows the folders a release is made of', () => {
    expect(RELEASED_PATHS).toEqual(['packages/icons/lib/', 'packages/icons/templates/'])
  })

  it('asks for nothing when no released file changed', () => {
    const result = check([
      ['M', 'README.md'],
      ['M', 'packages/site/config.yml'],
      ['M', 'packages/icons/test/names.test.js'],
      ['M', 'packages/icons/test/golden/README.md']
    ])

    expect(result).toMatchObject({ ok: true, files: [] })
  })

  it('passes a change to the build that comes with a changeset', () => {
    const result = check([
      ['M', 'packages/icons/lib/font.js'],
      ['M', 'packages/icons/templates/AGENTS.md'],
      ['A', '.changeset/anvil.md']
    ])

    expect(result.ok).toBe(true)
    expect(result.message).toBe('2 released files changed, with 1 changeset')
  })

  it('fails a change to the build or its templates without a changeset', () => {
    for (const file of [
      'packages/icons/lib/templates/css.hbs',
      'packages/icons/lib/cli.js',
      'packages/icons/templates/workflows/release.yml'
    ]) {
      const result = check([['M', file]])

      expect(result, file).toMatchObject({ ok: false, files: [file] })
      expect(result.message).toContain('Run pnpm changeset')
    }
  })

  it('does not take the README of the folder, or a changed changeset, for a new one', () => {
    const changes = /** @type {[string, string][]} */ ([
      ['M', 'packages/icons/lib/build.js'],
      ['A', '.changeset/README.md'],
      ['M', '.changeset/older.md'],
      ['A', '.changeset/config.json'],
      ['A', '.changeset/notes/anvil.md']
    ])

    expect(check(changes).ok).toBe(false)
  })

  it('passes the commit of a version, which consumes the changesets', () => {
    const result = check(
      [
        ['M', 'packages/icons/lib/build.js'],
        ['D', '.changeset/anvil.md']
      ],
      '0.5.0'
    )

    expect(result.ok).toBe(true)
    expect(result.message).toContain('in the release of 0.5.0')
  })
})

describe('syncVersionRefs', () => {
  /**
   * @param {string} version
   * @returns {string} The root of a repository with the files that show the version
   */
  function repository(version) {
    const root = temporaryDir()
    const write = (/** @type {string} */ file, /** @type {string} */ contents) => {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      fs.writeFileSync(path.join(root, file), contents)
    }

    write('packages/icons/package.json', JSON.stringify({ version }))
    write('packages/site/config.yml', 'title: "Acme"\ncurrentVersion:         "0.1.0"\n')
    write(
      'README.md',
      '[![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-blue.svg)](https://example.com)\n'
    )

    return root
  }

  const read = (/** @type {string} */ root, /** @type {string} */ file) =>
    fs.readFileSync(path.join(root, file), 'utf8')

  it('copies the version to the badge and to the site', () => {
    const root = repository('0.4.0-next.0')
    const changed = syncVersionRefs({ root, log: () => {} })

    expect(changed).toEqual(['README.md', 'packages/site/config.yml'])
    expect(read(root, 'packages/site/config.yml')).toContain(
      'currentVersion:         "0.4.0-next.0"'
    )
    expect(read(root, 'README.md')).toBe(
      '[![Version: 0.4.0-next.0](https://img.shields.io/badge/Version-0.4.0--next.0-blue.svg)](https://example.com)\n'
    )
  })

  it('changes no file when the references are in sync', () => {
    const root = repository('0.1.0')

    expect(syncVersionRefs({ root, log: () => {} })).toEqual([])
  })

  it('fails when a file does not show the version where it is expected', () => {
    const root = repository('0.4.0')

    fs.writeFileSync(path.join(root, 'packages/site/config.yml'), 'title: "Acme"\n')

    expect(() => syncVersionRefs({ root, log: () => {} })).toThrow('No version reference')
  })

  it('refuses a version that is not one', () => {
    expect(() => readVersion(repository('next'))).toThrow('Invalid or missing version')
  })
})
