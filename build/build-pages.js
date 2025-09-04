#!/usr/bin/env node

/*!
 * Page Generator Script
 *
 * Generates MDX pages for icon documentation from SVG files.
 *
 * Usage:
 *   node build-pages.js [--clean] [--verbose]
 *
 * Options:
 *   --clean     Remove existing pages before generating new ones
 *   --verbose   Show detailed output during generation
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import picocolors from 'picocolors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const ICONS_DIR = path.join(__dirname, '../svgs/')
const PAGES_DIR = path.join(__dirname, '../site/content/icons/')

// Command line arguments
const VERBOSE = process.argv.includes('--verbose')
const CLEAN = process.argv.includes('--clean')

let counter = 0

/**
 * Generates a page file for a single icon
 * @param {string} file - The icon filename
 */
async function generateIconPage(file) {
  const iconBasename = path.basename(file, path.extname(file))
  const iconTitle = iconBasename
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const pagePath = path.join(PAGES_DIR, `${iconBasename}.mdx`)

  // Determine category and style from filename
  const isOutline = iconBasename.includes('-outline')
  const isSolid = iconBasename.includes('-solid')
  const style = isOutline ? 'outline' : isSolid ? 'solid' : 'default'
  const category = iconBasename.replace(/-outline|-solid/g, '').split('-')[0]

  const pageTemplate = `---
title: ${iconBasename}
description: ${iconTitle} icon for Chassis Design System
categories: ${category}
tags: icon, ${style}, svg
---
`

  try {
    await fs.access(pagePath, fs.constants.F_OK)

    if (VERBOSE) {
      console.log(picocolors.gray(`${iconBasename}: Page already exists; skipping`))
    }
  } catch {
    await fs.writeFile(pagePath, pageTemplate)
    console.log(picocolors.white(`${iconBasename}: Page created`))
    counter++
  }
}

/**
 * Cleans existing pages directory
 */
async function cleanPagesDirectory() {
  try {
    await fs.access(PAGES_DIR)
    if (VERBOSE) {
      console.log(picocolors.yellow('🧹 Deleting old pages...'))
    }
    await fs.rm(PAGES_DIR, { recursive: true })
  } catch {
    if (VERBOSE) {
      console.log(picocolors.yellow('No existing pages to clean.'))
    }
  }
}

/**
 * Ensures pages directory exists
 */
async function ensurePagesDirectory() {
  try {
    await fs.access(PAGES_DIR)
  } catch {
    if (VERBOSE) {
      console.log(picocolors.yellow('📁 Creating icons directory...'))
    }
    await fs.mkdir(PAGES_DIR, { recursive: true })
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const basename = path.basename(__filename)
    const timeLabel = picocolors.cyan(`[${basename}] finished`)

    console.log(picocolors.cyan(`🚀 [${basename}] started`))
    console.time(timeLabel)

    const files = await fs.readdir(ICONS_DIR)

    if (CLEAN) {
      await cleanPagesDirectory()
    }

    await ensurePagesDirectory()

    // Process all icons in parallel
    await Promise.all(files.map(file => generateIconPage(file)))

    console.log(
      picocolors.green(`✓ Success: ${counter} new page${counter === 1 ? '' : 's'}, ${files.length} total!`)
    )
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
