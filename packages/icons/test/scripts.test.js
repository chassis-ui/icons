import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { releaseNotes } from '../../../build/release-notes.js'
import { readVersion, syncVersionRefs } from '../../../build/sync-version-refs.js'
import { temporaryDir } from './helpers.js'

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
