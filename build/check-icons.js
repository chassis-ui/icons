#!/usr/bin/env node

/*!
 * Icon Consistency Checker
 *
 * Validates consistency between SVG files and generated font JSON.
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import picocolors from 'picocolors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  try {
    console.log(picocolors.cyan('🔍 Checking icon consistency...'))

    // Read font JSON
    const fontJsonPath = path.join(__dirname, '../font/chassis-icons.json')
    const fontJsonString = await fs.readFile(fontJsonPath, 'utf8')
    const fontJson = JSON.parse(fontJsonString)
    const fontIcons = new Set(Object.keys(fontJson))

    // Read SVG files
    const iconsDir = path.join(__dirname, '../svgs/')
    const svgFiles = await fs.readdir(iconsDir)
    const svgIcons = new Set(
      svgFiles
        .filter(file => file.endsWith('.svg'))
        .map(file => path.basename(file, '.svg'))
    )

    // Find differences
    const missingInFont = [...svgIcons].filter(icon => !fontIcons.has(icon))
    const missingInSvg = [...fontIcons].filter(icon => !svgIcons.has(icon))

    // Report results
    if (missingInFont.length === 0 && missingInSvg.length === 0) {
      console.log(picocolors.green(`✅ All ${svgIcons.size} icons are consistent`))
      return
    }

    if (missingInFont.length > 0) {
      console.log(picocolors.red(`❌ ${missingInFont.length} SVG files missing from font:`))
      missingInFont.forEach(icon => {
        console.log(picocolors.red(`   ✗ ${icon}.svg`))
      })
    }

    if (missingInSvg.length > 0) {
      console.log(picocolors.red(`❌ ${missingInSvg.length} font entries missing SVG files:`))
      missingInSvg.forEach(icon => {
        console.log(picocolors.red(`   ✗ ${icon}`))
      })
    }

    console.log(picocolors.yellow('\n💡 Run pnpm build:icons to regenerate fonts'))
    process.exit(1)

  } catch (error) {
    console.error(picocolors.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

main()
