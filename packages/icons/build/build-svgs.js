#!/usr/bin/env node

/*!
 * SVG Optimization Script
 *
 * Optimizes the SVG files of source/, at the root of the repository, with the SVGO
 * configuration, and writes them to svgs/ of the package. It only reads source/. A file of
 * svgs/ whose source is gone is removed.
 *
 * Usage:
 *   node build-svgs.js [--verbose] [--dry-run]
 *
 * Options:
 *   --verbose   Show detailed output for each processed file
 *   --dry-run   Preview changes without writing files
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import picocolors from 'picocolors'
import { loadConfig, optimize } from 'svgo'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const SOURCE_DIR = path.join(__dirname, '../../../source')
const OUTPUT_DIR = path.join(__dirname, '../svgs')
const SVGO_CONFIG_PATH = path.join(__dirname, '../svgo.config.js')

// Command line arguments
const VERBOSE = process.argv.includes('--verbose')
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('--dry')

let optimizedCount = 0
let totalSize = 0
let savedSize = 0

/**
 * Process a single SVG file with SVGO optimization
 * @param {string} file - Filename to process
 * @param {Object} config - SVGO configuration object
 */
async function processFile(file, config) {
  const filepath = path.join(SOURCE_DIR, file)
  const outputPath = path.join(OUTPUT_DIR, file)
  const basename = path.basename(file, '.svg')

  try {
    const originalSvg = await fs.readFile(filepath, 'utf8')
    const originalSize = Buffer.byteLength(originalSvg, 'utf8')

    const { data: optimizedSvg } = await optimize(originalSvg, {
      path: filepath,
      ...config
    })

    // svgo will always add a final newline when in pretty mode
    const resultSvg = optimizedSvg.trim()
    const resultSize = Buffer.byteLength(resultSvg, 'utf8')
    const sizeDiff = originalSize - resultSize

    totalSize += originalSize
    savedSize += sizeDiff

    const writtenSvg = await fs.readFile(outputPath, 'utf8').catch(() => null)

    if (resultSvg !== writtenSvg && !DRY_RUN) {
      await fs.writeFile(outputPath, resultSvg, 'utf8')
    }

    if (resultSvg !== originalSvg) {
      optimizedCount++

      if (VERBOSE) {
        const reduction = sizeDiff > 0 ? `(-${sizeDiff}B)` : '(no change)'
        const status = DRY_RUN ? '(dry-run)' : ''
        console.log(picocolors.white(`${basename}: optimized ${reduction} ${status}`))
      }
    } else if (VERBOSE) {
      console.log(picocolors.gray(`${basename}: already optimized`))
    }
  } catch (error) {
    console.error(picocolors.red(`❌ Error processing ${basename}:`), error.message)
    throw error
  }
}

/**
 * Removes the files of the output directory that have no source file
 * @param {string[]} svgFiles - The filenames of the source directory
 * @returns {Promise<number>} The number of stale files
 */
async function removeStaleFiles(svgFiles) {
  const sources = new Set(svgFiles)
  const written = await fs.readdir(OUTPUT_DIR).catch(() => [])
  const stale = written.filter((file) => path.extname(file) === '.svg' && !sources.has(file))

  for (const file of stale) {
    if (!DRY_RUN) {
      await fs.rm(path.join(OUTPUT_DIR, file))
    }

    if (VERBOSE) {
      const status = DRY_RUN ? '(dry-run)' : ''
      console.log(picocolors.white(`${path.basename(file, '.svg')}: removed, no source ${status}`))
    }
  }

  return stale.length
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Main execution function
 */
async function main() {
  // Handle help command
  if (
    process.argv.includes('--help') ||
    process.argv.includes('-h') ||
    process.argv.includes('help')
  ) {
    console.log(`
${picocolors.cyan('SVG Optimization Script')}

${picocolors.yellow('Usage:')}
  node build-svgs.js [options]

${picocolors.yellow('Options:')}
  ${picocolors.green('--verbose')}   Show detailed output for each processed file
  ${picocolors.green('--dry-run')}   Preview changes without writing files
  ${picocolors.green('--help')}      Show this help message

${picocolors.yellow('Examples:')}
  node build-svgs.js                    # Optimize all SVG files
  node build-svgs.js --verbose          # Show detailed progress
  node build-svgs.js --dry-run          # Preview optimization results
`)
    return
  }

  try {
    const basename = path.basename(__filename)
    const timeLabel = picocolors.cyan(`[${basename}] finished`)

    console.log(picocolors.cyan(`🚀 [${basename}] started`))

    if (DRY_RUN) {
      console.log(picocolors.yellow('🔍 Running in dry-run mode (no files will be modified)'))
    }

    console.time(timeLabel)

    // Load SVGO configuration
    const config = await loadConfig(SVGO_CONFIG_PATH)
    if (!config) {
      throw new Error(`SVGO configuration not found at ${SVGO_CONFIG_PATH}`)
    }

    // Get all SVG files
    const files = await fs.readdir(SOURCE_DIR)
    const svgFiles = files.filter((file) => path.extname(file) === '.svg')

    if (svgFiles.length === 0) {
      console.log(picocolors.yellow('⚠️  No SVG files found in the source directory'))
      return
    }

    if (!DRY_RUN) {
      await fs.mkdir(OUTPUT_DIR, { recursive: true })
    }

    console.log(
      picocolors.cyan(
        `📁 Processing ${svgFiles.length} SVG file${svgFiles.length === 1 ? '' : 's'}...`
      )
    )

    // Process all SVG files
    await Promise.all(svgFiles.map((file) => processFile(file, config)))

    const removedCount = await removeStaleFiles(svgFiles)

    // Summary
    const savedSizeMB = formatBytes(savedSize)
    const percentSaved = totalSize > 0 ? ((savedSize / totalSize) * 100).toFixed(1) : '0'

    if (DRY_RUN) {
      console.log(picocolors.blue(`\n📊 Dry-run Summary:`))
      console.log(
        picocolors.white(
          `   ${optimizedCount} file${optimizedCount === 1 ? '' : 's'} would be optimized`
        )
      )
      console.log(picocolors.white(`   ${savedSizeMB} would be saved (${percentSaved}% reduction)`))
      if (removedCount > 0) {
        console.log(
          picocolors.white(
            `   ${removedCount} file${removedCount === 1 ? '' : 's'} without a source would be removed`
          )
        )
      }
    } else {
      console.log(
        picocolors.green(
          `\n✅ Success: ${optimizedCount} file${optimizedCount === 1 ? '' : 's'} optimized, ${svgFiles.length} total!`
        )
      )
      if (savedSize > 0) {
        console.log(
          picocolors.green(`💾 Size reduction: ${savedSizeMB} saved (${percentSaved}% reduction)`)
        )
      }
      if (removedCount > 0) {
        console.log(
          picocolors.green(
            `🧹 Removed ${removedCount} file${removedCount === 1 ? '' : 's'} without a source`
          )
        )
      }
    }

    console.timeEnd(timeLabel)
  } catch (error) {
    console.error(picocolors.red('❌ Error:'), error.message)
    if (VERBOSE) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Execute main function
main()
