---
'@chassis-ui/icons': minor
---

**Breaking.** A repository of icons no longer commits `dist/`: the release builds it. The
`.gitignore` that `init` writes names `dist/`, and its release workflow runs `build` after
`verify`, so that npm and the archives get the files of that build. `verify` no longer compares
`dist/`: it builds the set twice and fails when the two builds differ, fails when
`codepoints.json`, the README or a field of `package.json` that the build writes is not what the
source builds, and reads the code points of the last tag from `codepoints.json`. `files` of
`package.json` is `dist/icons.json`, `dist/svgs` and `dist/web`: an app takes the files of its
platform from the archives. In a repository made earlier, run `chassis-icons init --check`,
write `.gitignore` and the release workflow again with `init --only <file…> --force`, and remove
`dist/` from Git with `git rm -r --cached dist`.
