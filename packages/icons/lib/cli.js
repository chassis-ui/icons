#!/usr/bin/env node

/**
 * @file The `chassis-icons` command: the build of a repository of icons and its checks, the
 * archive and the release notes of a release, and `init`, which writes a new repository.
 * Run `chassis-icons --help`.
 */

import { parseArgs } from 'node:util'
import { writeArchive } from './archive.js'
import { STEPS, build, compareWithBuild } from './build.js'
import { ConfigError, loadConfig } from './config.js'
import { runInit } from './init.js'
import { lintSource } from './lint-source.js'
import { createLogger } from './logger.js'
import { readReleaseNotes } from './release-notes.js'
import { buildVersion, isEntry, resolveRoot } from './root.js'
import { verify } from './verify.js'

const HELP = `Builds an icon set: optimized SVG files, an SVG sprite, an icon font with its
stylesheets, and the manifest and the README of the package, from the SVG files of the source
folder and the "chassis.build" block of package.json.

Usage: chassis-icons <command> [options]

Commands:
  build          Write the output: svgs/, icons/, the registry of code points, the README,
                 and the fields of package.json that name the files of the output
  verify         Check that the output is what the source builds, that no icon lost its
                 code point, and that the icons of the checks file are there
  lint-source    Check the files of the source folder: names, frame, color, pairs
  archive        Write <font>-<version>.zip of the output, for a release
  release-notes  Print the changelog entry of a version, and fail without one
  init           Write the files of a new repository of icons into a folder

Every command but init works on one repository of icons: --cwd <dir>, by default the nearest
folder upward from the working directory whose package.json has a "chassis" block.

Options of build:
  --only <step>  Run one step: ${STEPS.join(', ')}
  --dry-run      Change no file, and list the files that a build would change

Options of verify:
  --since <ref>  Compare the code points with those of a commit; the last tag by default

Options of archive:
  --to <dir>     Write the archive there; archives/ of the repository by default

Options of release-notes:
  [version]      The version; that of package.json by default

Options of every command:
  --cwd <dir>    The repository of icons
  --verbose      Say more: each file and each code point
  --help, -h     Show this help
  --version, -v  Show the version of the build
`

/**
 * Runs a command.
 * @param {string[]} args - The arguments after the name of the command
 * @param {object} [options]
 * @param {string} [options.cwd] - The folder that `--cwd` is resolved from, and that the
 *   repository is looked for from when `--cwd` is not given; the working directory
 * @param {Pick<Console, 'log' | 'warn' | 'error'>} [options.console] - Where to write
 * @returns {Promise<number>} The exit code: 0, 1 when the command failed, 2 when it was
 *   not understood
 */
export async function main(args, { cwd = process.cwd(), console: out = console } = {}) {
  if (args[0] === 'init') {
    return runInit(args.slice(1), { cwd, console: out })
  }

  let parsed

  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        cwd: { type: 'string' },
        only: { type: 'string' },
        since: { type: 'string' },
        to: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
        verbose: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false }
      }
    })
  } catch (error) {
    out.error(`${error.message}\n\n${HELP}`)
    return 2
  }

  const { values, positionals } = parsed
  const [command, ...rest] = positionals
  const logger = createLogger({ verbose: values.verbose, console: out })

  if (values.help || command === 'help') {
    out.log(HELP)
    return 0
  }

  if (values.version) {
    out.log(buildVersion())
    return 0
  }

  if (command === undefined || (rest.length > 0 && command !== 'release-notes')) {
    out.error(
      `${command === undefined ? 'No command.' : `Too many arguments: ${rest.join(' ')}`}\n\n${HELP}`
    )
    return 2
  }

  try {
    const root = values.cwd ? resolveRoot(values.cwd, cwd) : resolveRoot(undefined, cwd)

    switch (command) {
      case 'build': {
        const config = loadConfig(root)

        if (values['dry-run']) {
          if (values.only !== undefined) {
            out.error('--dry-run compares a whole build: leave out --only.')
            return 2
          }

          const { differences } = await compareWithBuild(config, {
            logger: createLogger({ quiet: true, console: out })
          })

          for (const difference of differences) logger.info(`  ${difference}`)
          logger.success(
            differences.length === 0
              ? 'A build would change nothing'
              : `A build would change ${differences.length} file${differences.length === 1 ? '' : 's'}`
          )
          return 0
        }

        await build(config, { only: values.only, logger })
        return 0
      }

      case 'verify': {
        const { icons, problems, notes } = await verify(loadConfig(root), {
          since: values.since,
          logger: createLogger({ quiet: true, console: out })
        })

        for (const note of notes) logger.info(note)
        for (const problem of problems) logger.error(problem)

        if (problems.length > 0) {
          logger.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}`)
          return 1
        }

        logger.success(`The output of ${icons} icons is what the source builds`)
        return 0
      }

      case 'lint-source': {
        const { icons, problems } = lintSource(loadConfig(root))

        for (const { file, message } of problems) logger.error(`${file} ${message}`)

        if (problems.length > 0) {
          logger.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}`)
          return 1
        }

        logger.success(`${icons} source files can be icons of the set`)
        return 0
      }

      case 'archive': {
        const config = loadConfig(root)
        const { file, entries } = writeArchive(config, {
          to: values.to === undefined ? undefined : resolveRoot(values.to, cwd)
        })

        for (const entry of entries) logger.debug(`  ${entry}`)
        logger.success(`${file}: ${entries.length} files`)
        return 0
      }

      case 'release-notes': {
        out.log(readReleaseNotes(root, rest[0]).trimEnd())
        return 0
      }

      default: {
        out.error(`There is no command "${command}".\n\n${HELP}`)
        return 2
      }
    }
  } catch (error) {
    logger.error(error.message)

    if (values.verbose && !(error instanceof ConfigError)) {
      out.error(error.stack)
    }

    return 1
  }
}

// Only when this file is what Node was started with, not when a test imports it
if (isEntry(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2))
}
