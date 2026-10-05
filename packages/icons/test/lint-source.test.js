import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadConfig } from '../build/config.js'
import { lintPairs, lintSource, lintSvg } from '../build/lint-source.js'
import { copyFixture, fixtureDir } from './helpers.js'

const svg = (inner, attributes = 'width="16" height="16" viewBox="0 0 16 16"') =>
  `<svg ${attributes} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`

describe('lintSvg', () => {
  it('finds nothing wrong with a drawing in one color on the frame', () => {
    expect(lintSvg(svg('<path d="M1 1h14v14H1z" fill="#000"/>'), 16)).toEqual([])
    expect(
      lintSvg(svg('<path d="M1 1h14v14H1z"/>', 'viewBox="0 0 16 16" fill="currentColor"'), 16)
    ).toEqual([])
  })

  it('takes "none" as no color, and two ways to write one color as one', () => {
    const drawing = svg(
      '<path d="M1 1h14v14H1z" fill="#000"/><path d="M2 2h2v2H2z" style="fill: #000000"/>',
      'viewBox="0 0 16 16" fill="none"'
    )

    expect(lintSvg(drawing, 16)).toEqual([])
  })

  it.each([
    [
      'another frame',
      svg('<path d="M0 0h24v24H0z"/>', 'viewBox="0 0 24 24"'),
      'has the viewBox "0 0 24 24"'
    ],
    ['no viewBox', svg('<path d="M0 0h16v16H0z"/>', 'width="16" height="16"'), 'has no viewBox'],
    [
      'another width',
      svg('<path d="M0 0h16v16H0z"/>', 'width="32" height="16" viewBox="0 0 16 16"'),
      'has the width "32"'
    ],
    [
      'two colors',
      svg('<path d="M0 0h8v8H0z" fill="#000"/><path d="M8 8h8v8H8z" fill="#f00"/>'),
      'has 2 colors (#000, #f00)'
    ],
    [
      'a color in a style',
      svg('<path d="M0 0h8v8H0z" fill="#000"/><path d="M8 8h8v8H8z" style="fill:red"/>'),
      'has 2 colors'
    ],
    ['a stroke', svg('<path d="M2 2L14 14" stroke="#000"/>'), 'has a stroke'],
    [
      'a gradient',
      svg('<linearGradient id="a"/><path d="M0 0h16v16H0z" fill="url(#a)"/>'),
      'holds a gradient'
    ],
    [
      'a raster image',
      svg('<image href="data:image/png;base64,AAAA" width="16" height="16"/>'),
      'holds a raster image'
    ],
    ['a script', svg('<script>alert(1)</script><path d="M0 0h16v16H0z"/>'), 'holds a script'],
    [
      'an event handler',
      svg('<path d="M0 0h16v16H0z" onclick="alert(1)"/>'),
      'has the event handler "onclick"'
    ],
    ['markup that is not SVG', '<svg><path></svg', 'is not an SVG file']
  ])('refuses %s', (_case, drawing, message) => {
    expect(lintSvg(drawing, 16).join('\n')).toContain(message)
  })
})

describe('lintPairs', () => {
  const config = loadConfig(fixtureDir)

  it('finds an icon that comes in one style of a pair only', () => {
    expect(lintPairs(['bar-fill', 'bar-line', 'ring-line'], config)).toEqual([
      {
        file: 'ring-line.svg',
        message: 'has no "ring-fill" beside it: line and fill come together'
      }
    ])
  })

  it('leaves the styles alone that are in no pair', () => {
    expect(lintPairs(['acme-mark'], { ...config, styles: ['line', 'fill', 'mark'] })).toEqual([])
  })
})

describe('lintSource', () => {
  it('finds nothing wrong with the fixture set', () => {
    expect(lintSource(loadConfig(fixtureDir))).toEqual({ icons: 8, problems: [] })
  })

  it('refuses a file name that cannot be a class', () => {
    const dir = copyFixture()

    fs.renameSync(path.join(dir, 'source/bar-fill.svg'), path.join(dir, 'source/Bar_Filled.svg'))

    const { problems } = lintSource(loadConfig(dir))

    expect(problems).toContainEqual({
      file: 'Bar_Filled.svg',
      message: expect.stringContaining('kebab-case')
    })
  })

  it('refuses a name that ends in no style of the set', () => {
    const dir = copyFixture()

    fs.copyFileSync(path.join(dir, 'source/bar-fill.svg'), path.join(dir, 'source/bar-duotone.svg'))

    expect(lintSource(loadConfig(dir)).problems).toEqual([
      { file: 'bar-duotone.svg', message: 'does not end in a style: -line, -fill' }
    ])
  })

  it('refuses a file that is not an SVG file', () => {
    const dir = copyFixture()

    fs.writeFileSync(path.join(dir, 'source/bar-fill.png'), '')

    expect(lintSource(loadConfig(dir)).problems).toEqual([
      { file: 'bar-fill.png', message: expect.stringContaining('is not an SVG file') }
    ])
  })
})
