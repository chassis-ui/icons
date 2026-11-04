import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { convertIcon, drawableName } from '../lib/android.js'
import { loadConfig, resolveConfig } from '../lib/config.js'
import { checkSwiftCases, swiftCase, swiftNames } from '../lib/ios.js'
import { fixtureDir, goldenDir, listFiles } from './helpers.js'

const config = loadConfig(fixtureDir)

/**
 * @param {Record<string, any>} build - Settings of chassis.build beside a name and a prefix
 */
function configWith(build) {
  return resolveConfig({ chassis: { build: { name: 'marks', prefix: 'mk', ...build } } }, '/set')
}

describe('the targets of the configuration', () => {
  it('are none but the web by default, and in a fixed order', () => {
    expect(configWith({}).targets).toEqual([])
    expect(configWith({ targets: ['android', 'ios'] }).targets).toEqual(['ios', 'android'])
  })

  it.each([[['web']], [['ios', 'ios']], ['ios'], [['react']]])('refuse %j', (targets) => {
    expect(() => configWith({ targets })).toThrow('"targets" has to be a list of ios, android')
  })
})

describe('the ios target', () => {
  it('names the module after the font, and the enum after the prefix', () => {
    expect(swiftNames(config)).toEqual({
      module: 'AcmeGlyphs',
      type: 'AgIcon',
      catalog: 'AcmeGlyphs.xcassets',
      swiftFile: 'AcmeGlyphs.swift'
    })
  })

  it('names a case in camelCase, between backticks when it is a word of Swift', () => {
    expect(swiftCase('arrow-up-right-outline')).toBe('arrowUpRightOutline')
    expect(swiftCase('arrow-2')).toBe('arrow2')
    expect(swiftCase('repeat')).toBe('`repeat`')
    expect(swiftCase('default')).toBe('`default`')
  })

  it('refuses two icons with one case, and a case that the enum has', () => {
    expect(() => checkSwiftCases(['arrow-2', 'arrow2'])).toThrow(
      'The icons "arrow-2" and "arrow2" would both be the Swift case arrow2'
    )
    expect(() => checkSwiftCases(['all-cases'])).toThrow('which the Swift enum has')
    expect(() => checkSwiftCases(['repeat', 'repeat-fill'])).not.toThrow()
  })

  it('writes an image set per icon that keeps its vector and renders as a template', () => {
    const catalog = path.join(goldenDir, 'dist/ios/AcmeGlyphs.xcassets')
    const set = JSON.parse(
      fs.readFileSync(path.join(catalog, 'bar-fill.imageset/Contents.json'), 'utf8')
    )

    expect(set).toEqual({
      images: [{ filename: 'bar-fill.svg', idiom: 'universal' }],
      info: { author: 'xcode', version: 1 },
      properties: {
        'preserves-vector-representation': true,
        'template-rendering-intent': 'template'
      }
    })
    expect(fs.readFileSync(path.join(catalog, 'bar-fill.imageset/bar-fill.svg'))).toEqual(
      fs.readFileSync(path.join(goldenDir, 'dist/svgs/bar-fill.svg'))
    )
    expect(listFiles(catalog).filter((file) => file.endsWith('.svg'))).toHaveLength(8)
  })

  it('writes the enum of the icons, and the images of UIKit and SwiftUI', () => {
    const swift = fs.readFileSync(path.join(goldenDir, 'dist/ios/AcmeGlyphs.swift'), 'utf8')

    expect(swift).toContain('public enum AgIcon: String, CaseIterable, Sendable {')
    expect(swift).toContain('    case barFill = "bar-fill"\n')
    expect(swift).toContain('public convenience init(_ icon: AgIcon)')
    expect(swift).toContain('public init(_ icon: AgIcon)')
    expect(swift).toContain('#if SWIFT_PACKAGE\n        return Bundle.module')
  })
})

describe('the android target', () => {
  it('names a drawable after the class of the icon', () => {
    expect(drawableName(config, 'bar-fill')).toBe('ag_bar_fill')
    expect(drawableName(configWith({ prefix: 'ac-me' }), 'arrow-2')).toBe('ac_me_arrow_2')
  })

  it('converts an icon to a vector drawable on its frame, filled black for a tint', async () => {
    const xml = await convertIcon(
      'bar-fill',
      fs.readFileSync(path.join(goldenDir, 'dist/svgs/bar-fill.svg'), 'utf8')
    )

    expect(xml).toBe(
      fs.readFileSync(path.join(goldenDir, 'dist/android/res/drawable/ag_bar_fill.xml'), 'utf8')
    )
    expect(xml).toContain('android:viewportWidth="16"')
    expect(xml).toContain('android:fillColor="#FF000000"')
    expect(xml.endsWith('</vector>\n')).toBe(true)
  })

  it('refuses a file that draws nothing', async () => {
    await expect(
      convertIcon('empty', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"/>')
    ).rejects.toThrow('empty.svg converts to a vector drawable that draws nothing')
  })
})
