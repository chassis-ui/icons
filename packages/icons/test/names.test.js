import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { compareNames, listIcons, parseName } from '../build/names.js'
import { temporaryDir } from './helpers.js'

describe('parseName', () => {
  const styles = ['outline', 'solid', 'brand']

  it('splits a name into what it shows and its style', () => {
    expect(parseName('arrow-right-solid', styles)).toEqual({ base: 'arrow-right', style: 'solid' })
    expect(parseName('figma-brand', styles)).toEqual({ base: 'figma', style: 'brand' })
    expect(parseName('h1-outline', styles)).toEqual({ base: 'h1', style: 'outline' })
  })

  it('takes any kebab-case name when the set has no styles', () => {
    expect(parseName('arrow-right', [])).toEqual({ base: 'arrow-right', style: null })
  })

  it('finds the longest style that a name ends in', () => {
    expect(parseName('drop-half-fill', ['fill', 'half-fill'])).toEqual({
      base: 'drop',
      style: 'half-fill'
    })
  })

  it.each([
    'Star_Filled',
    'star--solid',
    '-star-solid',
    'star-solid-',
    '1star-solid',
    'star solid'
  ])('refuses %s, which is not in kebab-case', (name) => {
    expect(parseName(name, styles)).toHaveProperty('error', expect.stringContaining('kebab-case'))
  })

  it.each(['star', 'star-filled', 'solid'])('refuses %s, which ends in no style', (name) => {
    expect(parseName(name, styles)).toHaveProperty('error', expect.stringContaining('-outline'))
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

    for (const file of ['b-solid.svg', 'a-solid.svg', 'notes.txt', '.DS_Store']) {
      fs.writeFileSync(path.join(dir, file), '')
    }

    expect(listIcons(dir)).toEqual(['a-solid', 'b-solid'])
  })

  it('lists nothing for a folder that does not exist', () => {
    expect(listIcons(path.join(temporaryDir(), 'none'))).toEqual([])
  })
})
