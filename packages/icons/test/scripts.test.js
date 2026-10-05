import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import changelog from '../../../.changeset/changelog.js'
import { checkChangeset, releasedPaths } from '../../../build/check-changeset.js'
import { releaseArchive } from '../../../build/release-archives.js'
import { releaseNotes } from '../../../build/release-notes.js'
import { readVersion, syncVersionRefs } from '../../../build/sync-version-refs.js'
import { build } from '../build/build.js'
import { loadConfig } from '../build/config.js'
import { silentLogger as logger } from '../build/logger.js'
import { copyFixture, listFiles, temporaryDir } from './helpers.js'

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
  const released = releasedPaths({ chassis: { build: {} } })
  const check = (/** @type {[string, string][]} */ changes, versionAfter = '0.4.0') =>
    checkChangeset({
      changes: changes.map(([status, file]) => ({ status, file })),
      released,
      versionBefore: '0.4.0',
      versionAfter
    })

  it('knows the folders a release is made of, with the source where the set has it', () => {
    expect(released).toEqual([
      'source/',
      'packages/icons/build/',
      'packages/icons/icons/',
      'packages/icons/svgs/'
    ])
    expect(releasedPaths({ chassis: { build: { source: 'artwork' } } })[0]).toBe(
      'packages/icons/artwork/'
    )
    expect(releasedPaths({})[0]).toBe('source/')
  })

  it('asks for nothing when no released file changed', () => {
    const result = check([
      ['M', 'README.md'],
      ['M', 'packages/site/config.yml'],
      ['M', 'packages/icons/test/names.test.js'],
      ['M', 'sources.md']
    ])

    expect(result).toMatchObject({ ok: true, files: [] })
  })

  it('passes a change to the source or to the build that comes with a changeset', () => {
    const result = check([
      ['A', 'source/anvil-fill.svg'],
      ['M', 'packages/icons/build/font.js'],
      ['A', '.changeset/anvil.md']
    ])

    expect(result.ok).toBe(true)
    expect(result.message).toBe('2 released files changed, with 1 changeset')
  })

  it('fails a change to the source, the build or the output without a changeset', () => {
    for (const file of [
      'source/anvil-fill.svg',
      'packages/icons/build/templates/css.hbs',
      'packages/icons/icons/acme-glyphs.woff2',
      'packages/icons/svgs/anvil-fill.svg'
    ]) {
      const result = check([['M', file]])

      expect(result, file).toMatchObject({ ok: false, files: [file] })
      expect(result.message).toContain('Run pnpm changeset')
    }
  })

  it('does not take the README of the folder, or a changed changeset, for a new one', () => {
    const changes = /** @type {[string, string][]} */ ([
      ['D', 'source/bar-fill.svg'],
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
        ['M', 'packages/icons/icons/acme-glyphs.css'],
        ['D', '.changeset/anvil.md']
      ],
      '0.5.0'
    )

    expect(result.ok).toBe(true)
    expect(result.message).toContain('in the release of 0.5.0')
  })
})

describe('releaseArchive', () => {
  const entries = (/** @type {string} */ file) =>
    execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n').sort()

  it('writes the output of the package into an archive of the font name', async () => {
    const dir = copyFixture()
    const to = path.join(temporaryDir(), 'release')

    await build(loadConfig(dir), { logger })
    fs.mkdirSync(to)
    fs.writeFileSync(path.join(to, 'acme-glyphs-2.3.0.zip'), '')
    fs.writeFileSync(path.join(to, 'other-1.0.0.zip'), '')

    const { file } = releaseArchive({ packageDir: dir, to })

    expect(path.relative(to, file)).toBe('acme-glyphs-2.4.0.zip')
    // The older archive of the font is gone, and nothing else
    expect(fs.readdirSync(to).sort()).toEqual(['acme-glyphs-2.4.0.zip', 'other-1.0.0.zip'])
    // The two folders as the package has them, without the preview page
    expect(entries(file)).toEqual(
      [
        ...listFiles(path.join(dir, 'icons')).map((name) => `icons/${name}`),
        ...listFiles(path.join(dir, 'svgs')).map((name) => `svgs/${name}`)
      ].sort()
    )
    expect(entries(file)).toHaveLength(15)
  })

  it('fails when the output is not built', () => {
    expect(() => releaseArchive({ packageDir: copyFixture(), to: temporaryDir() })).toThrow(
      'Run the build first'
    )
  })
})

describe('releaseNotes', () => {
  const changelog = [
    '# @acme/glyphs',
    '',
    '## 0.4.0',
    '',
    '### Minor Changes',
    '',
    '- A change, with a heading in its code:',
    '',
    '  ```md',
    '  ## Not a version',
    '  ```',
    '',
    '## [0.3.1] - 2026-07-04',
    '',
    '### Added',
    '',
    '- Two icons',
    '',
    '## 0.3.0',
    ''
  ].join('\n')

  it('returns the entry of a version in the style of Changesets', () => {
    const notes = releaseNotes(changelog, '0.4.0')

    expect(notes.startsWith('### Minor Changes')).toBe(true)
    expect(notes).toContain('## Not a version')
    expect(notes).not.toContain('0.3.1')
  })

  it('returns the entry of a version in the older style', () => {
    expect(releaseNotes(changelog, '0.3.1')).toBe('### Added\n\n- Two icons')
  })

  it('does not take a version for another that starts with it', () => {
    expect(releaseNotes(changelog, '0.3')).toBeNull()
  })

  it('returns null without an entry, and nothing for an empty one', () => {
    expect(releaseNotes(changelog, '9.9.9')).toBeNull()
    expect(releaseNotes(changelog, '0.3.0')).toBe('')
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

  it('copies the version to the badge and to the site, then builds', () => {
    const root = repository('0.4.0-next.0')
    let builds = 0
    const changed = syncVersionRefs({ root, build: () => builds++, log: () => {} })

    expect(changed).toEqual(['README.md', 'packages/site/config.yml'])
    expect(builds).toBe(1)
    expect(read(root, 'packages/site/config.yml')).toContain(
      'currentVersion:         "0.4.0-next.0"'
    )
    expect(read(root, 'README.md')).toBe(
      '[![Version: 0.4.0-next.0](https://img.shields.io/badge/Version-0.4.0--next.0-blue.svg)](https://example.com)\n'
    )
  })

  it('changes no file when the references are in sync', () => {
    const root = repository('0.1.0')

    expect(syncVersionRefs({ root, build: () => {}, log: () => {} })).toEqual([])
  })

  it('fails when a file does not show the version where it is expected', () => {
    const root = repository('0.4.0')

    fs.writeFileSync(path.join(root, 'packages/site/config.yml'), 'title: "Acme"\n')

    expect(() => syncVersionRefs({ root, build: () => {}, log: () => {} })).toThrow(
      'No version reference'
    )
  })

  it('refuses a version that is not one', () => {
    expect(() => readVersion(repository('next'))).toThrow('Invalid or missing version')
  })
})
