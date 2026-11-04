// Written by chassis-icons from the icons of acme-glyphs. Do not edit: run the build.

import Foundation
#if canImport(UIKit)
import UIKit
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif

/// The icons of the set `acme-glyphs`, in the asset catalog `AcmeGlyphs.xcassets`.
/// The raw value is the name of the icon, the name of its image set, and the end of its
/// class `ag-<name>` on the web.
public enum AgIcon: String, CaseIterable, Sendable {
    case barFill = "bar-fill"
    case barLine = "bar-line"
    case diamondFill = "diamond-fill"
    case diamondLine = "diamond-line"
    case notchFill = "notch-fill"
    case notchLine = "notch-line"
    case ringFill = "ring-fill"
    case ringLine = "ring-line"
}

#if canImport(UIKit)
extension UIImage {
    /// The icon as a template image, which takes the tint color of its view.
    public convenience init(_ icon: AgIcon) {
        self.init(named: icon.rawValue, in: AgIconBundle.bundle, compatibleWith: nil)!
    }
}
#endif

#if canImport(SwiftUI)
extension Image {
    /// The icon as a template image, which takes the foreground style of its view.
    public init(_ icon: AgIcon) {
        self.init(icon.rawValue, bundle: AgIconBundle.bundle)
    }
}
#endif

/// The bundle of the asset catalog: that of the Swift package, or that of the target that
/// the files of the archive are added to.
private final class AgIconBundle {
    static var bundle: Bundle {
        #if SWIFT_PACKAGE
        return Bundle.module
        #else
        return Bundle(for: AgIconBundle.self)
        #endif
    }
}
