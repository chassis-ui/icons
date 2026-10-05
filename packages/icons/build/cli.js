#!/usr/bin/env node

/**
 * @file The command line of the build. Run `node build/cli.js --help`.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { STEPS, build, compareWithBuild, init } from './build.js'
import { ConfigError, loadConfig } from './config.js'
import { lintSource } from './lint-source.js'
import { createLogger } from './logger.js'
import { verify } from './verify.js'

const HELP = `Builds an icon set: optimized SVG files, an SVG sprite, an icon font with its
stylesheets, and the manifest and the README of the package, from the SVG files of the source
folder and the "chassis.build" block of package.json.

Usage: node build/cli.js <command> [options]

Commands:
  build         Write the output: svgs/, icons/, the registry of code points, the README,
                and the fields of package.json that name the files of the output
  verify        Check that the output is what the source builds, that no icon lost its
                code point, and that the icons of the checks file are there
  lint-source   Check the files of the source folder: names, frame, color, pairs
  init          Empty the output and the registry, to start a new set

Options of build:
  --only <step> Run one step: ${STEPS.join(', ')}
  --dry-run     Change no file, and list the files that a build would change

Options of verify:
  --since <ref> Compare the code points with those of a commit; the last tag by default

Options of every command:
  --verbose     Say more: each file and each code point
  --help, -h    Show this help
`

/**
 * Runs a command.
 * @param {string[]} args - The arguments after the name of the script
 * @param {object} [options]
 * @param {string} [options.packageDir] - The package to build; the one this file is in
 * @param {Pick<Console, 'log' | 'warn' | 'error'>} [options.console] - Where to write
 * @returns {Promise<number>} The exit code: 0, 1 when the command failed, 2 when it was
 *   not understood
 */
export async function main(
  args,
  { packageDir = path.resolve(import.meta.dirname, '..'), console: out = console } = {}
) {
  let parsed

  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        only: { type: 'string' },
        since: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
        verbose: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false }
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

  if (command === undefined || rest.length > 0) {
    out.error(
      `${command === undefined ? 'No command.' : `Too many arguments: ${rest.join(' ')}`}\n\n${HELP}`
    )
    return 2
  }

  try {
    const config = loadConfig(packageDir)

    switch (command) {
      case 'build': {
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
        const { icons, problems, notes } = await verify(config, {
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
        const { icons, problems } = lintSource(config)

        for (const { file, message } of problems) logger.error(`${file} ${message}`)

        if (problems.length > 0) {
          logger.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}`)
          return 1
        }

        logger.success(`${icons} source files can be icons of the set`)
        return 0
      }

      case 'init': {
        await init(config, { logger })
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
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2))
}
