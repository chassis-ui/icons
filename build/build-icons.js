#!/usr/bin/env node

/*!
 * Icon Font Builder Script
 *
 * Generates web fonts from SVG icons using Fantasticon.
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

/**
 * Runs Fantasticon to generate icon fonts from SVG files
 */
async function runFantasticon() {
  try {
    console.log('🚀 Building icon fonts with Fantasticon...')

    const { stdout, stderr } = await execAsync('npx fantasticon --config .fantasticonrc.cjs')

    if (stdout) {
      console.log('✓ Fantasticon completed successfully')
      if (stdout.trim()) {
        console.log('Output:', stdout.trim())
      }
    }

    if (stderr) {
      console.warn('⚠️ Fantasticon warnings:', stderr.trim())
    }

  } catch (error) {
    console.error('❌ Error running Fantasticon:', error.message)
    process.exit(1)
  }
}

// Validate config file exists before running
async function main() {
  try {
    await fs.access('.fantasticonrc.cjs')
    await runFantasticon()
    console.log('🎉 Icon font generation completed!')
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Error: .fantasticonrc.cjs config file not found')
      process.exit(1)
    }
    throw error
  }
}

main()
