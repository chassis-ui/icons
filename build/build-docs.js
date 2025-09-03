#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import picocolors from 'picocolors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkgJson = path.join(__dirname, '../package.json')
const pkg = JSON.parse(await fs.readFile(pkgJson, 'utf8'))

const iconsDir = path.join(__dirname, '../svgs/')
const pagesDir = path.join(__dirname, '../site/content/icons/')

const VERBOSE = process.argv.includes('--verbose')
const CLEAN = process.argv.includes('--clean')

let counter = 0

async function main(file) {
  const iconBasename = path.basename(file, path.extname(file))
  const iconTitle = iconBasename
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const pageName = path.join(pagesDir, `${iconBasename}.mdx`)

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

This is the **${iconTitle}** icon from the Chassis Design System.

- **Style**: ${style}
- **Category**: ${category}
- **Filename**: \`${iconBasename}.svg\`
`

  try {
    await fs.access(pageName, fs.F_OK)

    if (VERBOSE) {
      console.log(picocolors.gray(`${iconBasename}: Page already exists; skipping`))
    }
  } catch {
    await fs.writeFile(pageName, pageTemplate)
    console.log(picocolors.white(`${iconBasename}: Page created`))
    counter++
  }
}

(async () => {
  try {
    const basename = path.basename(__filename)
    const timeLabel = picocolors.cyan(`[${basename}] finished`)

    console.log(picocolors.cyan(`[${basename}] started`))
    console.time(timeLabel)

    const files = await fs.readdir(iconsDir)

    if (CLEAN) {
      try {
        await fs.access(pagesDir)
        if (VERBOSE) {
          console.log(picocolors.yellow('Deleting old pages...'))
        }

        await fs.rm(pagesDir, { recursive: true })
      } catch {
        console.log(picocolors.yellow('No existing pages to clean.'))
      }
    }

    try {
      await fs.access(pagesDir)
    } catch {
      if (VERBOSE) {
        console.log(picocolors.yellow('Creating icons directory...'))
      }

      await fs.mkdir(pagesDir, { recursive: true })
    }

    await Promise.all(files.map(file => main(file)))

    console.log(
      picocolors.green(`Success: ${counter} new page${counter === 1 ? '' : 's'}, ${files.length} total!`)
    )
    console.timeEnd(timeLabel)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
