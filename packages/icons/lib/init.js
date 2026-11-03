/**
 * @file `init`: the files of a new repository of icons, written into a folder. A package.json
 * with the `chassis.build` block, the scripts and a development dependency on this package,
 * a changelog, the instructions for agents, a CI workflow and a release workflow, from the
 * templates in `templates/` of the package, with the few values that differ by repository
 * filled in: the name of the package, the font, the prefix and the package manager. The
 * README is not among them: the build writes it, from the configuration and the icons.
 *
 * The command writes nothing when a file that it would write exists, unless `--force` is
 * given, and `--dry-run` only prints the files. package.json and CHANGELOG.md hold the data
 * of a repository, and are never written over. A repository made earlier takes what changed
 * with `--check`, which reports where it differs from what this version writes, and
 * `--only <file…>`, which writes those files.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildVersion, packageRoot } from './root.js'

/** The folder of the templates. */
const TEMPLATES_DIR = path.join(packageRoot, 'templates')

/** The version of Node.js written to `.nvmrc`. Trusted publishing needs its npm 11. */
export const NODE_VERSION = '24'

/** The first version of a repository. */
export const FIRST_VERSION = '0.1.0'

/** The package managers of `--pm`, with the commands the templates name. */
export const PACKAGE_MANAGERS = {
  // The install of the workflows is frozen, so the first install has to commit its lockfile
  npm: {
    install: 'npm install',
    ci: 'npm ci',
    run: 'npm run',
    lockfile: 'package-lock.json',
    setup: ''
  },
  pnpm: {
    install: 'pnpm install',
    ci: 'pnpm install --frozen-lockfile',
    run: 'pnpm',
    lockfile: 'pnpm-lock.yaml',
    setup: [
      '      - name: Setup pnpm',
      '        uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0',
      '        with:',
      '          version: 10',
      '',
      ''
    ].join('\n')
  }
}

/** What a repository starts with, when the options leave it out. */
export const DEFAULTS = { pm: 'npm', license: 'MIT', frame: 24, formats: ['woff2', 'woff'] }

/** The files that hold the data of a repository: written when missing, never over one. */
export const DATA_FILES = ['package.json', 'CHANGELOG.md']

const NAME = /^[a-z][\da-z]*(?:-[\da-z]+)*$/

/**
 * @typedef {object} InitOptions
 * @property {string} [dir] - The folder to write into; the working directory
 * @property {string} [name] - The name of the package; the name of the folder
 * @property {string} [font] - The name of the font, `name` of `chassis.build`; the name of
 *   the folder in kebab-case, whatever the name of the package
 * @property {string} [prefix] - The class prefix, `prefix` of `chassis.build`; the first
 *   letter of each part of the font name
 * @property {'npm' | 'pnpm'} [pm] - The package manager the workflows and the instructions
 *   name; npm
 * @property {string} [repository] - The repository, `owner/name` or an address; the `origin`
 *   remote of the folder, when it is the root of a Git repository
 * @property {string} [license] - The license; MIT
 * @property {string} [author] - The author; `user.name` of the Git configuration
 * @property {string[]} [only] - Write these files of the plan only
 * @property {boolean} [force] - Write over a file that exists, but never one of `DATA_FILES`
 * @property {boolean} [dryRun] - Print the files, write nothing
 */

/**
 * The web address of a repository, from `owner/name`, a GitHub shorthand or any address of
 * a remote: `git+https://host/owner/name.git`, `git@host:owner/name.git`.
 * @param {unknown} repository
 * @returns {string | undefined} `https://host/owner/name`, or undefined when it cannot be read
 */
export function repositoryUrl(repository) {
  const value = (
    typeof repository === 'string' ? repository : /** @type {any} */ (repository)?.url
  )?.trim()

  if (!value) return undefined

  const shorthand = value.replace(/^github:/, '').match(/^[\w.-]+\/[\w.-]+$/)

  if (shorthand) return `https://github.com/${shorthand[0].replace(/\.git$/, '')}`

  const match =
    value.match(
      /^(?:git\+)?(?:https?|ssh|git):\/\/(?:[^@/]+@)?([^/:]+)(?::\d+)?\/(.+?)(?:\.git)?\/?$/
    ) ?? value.match(/^[^@/]+@([^/:]+):(.+?)(?:\.git)?\/?$/)

  return match ? `https://${match[1]}/${match[2]}` : undefined
}

/**
 * Reads what Git knows of a folder: the author, by name only, since a package publishes it,
 * and the `origin` remote, when the folder is the root of a repository.
 * @param {string} dir
 * @returns {{ repository?: string, author?: string }} Without what Git does not know
 */
export function gitDefaults(dir) {
  const inDir = fs.existsSync(dir)
  const git = (/** @type {string} */ cwd, /** @type {string[]} */ ...args) => {
    try {
      return (
        execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim() || undefined
      )
    } catch {
      return undefined
    }
  }
  const author = git(inDir ? dir : os.homedir(), 'config', 'user.name')
  const top = inDir ? git(dir, 'rev-parse', '--show-toplevel') : undefined
  const isRoot = top !== undefined && top === fs.realpathSync(dir)
  const repository = isRoot ? git(dir, 'remote', 'get-url', 'origin') : undefined

  return {
    ...(author && { author }),
    ...(repository && repositoryUrl(repository) && { repository })
  }
}

/**
 * What a folder that already holds a repository says of itself: its name, its version and
 * the names of its set in package.json, and the package manager of its lockfile.
 * @param {string} dir
 * @returns {{ name?: string, version?: string, font?: string, prefix?: string, pm?: 'npm' | 'pnpm' }}
 */
export function repositoryDefaults(dir) {
  /** @type {Record<string, any>} */
  let manifest = {}

  try {
    manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  } catch {
    // No package.json here, or one that cannot be read: nothing to say
  }

  const block = manifest.chassis?.build ?? {}
  const lockfile = /** @type {('npm' | 'pnpm')[]} */ (Object.keys(PACKAGE_MANAGERS)).find((pm) =>
    fs.existsSync(path.join(dir, PACKAGE_MANAGERS[pm].lockfile))
  )

  return {
    ...(typeof manifest.name === 'string' && { name: manifest.name }),
    ...(typeof manifest.version === 'string' && { version: manifest.version }),
    ...(typeof block.name === 'string' && { font: block.name }),
    ...(typeof block.prefix === 'string' && { prefix: block.prefix }),
    ...(lockfile && { pm: lockfile })
  }
}

/**
 * A name of a font or a prefix from the name of a folder or a package: its last part, in
 * kebab-case.
 * @param {string} name
 * @returns {string}
 */
export function kebabCase(name) {
  return name
    .split('/')
    .pop()
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^\da-z]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^[^a-z]+/, '')
}

/**
 * A name in kebab-case as a title: `acme-icons` is "Acme Icons".
 * @param {string} name
 * @returns {string}
 */
function toTitle(name) {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Fills a template: the placeholders, and the line of the pnpm setup step.
 * @param {string} text
 * @param {Record<string, string>} values - By placeholder, without the underscores
 * @returns {string}
 */
function render(text, values) {
  return text
    .replace(/^[ \t]*# __PNPM_SETUP__\n/m, values.PNPM_SETUP)
    .replace(/__([A-Z_]+?)__/g, (match, key) => (key in values ? values[key] : match))
}

/**
 * Pads the columns of every Markdown table to the width of their widest cell, as Prettier
 * does: a placeholder is replaced by text of another length, so a table of a template is
 * aligned for one package manager only until it is rendered.
 * @param {string} markdown
 * @returns {string}
 */
export function alignTables(markdown) {
  const lines = markdown.split('\n')
  const isRow = (/** @type {string} */ line) => /^\s*\|.*\|\s*$/.test(line)
  const isRule = (/** @type {string} */ cell) => /^:?-+:?$/.test(cell)

  for (let start = 0; start < lines.length; start++) {
    if (!isRow(lines[start])) continue

    let end = start

    while (end + 1 < lines.length && isRow(lines[end + 1])) end++

    const rows = lines.slice(start, end + 1).map((line) =>
      line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim())
    )
    const widths = rows[0].map((_, column) =>
      Math.max(...rows.map((row) => (isRule(row[column] ?? '') ? 3 : (row[column] ?? '').length)))
    )

    for (let n = 0; n < rows.length; n++) {
      const cells = widths.map((width, column) => {
        const cell = rows[n][column] ?? ''

        return isRule(cell) ? '-'.repeat(width) : cell.padEnd(width)
      })

      lines[start + n] = `| ${cells.join(' | ')} |`
    }

    start = end
  }

  return lines.join('\n')
}

/**
 * The files of a repository, by path relative to its root, with their contents. Pure, apart
 * from reading the templates.
 * @param {InitOptions} [options]
 * @returns {Map<string, string>}
 * @throws {Error} On a name, a prefix or a package manager that is not accepted
 */
export function planFiles(options = {}) {
  const dir = path.resolve(options.dir || '.')
  const name = options.name || path.basename(dir)
  // From the folder, not the package: `@acme/icons` in `acme-icons/` is the font `acme-icons`
  const font = options.font || kebabCase(path.basename(dir))
  const prefix =
    options.prefix ||
    font
      .split('-')
      .map((part) => part.charAt(0))
      .join('')
  const pm = options.pm || DEFAULTS.pm

  if (!NAME.test(font)) {
    throw new Error(`The name of the font has to be in kebab-case, such as acme-icons: ${font}`)
  }

  if (!NAME.test(prefix)) {
    throw new Error(`The prefix has to be in kebab-case, such as ac: ${prefix}`)
  }

  if (!Object.hasOwn(PACKAGE_MANAGERS, pm)) {
    throw new Error(
      `Unknown package manager ${pm}. One of ${Object.keys(PACKAGE_MANAGERS).join(', ')}`
    )
  }

  const repository = options.repository && repositoryUrl(options.repository)

  if (options.repository && !repository) {
    throw new Error(`A repository is owner/name or an address: ${options.repository}`)
  }

  const license = options.license || DEFAULTS.license
  const authorName = options.author?.replace(/\s*[<(].*$/, '').trim()
  const commands = PACKAGE_MANAGERS[pm]
  const values = {
    NAME: name,
    FONT: font,
    PREFIX: prefix,
    VERSION: FIRST_VERSION,
    INSTALL: commands.install,
    INSTALL_CI: commands.ci,
    RUN: commands.run,
    PM: pm,
    PNPM_SETUP: commands.setup
  }
  const template = (/** @type {string} */ file) => {
    const text = render(fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8'), values)

    return file.endsWith('.md') ? alignTables(text) : text
  }
  const manifest = {
    name,
    version: FIRST_VERSION,
    description: `The icons of ${toTitle(font)}, built with @chassis-ui/icons`,
    type: 'module',
    ...(repository && { repository: { type: 'git', url: `git+${repository}.git` } }),
    license,
    ...(options.author && { author: options.author }),
    // The build adds the fields that name its output before the `chassis` block
    files: ['CHANGELOG.md'],
    publishConfig: { access: 'public', provenance: true },
    chassis: {
      build: {
        name: font,
        prefix,
        frame: DEFAULTS.frame,
        styles: [],
        pairs: [],
        startCodepoint: 'f101',
        formats: DEFAULTS.formats,
        header: [
          `${toTitle(font)} v{version}`,
          ...(authorName ? [`Copyright ${authorName}`] : []),
          `Licensed under ${license}`
        ]
      }
    },
    scripts: {
      build: 'chassis-icons build',
      lint: 'chassis-icons lint-source',
      verify: 'chassis-icons verify',
      preview: 'chassis-icons preview --serve',
      archive: 'chassis-icons archive',
      'release-notes': 'chassis-icons release-notes'
    },
    engines: { node: '>=22.12.0' },
    devDependencies: { '@chassis-ui/icons': `^${buildVersion()}` }
  }

  return new Map([
    ['package.json', `${JSON.stringify(manifest, null, 2)}\n`],
    ['.gitignore', template('gitignore')],
    ['.nvmrc', `${NODE_VERSION}\n`],
    ['CHANGELOG.md', template('CHANGELOG.md')],
    ['AGENTS.md', template('AGENTS.md')],
    ['CLAUDE.md', template('CLAUDE.md')],
    ['.github/workflows/ci.yml', template('workflows/ci.yml')],
    ['.github/workflows/release.yml', template('workflows/release.yml')]
  ])
}

/**
 * The plan of a folder: the options over what the folder and Git say of it, and the files
 * of `only`.
 * @param {InitOptions} options
 * @param {string} dir
 * @returns {Map<string, string>}
 * @throws {Error} As `planFiles`, or when `only` names a file that init does not write
 */
function planFor(options, dir) {
  const plan = planFiles({ ...gitDefaults(dir), ...repositoryDefaults(dir), ...options, dir })

  if (!options.only?.length) return plan

  for (const file of options.only) {
    if (!plan.has(file)) {
      throw new Error(`init does not write ${file}. It writes ${[...plan.keys()].join(', ')}`)
    }
  }

  return new Map([...plan].filter(([file]) => options.only?.includes(file)))
}

/**
 * Writes the files of a new repository of icons. A file of `DATA_FILES` that exists stays,
 * with or without `force`.
 * @param {InitOptions} [options]
 * @returns {{ dir: string, files: string[], existing: string[], keptData: string[], manifest: Record<string, any> | undefined, written: boolean }}
 *   The folder, the files relative to it, the ones of them that existed before, the data
 *   files that `force` left alone, the package.json that was planned, and whether the files
 *   were written, which they are not on a dry run
 * @throws {Error} When a file exists and neither `force` nor `dryRun` is given, or on an
 *   option that is not accepted. Nothing is written then
 */
export function init(options = {}) {
  const dir = path.resolve(options.dir || '.')
  const plan = planFor(options, dir)
  const manifest = plan.has('package.json')
    ? JSON.parse(/** @type {string} */ (plan.get('package.json')))
    : undefined
  const keptData = options.force
    ? DATA_FILES.filter((file) => plan.has(file) && fs.existsSync(path.join(dir, file)))
    : []

  for (const file of keptData) plan.delete(file)

  const files = [...plan.keys()]
  const existing = files.filter((file) => fs.existsSync(path.join(dir, file)))

  if (options.dryRun) {
    return { dir, files, existing, keptData, manifest, written: false }
  }

  if (existing.length > 0 && !options.force) {
    throw new Error(
      `Files to write exist in ${dir}: ${existing.join(', ')}. --force writes over them.`
    )
  }

  for (const [file, contents] of plan) {
    const target = path.join(dir, file)

    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, contents)
  }

  return { dir, files, existing, keptData, manifest, written: true }
}

/**
 * Where a repository differs from what this version of init writes. A file of `DATA_FILES`
 * only has to exist, and of package.json the scripts of the plan have to be there.
 * @param {InitOptions} [options]
 * @returns {{ missing: string[], differs: string[], scripts: string[] }}
 */
export function checkFiles(options = {}) {
  const dir = path.resolve(options.dir || '.')
  const plan = planFor(options, dir)
  /** @type {{ missing: string[], differs: string[], scripts: string[] }} */
  const report = { missing: [], differs: [], scripts: [] }

  for (const [file, contents] of plan) {
    const target = path.join(dir, file)

    if (!fs.existsSync(target)) {
      report.missing.push(file)
    } else if (!DATA_FILES.includes(file) && fs.readFileSync(target, 'utf8') !== contents) {
      report.differs.push(file)
    }
  }

  if (plan.has('package.json') && fs.existsSync(path.join(dir, 'package.json'))) {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const planned = JSON.parse(/** @type {string} */ (plan.get('package.json')))

    report.scripts = Object.keys(planned.scripts).filter((script) => !manifest.scripts?.[script])
  }

  return report
}

const HELP = `Usage: chassis-icons init [dir] [options]

Writes the files of a new repository of icons into dir, the working directory by default:
package.json with the "chassis.build" block, the scripts and the dependency on the build,
.gitignore, .nvmrc, CHANGELOG.md, AGENTS.md, CLAUDE.md, a CI workflow and a release workflow.
The README is written by the build. Writes nothing when a file exists, and never over
package.json or CHANGELOG.md.

Options:
  --name <name>        The package name; the name of the folder
  --font <name>        The name of the font, in kebab-case; the name of the folder
  --prefix <name>      The class prefix; the first letter of each part of the font name
  --pm <npm|pnpm>      The package manager the workflows and the instructions name; npm
  --repository <repo>  The repository, owner/name or an address; the origin remote of the
                       folder, or left out
  --license <license>  The license; MIT
  --author <author>    The author; user.name of Git, or left out
  --only <file…>       Write these files only, for a repository made earlier; one that
                       exists needs --force
  --check              Report where the repository differs from what this version writes,
                       and exit 1 when it does. Writes nothing. Reads the package manager
                       from the lockfile: before the first install, give --pm
  --force              Write over the files that exist, but never package.json or
                       CHANGELOG.md
  --dry-run            Print the files, write nothing
  --help, -h           Show this help
`

/**
 * Parses the arguments of the command.
 * @param {string[]} argv
 * @returns {InitOptions & { help: boolean, check?: boolean }}
 * @throws {Error} On an unknown option, or an option without its value
 */
export function parseInitArgs(argv) {
  /** @type {InitOptions & { help: boolean, check?: boolean }} */
  const options = { help: false }
  const values = (/** @type {number} */ i) => {
    const list = []

    while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) list.push(argv[++i])

    if (list.length === 0) throw new Error(`${argv[i]} needs a value`)

    return { list, i }
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--check') {
      options.check = true
    } else if (arg === '--only') {
      const { list, i: next } = values(i)

      options.only = [...(options.only ?? []), ...list]
      i = next
    } else if (['--repository', '--license', '--author'].includes(arg)) {
      const { list, i: next } = values(i)

      options[/** @type {'repository' | 'license' | 'author'} */ (arg.slice(2))] = list.join(' ')
      i = next
    } else if (['--name', '--font', '--prefix', '--pm'].includes(arg)) {
      const { list, i: next } = values(i)

      if (list.length > 1) throw new Error(`${arg} takes one value`)

      if (arg === '--pm' && !Object.hasOwn(PACKAGE_MANAGERS, list[0])) {
        throw new Error(
          `Unknown package manager ${list[0]}. One of ${Object.keys(PACKAGE_MANAGERS).join(', ')}`
        )
      }

      options[/** @type {'name' | 'font' | 'prefix' | 'pm'} */ (arg.slice(2))] =
        /** @type {any} */ (list[0])
      i = next
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option ${arg}. Run with --help for the options.`)
    } else if (options.dir === undefined) {
      options.dir = arg
    } else {
      throw new Error(`One folder at most: ${options.dir} and ${arg}`)
    }
  }

  return options
}

/**
 * The command line of init: `chassis-icons init`.
 * @param {string[]} argv - The arguments after `init`
 * @param {object} [context]
 * @param {string} [context.cwd] - The folder that `dir` is resolved from
 * @param {Pick<Console, 'log' | 'warn' | 'error'>} [context.console] - Where to write
 * @returns {number} The exit code
 */
export function runInit(argv, { cwd = process.cwd(), console: out = console } = {}) {
  let options

  try {
    options = parseInitArgs(argv)
  } catch (error) {
    out.error(`✗ ${error.message}`)
    return 2
  }

  if (options.help) {
    out.log(HELP)
    return 0
  }

  options.dir = path.resolve(cwd, options.dir || '.')

  const shown = path.relative(cwd, options.dir) || '.'

  if (options.check) {
    try {
      const { missing, differs, scripts } = checkFiles(options)

      for (const file of missing) out.log(`+ ${file}: missing`)
      for (const file of differs) out.log(`~ ${file}: differs`)
      for (const script of scripts) out.log(`+ package.json: no script ${script}`)

      if (missing.length + differs.length + scripts.length === 0) {
        out.log('✓ The repository has what this version of init writes')
        return 0
      }

      out.log('\nchassis-icons init --only <file…> writes a missing file, and with --force one')
      out.log('that differs. A repository may differ on purpose.')
      return 1
    } catch (error) {
      out.error(`✗ ${error.message}`)
      return 1
    }
  }

  try {
    const { files, existing, keptData, manifest, written } = init(options)

    for (const file of files) {
      out.log(`  ${file}${!written && existing.includes(file) ? ' (exists)' : ''}`)
    }

    for (const file of keptData) out.log(`  Kept ${file}: it holds the data of the repository`)

    if (manifest) {
      const { name, repository, license, author } = manifest
      const { name: font, prefix } = manifest.chassis.build

      out.log(
        `  ${name}: the font ${font}, the prefix ${prefix}-, the repository ${repository?.url ?? 'none'}, the license ${license}, the author ${author ?? 'none'}`
      )
    }

    if (!written) {
      out.log(
        `\n✓ Dry run: ${files.length} files to write in ${shown}${existing.length > 0 ? `, ${existing.length} of them exist` : ''}`
      )
      return 0
    }

    if (options.only?.length) {
      out.log(`\n✓ ${files.length} files in ${shown}`)
      return 0
    }

    const commands =
      PACKAGE_MANAGERS[options.pm || repositoryDefaults(options.dir).pm || DEFAULTS.pm]

    out.log(`\n✓ ${files.length} files in ${shown}\n\nNext:`)
    if (shown !== '.') out.log(`  cd ${shown}`)
    out.log(`  git init\n  ${commands.install}`)
    out.log('  save the SVG files of your icons into source/, one per icon')
    out.log(`  ${commands.run} lint\n  ${commands.run} build\n  ${commands.run} verify`)
    out.log(`  git add . (with ${commands.lockfile}, which the workflows install from)`)
    return 0
  } catch (error) {
    out.error(`✗ ${error.message}`)
    return 1
  }
}
