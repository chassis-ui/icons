import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../build/config.js'
import { minifyCss, renderStylesheets } from '../build/font.js'

const config = resolveConfig(
  {
    name: '@acme/glyphs',
    version: '2.4.0',
    chassis: {
      build: {
        name: 'acme-glyphs',
        prefix: 'ag',
        formats: ['woff2', 'ttf'],
        header: ['Acme Glyphs v{version}', "Copyright Acme & Sons, 'Works'"]
      }
    }
  },
  '/set'
)
const codepoints = { 'bar-fill': 0xe900, 'ring-line': 0xe905 }
const hash = '0123456789abcdef0123456789abcdef'

describe('the CSS template', () => {
  it('writes the header, the font face and one class per icon', async () => {
    const { css } = await renderStylesheets(config, { codepoints, hash })

    expect(
      css.startsWith("/*!\n * Acme Glyphs v2.4.0\n * Copyright Acme & Sons, 'Works'\n */\n")
    ).toBe(true)
    expect(css).toContain('font-family: "acme-glyphs";')
    expect(css).toContain(
      `src: url("./acme-glyphs.woff2?${hash}") format("woff2"),\nurl("./acme-glyphs.ttf?${hash}") format("truetype");`
    )
    expect(css).toContain('[class^="ag-"]::before')
    expect(css).toContain(
      '.ag-bar-fill::before { content: "\\e900"; }\n.ag-ring-line::before { content: "\\e905"; }\n'
    )
  })

  it('writes no empty header', async () => {
    const { css } = await renderStylesheets({ ...config, header: [] }, { codepoints, hash })

    expect(css.startsWith('/*!\n */\n')).toBe(true)
  })
})

describe('the SCSS template', () => {
  it('writes the variables of the font, with every format and the hash', async () => {
    const { scss } = await renderStylesheets(config, { codepoints, hash })

    expect(scss).toContain('$acme-glyphs-font: "acme-glyphs" !default;')
    expect(scss).toContain(`$acme-glyphs-font-hash: "${hash}" !default;`)
    expect(scss).toContain(
      [
        '$acme-glyphs-font-src:',
        '  url("#{$acme-glyphs-font-file}.woff2?#{$acme-glyphs-font-hash}") format("woff2"),',
        '  url("#{$acme-glyphs-font-file}.ttf?#{$acme-glyphs-font-hash}") format("truetype") !default;'
      ].join('\n')
    )
  })

  it('writes the map of the code points and the classes from it', async () => {
    const { scss } = await renderStylesheets(config, { codepoints, hash })

    expect(scss).toContain(
      '$acme-glyphs-map: (\n  "bar-fill": "\\e900",\n  "ring-line": "\\e905",\n);'
    )
    expect(scss).toContain('.ag-#{$icon}::before { content: $codepoint; }')
  })

  it('names one format without a comma', async () => {
    const { scss } = await renderStylesheets(
      { ...config, formats: ['woff2'] },
      { codepoints, hash }
    )

    expect(scss).toContain('font-hash}") format("woff2") !default;')
    expect(scss).not.toContain('format("woff2"),')
  })
})

describe('minifyCss', () => {
  it('keeps the header and the addresses of the font', async () => {
    const { css } = await renderStylesheets(config, { codepoints, hash })
    const minified = minifyCss(css, '/set/icons/acme-glyphs.css')

    expect(minified.startsWith('/*!\n * Acme Glyphs v2.4.0')).toBe(true)
    expect(minified).toContain(`url("acme-glyphs.woff2?${hash}")`)
    expect(minified).toContain('.ag-bar-fill::before{content:"\\e900"}')
    expect(minified.length).toBeLessThan(css.length)
  })
})
