/**
 * @file The `ios` target: `dist/ios/`, an Xcode asset catalog with one vector image set per
 * icon, which renders as a template in the tint of its view as `currentcolor` does on the
 * web, and a Swift file with an enum of the icons and the initializers of `UIImage` and
 * SwiftUI `Image` that draw one. An app adds both from the archive of a release. The image
 * sets are named as the icons are, so `bell-outline` is the image `bell-outline` and the case
 * `bellOutline`. The Swift file finds the catalog in `Bundle.module` when it is built in a
 * Swift package, so a later Swift package of the folder needs no other file.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

/** What every `Contents.json` of a catalog ends with, as Xcode writes it. */
const CATALOG_INFO = { info: { author: 'xcode', version: 1 } }

/** The first line of a file that the build writes for iOS. */
const GENERATED = '// Written by chassis-icons'

/** Words that a Swift declaration takes only between backticks. */
const SWIFT_KEYWORDS = new Set(
  (
    'associatedtype borrowing class consuming deinit enum extension fileprivate func import init ' +
    'inout internal let nonisolated open operator private precedencegroup protocol public ' +
    'rethrows static struct subscript typealias var break case catch continue default defer do ' +
    'else fallthrough for guard if in repeat return throw switch where while as await false is ' +
    'nil self super throws true try'
  ).split(' ')
)

/** Names of the enum that a case cannot have: `CaseIterable` declares it. */
const SWIFT_MEMBERS = new Set(['allCases'])

/**
 * @param {string} name - A name in kebab-case
 * @returns {string} The name in PascalCase: `acme-glyphs` is `AcmeGlyphs`
 */
export function toPascalCase(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * The names of the Swift side of a set: the module, which is the name of the library, the
 * target and the catalog, and the enum of the icons, which follows the prefix as the class
 * of the font and the name of a drawable do.
 * @param {import('./config.js').Config} config
 * @returns {{ module: string, type: string, catalog: string, swiftFile: string }}
 */
export function swiftNames(config) {
  const module = toPascalCase(config.name)

  return {
    module,
    type: `${toPascalCase(config.prefix)}Icon`,
    catalog: `${module}.xcassets`,
    swiftFile: `${module}.swift`
  }
}

/**
 * The case of an icon in the enum: its name in camelCase, between backticks when it is a word
 * of Swift.
 * @param {string} name - The name of an icon
 * @returns {string}
 */
export function swiftCase(name) {
  const camel = toPascalCase(name).replace(/^./, (first) => first.toLowerCase())

  return SWIFT_KEYWORDS.has(camel) ? `\`${camel}\`` : camel
}

/**
 * Checks that every icon has a case of its own: `arrow-2` and `arrow2` would both be
 * `arrow2`.
 * @param {string[]} names - The names of the icons
 * @throws {Error} When two icons have one case, or a case is a member of the enum
 */
export function checkSwiftCases(names) {
  /** @type {Map<string, string>} */
  const seen = new Map()

  for (const name of names) {
    const swift = swiftCase(name).replaceAll('`', '')

    if (SWIFT_MEMBERS.has(swift)) {
      throw new Error(`The icon "${name}" would be the case ${swift}, which the Swift enum has`)
    }

    if (seen.has(swift)) {
      throw new Error(
        `The icons "${seen.get(swift)}" and "${name}" would both be the Swift case ${swift}: rename one`
      )
    }

    seen.set(swift, name)
  }
}

/**
 * @param {unknown} value
 * @returns {string} The text of a `Contents.json`
 */
function contents(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

/**
 * The Swift file of the set.
 * @param {import('./config.js').Config} config
 * @param {string[]} names - The names of the icons, sorted
 * @returns {string}
 */
export function renderSwift(config, names) {
  const { type, catalog } = swiftNames(config)
  const bundle = `${type}Bundle.bundle`
  const cases = names.map((name) => `    case ${swiftCase(name)} = "${name}"`)

  return `${GENERATED} from the icons of ${config.name}. Do not edit: run the build.

import Foundation
#if canImport(UIKit)
import UIKit
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif

/// The icons of the set \`${config.name}\`, in the asset catalog \`${catalog}\`.
/// The raw value is the name of the icon, the name of its image set, and the end of its
/// class \`${config.prefix}-<name>\` on the web.
public enum ${type}: String, CaseIterable, Sendable {
${cases.join('\n')}
}

#if canImport(UIKit)
extension UIImage {
    /// The icon as a template image, which takes the tint color of its view.
    public convenience init(_ icon: ${type}) {
        self.init(named: icon.rawValue, in: ${bundle}, compatibleWith: nil)!
    }
}
#endif

#if canImport(SwiftUI)
extension Image {
    /// The icon as a template image, which takes the foreground style of its view.
    public init(_ icon: ${type}) {
        self.init(icon.rawValue, bundle: ${bundle})
    }
}
#endif

/// The bundle of the asset catalog: that of the Swift package, or that of the target that
/// the files of the archive are added to.
private final class ${type}Bundle {
    static var bundle: Bundle {
        #if SWIFT_PACKAGE
        return Bundle.module
        #else
        return Bundle(for: ${type}Bundle.self)
        #endif
    }
}
`
}

/**
 * The files of `dist/ios/`.
 * @param {import('./config.js').Config} config
 * @param {object} options
 * @param {string} options.svgsDir - The optimized SVG files
 * @param {string[]} options.names - The names of the icons, sorted
 * @returns {Promise<Record<string, string>>} The contents of each file, by its path from
 *   `dist/ios/`
 */
export async function renderIos(config, { svgsDir, names }) {
  checkSwiftCases(names)

  const { catalog, swiftFile } = swiftNames(config)
  /** @type {Record<string, string>} */
  const files = { [`${catalog}/Contents.json`]: contents(CATALOG_INFO) }

  for (const name of names) {
    const set = `${catalog}/${name}.imageset`

    files[`${set}/${name}.svg`] = await fs.readFile(path.join(svgsDir, `${name}.svg`), 'utf8')
    files[`${set}/Contents.json`] = contents({
      images: [{ filename: `${name}.svg`, idiom: 'universal' }],
      ...CATALOG_INFO,
      properties: {
        'preserves-vector-representation': true,
        'template-rendering-intent': 'template'
      }
    })
  }

  files[swiftFile] = renderSwift(config, names)
  return files
}
