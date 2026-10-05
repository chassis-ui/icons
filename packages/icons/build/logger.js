/**
 * @file The one logger of the build. A module never writes to the console itself: it takes a
 * logger, so that a test or a caller can silence or collect what it says.
 */

import picocolors from 'picocolors'

/**
 * @typedef {object} Logger
 * @property {(message: string) => void} info - What the build does
 * @property {(message: string) => void} success - What a step ended with
 * @property {(message: string) => void} warn - What does not stop the build
 * @property {(message: string) => void} error - What stops it
 * @property {(message: string) => void} debug - Detail, with `verbose` only
 */

/**
 * @param {object} [options]
 * @param {boolean} [options.verbose] - Write the `debug` messages too
 * @param {boolean} [options.quiet] - Write errors and warnings only
 * @param {Pick<Console, 'log' | 'warn' | 'error'>} [options.console] - Where to write
 * @returns {Logger}
 */
export function createLogger({ verbose = false, quiet = false, console: out = console } = {}) {
  return {
    info(message) {
      if (!quiet) out.log(message)
    },
    success(message) {
      if (!quiet) out.log(picocolors.green(`✓ ${message}`))
    },
    warn(message) {
      out.warn(picocolors.yellow(`! ${message}`))
    },
    error(message) {
      out.error(picocolors.red(`✗ ${message}`))
    },
    debug(message) {
      if (verbose && !quiet) out.log(picocolors.gray(message))
    }
  }
}

/** A logger that says nothing. */
export const silentLogger = createLogger({
  quiet: true,
  console: { log() {}, warn() {}, error() {} }
})
