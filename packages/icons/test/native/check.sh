#!/usr/bin/env bash
#
# Compiles the output of the ios and android targets of a repository of icons with the tools
# of the platforms, which Vitest does not have. Run it after a change to lib/ios.js,
# lib/android.js or their output.
#
#   packages/icons/test/native/check.sh <repository> [ios] [android]
#
#   <repository>  A repository of icons, built, with dist/ at its root.
#
#   ios      Compiles each asset catalog of dist/ios/ with actool and checks that it holds a
#            template image per image set, and type-checks the Swift files in the Swift 5 and
#            the Swift 6 language mode. Needs Xcode.
#   android  Compiles dist/android/res/ with aapt2 and links it against android.jar, and
#            checks that R.drawable has a drawable per file. Looks for the newest build tools
#            and platform of ANDROID_HOME, or ANDROID_SDK_ROOT; AAPT2 and ANDROID_JAR name
#            them.
#
# Without a target it checks those that dist/ has. It writes to a temporary folder only.

set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

[ $# -ge 1 ] && [ -d "$1/dist" ] || fail 'the first argument is a built repository of icons'

repository="$(cd "$1" && pwd)"
shift
targets=("$@")

if [ ${#targets[@]} -eq 0 ]; then
  for target in ios android; do
    [ -d "$repository/dist/$target" ] && targets+=("$target")
  done
fi

[ ${#targets[@]} -gt 0 ] || { echo "No ios or android output in $repository/dist."; exit 0; }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

check_ios() {
  local dir="$repository/dist/ios"
  # SVG files in an asset catalog need iOS 13
  local deployment_target=13.0
  local sdk

  [ -d "$dir" ] || fail "no $dir: add ios to the targets of chassis.build and build"
  xcrun --find actool >/dev/null 2>&1 || fail 'no actool: install Xcode and select it'
  sdk="$(xcrun --sdk iphonesimulator --show-sdk-path)"

  for catalog in "$dir"/*.xcassets; do
    local out="$work/$(basename "$catalog" .xcassets)"
    local sets templates

    mkdir -p "$out"
    xcrun actool --compile "$out" --platform iphonesimulator \
      --minimum-deployment-target "$deployment_target" --errors --warnings \
      --output-format human-readable-text "$catalog" >"$out/actool.txt" 2>&1 ||
      { cat "$out/actool.txt"; fail "actool does not compile $catalog"; }
    if grep -q 'warning:' "$out/actool.txt"; then
      cat "$out/actool.txt"
      fail "actool warns about $catalog"
    fi

    sets="$(find "$catalog" -maxdepth 1 -name '*.imageset' | wc -l | tr -d ' ')"
    # One name per image set, rendered at each scale, each in the mode of a template
    templates="$(xcrun assetutil --info "$out/Assets.car" | python3 -c '
import json, sys
print(len({a["Name"] for a in json.load(sys.stdin) if a.get("Template Mode") == "template"}))')"
    [ "$sets" -eq "$templates" ] ||
      fail "$catalog has $sets image sets, and the compiled catalog $templates template images"
    echo "✓ $(basename "$catalog"): $sets template images"
  done

  for mode in 5 6; do
    xcrun --sdk iphonesimulator swiftc -typecheck -parse-as-library -swift-version "$mode" \
      -target "arm64-apple-ios$deployment_target-simulator" -sdk "$sdk" "$dir"/*.swift ||
      fail "the Swift files do not type-check in the Swift $mode language mode"
  done
  echo '✓ The Swift files type-check in the Swift 5 and 6 language modes'
}

newest() {
  { find "$1" -mindepth 2 -maxdepth 2 -name "$2" 2>/dev/null || true; } | sort -V | tail -1
}

check_android() {
  local res="$repository/dist/android/res"
  local sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  local aapt2 android_jar files linked

  [ -d "$res" ] || fail "no $res: add android to the targets of chassis.build and build"
  aapt2="${AAPT2:-$(command -v aapt2 || true)}"
  [ -n "$aapt2" ] || aapt2="$(newest "$sdk/build-tools" aapt2)"
  [ -n "$aapt2" ] || fail 'no aapt2: set ANDROID_HOME to the Android SDK, or AAPT2'
  android_jar="${ANDROID_JAR:-$(newest "$sdk/platforms" android.jar)}"
  [ -n "$android_jar" ] || fail 'no android.jar: set ANDROID_HOME, or ANDROID_JAR'

  "$aapt2" compile --dir "$res" -o "$work/res.zip"
  printf '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="check.icons"/>\n' \
    >"$work/AndroidManifest.xml"
  "$aapt2" link -I "$android_jar" --manifest "$work/AndroidManifest.xml" -o "$work/out.apk" \
    --java "$work/gen" "$work/res.zip"

  files="$(find "$res/drawable" -name '*.xml' | wc -l | tr -d ' ')"
  linked="$(sed -n '/class drawable/,/}/p' "$work/gen/check/icons/R.java" | grep -c 'public static final int' || true)"
  [ "$files" -eq "$linked" ] || fail "$res has $files drawables, and R.drawable $linked"
  echo "✓ res/: $files vector drawables compile and link"
}

for target in "${targets[@]}"; do
  case "$target" in
    ios) check_ios ;;
    android) check_android ;;
    *) fail "no target $target: ios or android" ;;
  esac
done
