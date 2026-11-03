import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readReleaseNotes, releaseNotes } from '../lib/release-notes.js'
import { temporaryDir } from './helpers.js'

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

describe('releaseNotes', () => {
  it('returns the entry of a version in the style of Changesets', () => {
    const notes = releaseNotes(changelog, '0.4.0')

    expect(notes?.startsWith('### Minor Changes')).toBe(true)
    expect(notes).toContain('## Not a version')
    expect(notes).not.toContain('0.3.1')
  })

  it('returns the entry of a version in the style of Keep a Changelog', () => {
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

describe('readReleaseNotes', () => {
  /** @returns {string} A repository with the changelog above, at the version 0.4.0 */
  function repository() {
    const dir = temporaryDir()

    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '0.4.0' }))
    fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), changelog)
    return dir
  }

  it('reads the entry of the version of package.json, or of the version given', () => {
    const dir = repository()

    expect(readReleaseNotes(dir).startsWith('### Minor Changes')).toBe(true)
    expect(readReleaseNotes(dir, 'v0.3.1')).toBe('### Added\n\n- Two icons\n')
  })

  it('fails without a changelog, without an entry, and on an empty one', () => {
    const dir = repository()

    expect(() => readReleaseNotes(dir, '0.5.0')).toThrow('no entry for 0.5.0')
    expect(() => readReleaseNotes(dir, '0.3.0')).toThrow('is empty')
    fs.rmSync(path.join(dir, 'CHANGELOG.md'))
    expect(() => readReleaseNotes(dir)).toThrow('has no CHANGELOG.md')
  })
})
