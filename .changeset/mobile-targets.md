---
'@chassis-ui/icons': minor
---

`targets` of `chassis.build` names the targets of a set besides the web: `ios` and `android`.
`ios` writes `dist/ios/`, an asset catalog `<Module>.xcassets` with one template vector image
per icon, named as the icon, and `<Module>.swift`, the enum `<Prefix>Icon` of the icons with
`UIImage(_:)` and SwiftUI `Image(_:)`, which an app adds to its target. `android` writes `dist/android/res/drawable/<prefix>_<name>.xml`, one vector drawable per icon,
with svg2vectordrawable. The build has the steps `ios` and `android`, and `archive` writes
`<font>-ios-<version>.zip` and `<font>-android-<version>.zip` beside
`<font>-web-<version>.zip`. A set without `targets` builds as before. The `AGENTS.md` that
`init` writes names the targets: run `chassis-icons init --check` in a repository made
earlier.
