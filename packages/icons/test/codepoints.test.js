import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  allocate,
  checkAgainstBaseline,
  checkRegistry,
  emptyRegistry,
  formatRegistry,
  parseRegistry,
  readRegistry,
  toHex
} from '../build/codepoints.js'
import { temporaryDir } from './helpers.js'

const START = 0xe900

describe('allocate', () => {
  it('gives the icons of a new set the first code points, in the order of their names', () => {
    const { registry, added, removed } = allocate(emptyRegistry(), ['b', 'c', 'a'], START)

    expect(registry).toEqual({ icons: { a: 0xe900, b: 0xe901, c: 0xe902 }, retired: [] })
    expect(added).toEqual(['a', 'b', 'c'])
    expect(removed).toEqual([])
  })

  it('keeps the code point and the place of an icon, and adds a new icon at the end', () => {
    const before = { icons: { b: 0xe900, c: 0xe901 }, retired: [] }
    const { registry, added } = allocate(before, ['a', 'b', 'c'], START)

    expect(Object.entries(registry.icons)).toEqual([
      ['b', 0xe900],
      ['c', 0xe901],
      ['a', 0xe902]
    ])
    expect(added).toEqual(['a'])
  })

  it('retires the code point of an icon that is gone', () => {
    const before = { icons: { a: 0xe900, b: 0xe901, c: 0xe902 }, retired: [] }
    const { registry, removed } = allocate(before, ['a', 'c'], START)

    expect(registry).toEqual({ icons: { a: 0xe900, c: 0xe902 }, retired: [0xe901] })
    expect(removed).toEqual(['b'])
  })

  it('never gives out a retired code point again', () => {
    const before = { icons: { a: 0xe900, c: 0xe902 }, retired: [0xe901] }
    const { registry } = allocate(before, ['a', 'b', 'c'], START)

    expect(registry.icons.b).toBe(0xe903)
  })

  it('gives an icon that comes back a new code point', () => {
    const first = allocate({ icons: { a: 0xe900, b: 0xe901 }, retired: [] }, ['a'], START)
    const second = allocate(first.registry, ['a', 'b'], START)

    expect(second.registry).toEqual({ icons: { a: 0xe900, b: 0xe902 }, retired: [0xe901] })
  })

  it('does not change the registry it is given', () => {
    const before = { icons: { a: 0xe900 }, retired: [] }

    allocate(before, ['b'], START)
    expect(before).toEqual({ icons: { a: 0xe900 }, retired: [] })
  })

  it('stops at the end of the Private Use Area', () => {
    expect(() => allocate(emptyRegistry(), ['a', 'b'], 0xf8ff)).toThrow(
      'no code point left for "b"'
    )
  })
})

describe('the registry file', () => {
  it('holds the code points in hexadecimal, and reads back as it was written', () => {
    const registry = { icons: { a: 0xe900, b: 0xf101 }, retired: [0xe901] }
    const file = formatRegistry(registry)

    expect(JSON.parse(file)).toEqual({ icons: { a: 'e900', b: 'f101' }, retired: ['e901'] })
    expect(file.endsWith('}\n')).toBe(true)
    expect(parseRegistry(JSON.parse(file))).toEqual(registry)
  })

  it('is the registry of a new set when it does not exist', () => {
    expect(readRegistry(path.join(temporaryDir(), 'codepoints.json'))).toEqual(emptyRegistry())
  })

  it('refuses a code point that is not four hexadecimal digits', () => {
    const file = path.join(temporaryDir(), 'codepoints.json')

    fs.writeFileSync(file, JSON.stringify({ icons: { a: 59648 }, retired: [] }))
    expect(() => readRegistry(file)).toThrow('"a" has to be a code point')
  })
})

describe('checkRegistry', () => {
  it('finds nothing wrong with the registry that the build writes', () => {
    const { registry } = allocate({ icons: { a: 0xe900 }, retired: [0xe901] }, ['a', 'b'], START)

    expect(checkRegistry(registry)).toEqual([])
  })

  it('finds two icons with one code point', () => {
    expect(checkRegistry({ icons: { a: 0xe900, b: 0xe900 }, retired: [] })).toEqual([
      '"b" and "a" share the code point e900'
    ])
  })

  it('finds a code point outside the Private Use Area', () => {
    expect(checkRegistry({ icons: { a: 0x41 }, retired: [] })).toEqual([
      '"a" has the code point 0041, outside the Private Use Area'
    ])
  })

  it('finds an icon on a retired code point', () => {
    expect(checkRegistry({ icons: { a: 0xe900 }, retired: [0xe900] })).toEqual([
      '"a" has the code point e900, which is retired'
    ])
  })
})

describe('checkAgainstBaseline', () => {
  const baseline = { a: 0xe900, b: 0xe901 }

  it('finds nothing when the icons kept their code points, with icons added and removed', () => {
    expect(
      checkAgainstBaseline({ icons: { a: 0xe900, c: 0xe902 }, retired: [0xe901] }, baseline)
    ).toEqual([])
  })

  it('finds an icon that moved', () => {
    expect(
      checkAgainstBaseline({ icons: { a: 0xe905, b: 0xe901 }, retired: [] }, baseline)
    ).toEqual(['"a" moved from the code point e900 to e905'])
  })

  it('finds an icon on the code point of a removed one', () => {
    expect(
      checkAgainstBaseline({ icons: { a: 0xe900, c: 0xe901 }, retired: [] }, baseline)
    ).toEqual(['"c" has the code point e901, which "b" had'])
  })
})

describe('toHex', () => {
  it('writes four digits', () => {
    expect(toHex(0xf101)).toBe('f101')
    expect(toHex(0x41)).toBe('0041')
  })
})
