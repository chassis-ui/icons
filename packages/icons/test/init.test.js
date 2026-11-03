import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  alignTables,
  checkFiles,
  init,
  kebabCase,
  parseInitArgs,
  planFiles,
  repositoryUrl
} from '../lib/init.js'
import { buildVersion } from '../lib/root.js'
import { temporaryDir } from './helpers.js'

const FILES = [
  '.github/workflows/ci.yml',
  '.github/workflows/release.yml',
  '.gitignore',
  '.nvmrc',
  'AGENTS.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'package.json'
]

describe('planFiles', () => {
  it('plans the files of a repository, from the name of the folder', () => {
    const plan = planFiles({ dir: '/work/acme-glyphs' })
    const manifest = JSON.parse(/** @type {string} */ (plan.get('package.json')))

    expect([...plan.keys()].sort()).toEqual(FILES)
    expect(manifest).toMatchObject({
      name: 'acme-glyphs',
      version: '0.1.0',
      license: 'MIT',
      files: ['CHANGELOG.md'],
      chassis: {
        build: {
          name: 'acme-glyphs',
          prefix: 'ag',
          frame: 24,
          formats: ['woff2', 'woff'],
          header: ['Acme Glyphs v{version}', 'Licensed under MIT']
        }
      },
      devDependencies: { '@chassis-ui/icons': `^${buildVersion()}` }
    })
    expect(manifest.repository).toBeUndefined()
    expect(Object.keys(manifest.scripts)).toEqual([
      'build',
      'lint',
      'verify',
      'preview',
      'archive',
      'release-notes'
    ])
    expect(manifest.scripts.preview).toBe('chassis-icons preview --serve')
    expect(plan.get('.nvmrc')).toBe('24\n')
    expect(plan.get('CLAUDE.md')).toBe('@AGENTS.md\n')
  })

  it('takes the names, the package manager, the repository, the license and the author', () => {
    const plan = planFiles({
      dir: '/work/glyphs',
      name: '@acme/glyphs',
      font: 'acme-glyphs',
      prefix: 'ag',
      pm: 'pnpm',
      repository: 'acme/glyphs',
      license: 'UNLICENSED',
      author: 'Acme Works <design@acme.example>'
    })
    const manifest = JSON.parse(/** @type {string} */ (plan.get('package.json')))
    const agents = /** @type {string} */ (plan.get('AGENTS.md'))
    const ci = /** @type {string} */ (plan.get('.github/workflows/ci.yml'))

    expect(manifest).toMatchObject({
      name: '@acme/glyphs',
      repository: { type: 'git', url: 'git+https://github.com/acme/glyphs.git' },
      license: 'UNLICENSED',
      author: 'Acme Works <design@acme.example>'
    })
    expect(manifest.chassis.build.header).toEqual([
      'Acme Glyphs v{version}',
      'Copyright Acme Works',
      'Licensed under UNLICENSED'
    ])
    expect(agents).toContain('@acme/glyphs holds an icon set')
    expect(agents).toContain('`pnpm build`')
    expect(agents).toContain('the class prefix `ag-`')
    expect(agents).not.toContain('__')
    expect(ci).toContain('uses: pnpm/action-setup@')
    expect(ci).toContain('cache: pnpm')
    expect(ci).toContain('run: pnpm install --frozen-lockfile')
    expect(ci).not.toContain('__')
  })

  it('names npm by default, without a pnpm setup step', () => {
    const plan = planFiles({ dir: '/work/glyphs' })
    const release = /** @type {string} */ (plan.get('.github/workflows/release.yml'))

    expect(release).not.toContain('pnpm')
    expect(release).toContain('run: npm ci')
    expect(release).toContain('run: npm run verify')
    expect(plan.get('AGENTS.md')).toContain('`npm run build`')
  })

  it.each([
    [{ font: 'Acme Glyphs' }, 'name of the font'],
    [{ prefix: '.ag' }, 'prefix'],
    [{ pm: 'yarn' }, 'package manager'],
    [{ repository: 'not a repository' }, 'A repository is owner/name']
  ])('refuses %j', (options, message) => {
    expect(() => planFiles({ dir: '/work/glyphs', ...options })).toThrow(message)
  })
})

describe('init', () => {
  it('writes the files, and nothing over one that exists', () => {
    const dir = temporaryDir()
    const { files, written } = init({ dir, pm: 'pnpm' })

    expect(written).toBe(true)
    expect(files.sort()).toEqual(FILES)
    expect(fs.existsSync(path.join(dir, '.github/workflows/release.yml'))).toBe(true)
    expect(() => init({ dir })).toThrow('Files to write exist')
  })

  it('reads the name, the names of the set and the package manager from the repository', () => {
    const dir = temporaryDir()

    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: '@acme/glyphs', chassis: { build: { name: 'marks', prefix: 'mk' } } })
    )
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '')

    const { files, keptData } = init({ dir, force: true })

    expect(keptData).toEqual(['package.json'])
    expect(files).not.toContain('package.json')
    expect(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8')).toContain(
      '@acme/glyphs holds an icon set'
    )
    expect(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8')).toContain('`mk-`')
    expect(fs.readFileSync(path.join(dir, '.github/workflows/ci.yml'), 'utf8')).toContain(
      'cache: pnpm'
    )
  })

  it('reads the author and the repository from Git', () => {
    const dir = temporaryDir()
    const git = (/** @type {string[]} */ ...args) =>
      execFileSync('git', args, { cwd: dir, stdio: 'ignore' })

    git('init', '-q')
    git('config', 'user.name', 'Acme Works')
    git('remote', 'add', 'origin', 'git@github.com:acme/glyphs.git')

    const { manifest } = init({ dir, dryRun: true })

    expect(manifest).toMatchObject({
      author: 'Acme Works',
      repository: { url: 'git+https://github.com/acme/glyphs.git' }
    })
  })

  it('writes the files of --only, and reports what differs with --check', () => {
    const dir = temporaryDir()

    init({ dir, pm: 'pnpm' })
    // Before the first install there is no lockfile to read the package manager from
    expect(checkFiles({ dir, pm: 'pnpm' })).toEqual({ missing: [], differs: [], scripts: [] })
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '')
    expect(checkFiles({ dir })).toEqual({ missing: [], differs: [], scripts: [] })

    fs.appendFileSync(path.join(dir, 'AGENTS.md'), '\nA rule of the team.\n')
    fs.rmSync(path.join(dir, '.nvmrc'))

    expect(checkFiles({ dir })).toEqual({
      missing: ['.nvmrc'],
      differs: ['AGENTS.md'],
      scripts: []
    })
    expect(init({ dir, only: ['.nvmrc'] }).files).toEqual(['.nvmrc'])
    expect(() => init({ dir, only: ['source/dot.svg'] })).toThrow('init does not write')
  })

  it('writes nothing on a dry run', () => {
    const dir = temporaryDir()
    const { files, written } = init({ dir, dryRun: true })

    expect(written).toBe(false)
    expect(files.sort()).toEqual(FILES)
    expect(fs.readdirSync(dir)).toEqual([])
  })
})

describe('parseInitArgs', () => {
  it('reads the folder and the options', () => {
    expect(
      parseInitArgs([
        'glyphs',
        '--name',
        '@acme/glyphs',
        '--font',
        'acme-glyphs',
        '--prefix',
        'ag',
        '--pm',
        'pnpm',
        '--author',
        'Acme',
        'Works',
        '--only',
        'AGENTS.md',
        '.nvmrc',
        '--force',
        '--dry-run',
        '--check'
      ])
    ).toEqual({
      help: false,
      dir: 'glyphs',
      name: '@acme/glyphs',
      font: 'acme-glyphs',
      prefix: 'ag',
      pm: 'pnpm',
      author: 'Acme Works',
      only: ['AGENTS.md', '.nvmrc'],
      force: true,
      dryRun: true,
      check: true
    })
  })

  it.each([
    [['--frobnicate'], 'Unknown option'],
    [['--name'], 'needs a value'],
    [['--pm', 'yarn'], 'Unknown package manager'],
    [['a', 'b'], 'One folder at most']
  ])('refuses %j', (args, message) => {
    expect(() => parseInitArgs(args)).toThrow(message)
  })
})

describe('the helpers of init', () => {
  it('makes a kebab-case name of a folder or a package name', () => {
    expect(kebabCase('@acme/Glyphs')).toBe('glyphs')
    expect(kebabCase('AcmeGlyphs 2')).toBe('acme-glyphs-2')
    expect(kebabCase('--2nd--')).toBe('nd')
  })

  it('reads the address of a repository from its forms', () => {
    expect(repositoryUrl('acme/glyphs')).toBe('https://github.com/acme/glyphs')
    expect(repositoryUrl('git+https://git.acme.example/design/glyphs.git')).toBe(
      'https://git.acme.example/design/glyphs'
    )
    expect(repositoryUrl('git@github.com:acme/glyphs.git')).toBe('https://github.com/acme/glyphs')
    expect(repositoryUrl({ url: 'https://github.com/acme/glyphs' })).toBe(
      'https://github.com/acme/glyphs'
    )
    expect(repositoryUrl('glyphs')).toBeUndefined()
  })

  it('aligns the columns of a Markdown table', () => {
    expect(alignTables('| a | bb |\n| - | - |\n| ccc | d |\n')).toBe(
      '| a   | bb  |\n| --- | --- |\n| ccc | d   |\n'
    )
  })
})
