import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { compareNames, listIcons, parseName } from '../lib/names.js'
import { temporaryDir } from './helpers.js'

describe('parseName', () => {
  const styles = ['line', 'fill', 'duo']

  it('splits a name into what it shows and its style', () => {
    expect(parseName('ring-half-fill', styles)).toEqual({ base: 'ring-half', style: 'fill' })
    expect(parseName('diamond-duo', styles)).toEqual({ base: 'diamond', style: 'duo' })
    expect(parseName('h1-line', styles)).toEqual({ base: 'h1', style: 'line' })
  })

  it('takes any kebab-case name when the set has no styles', () => {
    expect(parseName('ring-half', [])).toEqual({ base: 'ring-half', style: null })
  })

  it('finds the longest style that a name ends in', () => {
    expect(parseName('drop-half-fill', ['fill', 'half-fill'])).toEqual({
      base: 'drop',
      style: 'half-fill'
    })
  })

  it.each(['Star_Filled', 'bar--fill', '-bar-fill', 'bar-fill-', '1bar-fill', 'bar fill'])(
    'refuses %s, which is not in kebab-case',
    (name) => {
      expect(parseName(name, styles)).toHaveProperty('error', expect.stringContaining('kebab-case'))
    }
  )

  it.each(['bar', 'bar-filled', 'fill'])('refuses %s, which ends in no style', (name) => {
    expect(parseName(name, styles)).toHaveProperty('error', expect.stringContaining('-line'))
  })
})

describe('compareNames', () => {
  it('orders by code unit, whatever the locale', () => {
    expect(['b', 'a-1', 'a', 'B', 'a-'].sort(compareNames)).toEqual(['B', 'a', 'a-', 'a-1', 'b'])
  })
})

describe('listIcons', () => {
  it('lists the SVG files of a folder by name, sorted', () => {
    const dir = temporaryDir()

    for (const file of ['b-fill.svg', 'a-fill.svg', 'notes.txt', '.DS_Store']) {
      fs.writeFileSync(path.join(dir, file), '')
    }

    expect(listIcons(dir)).toEqual(['a-fill', 'b-fill'])
  })

  it('lists nothing for a folder that does not exist', () => {
    expect(listIcons(path.join(temporaryDir(), 'none'))).toEqual([])
  })
})
