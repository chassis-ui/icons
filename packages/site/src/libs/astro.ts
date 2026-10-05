import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import type { AstroIntegration } from 'astro'
import {
  getChassisAssetsFsPath,
  getChassisCSSFsPath,
  getChassisIconsFsPath
} from '@chassis-ui/docs'
import type { SiteConfig } from './config'
import { copyIconSet, getSetFiles, loadIconSet, type IconSet } from './set'

// Static file paths that will be aliased (copied) to a different destination path.
const staticFileAliases = {
  '/images/apple-touch-icon.png': '/apple-touch-icon.png',
  '/images/favicon.png': '/favicon.ico'
}

// Pages excluded from the generated sitemap.
const sitemapExcludes = ['/404', '/docs']

/**
 * Returns the site's own Astro integrations, added after `chassisDocs()` of `@chassis-ui/docs`.
 *
 * Includes the `chassis-integration` (static file copying, and the icon set of the repository
 * as `virtual:icon-set`), MDX support, the sitemap generator, and a post-process integration
 * that lists the sitemap under the site's path.
 */
export function chassis({
  config,
  root
}: {
  config: SiteConfig
  root: string
}): AstroIntegration[] {
  const sitemapExcludedUrls = sitemapExcludes.map((url) => `${config.baseURL}${url}/`)
  const publicDir = path.join(root, 'public')

  // `astro check` / `astro sync` doesn't need static assets copied into _site.
  // Track the command so the config:done hook can skip expensive file copies.
  let cmd = 'dev'
  let outDir = path.join(root, 'dist')

  return [
    {
      name: 'chassis-integration',
      hooks: {
        'astro:config:setup': ({ addWatchFile, command, config: astroConfig, updateConfig }) => {
          cmd = command
          outDir = fileURLToPath(astroConfig.outDir)
          // Reload the config when the integration is modified.
          addWatchFile(path.join(root, 'src/libs/astro.ts'))
          addWatchFile(path.join(root, 'src/libs/set.ts'))

          // The pages show the set that the build of the repository wrote. Reload when the
          // configuration of the set or its output changes: `pnpm icons` writes both.
          const set = loadIconSet(root, config.exampleIcon)

          for (const file of getSetFiles(root)) {
            addWatchFile(file)
          }

          updateConfig({ vite: { plugins: [virtualIconSet(set)] } })
        },
        'astro:config:done': () => {
          if (cmd === 'sync') return
          cleanPublicDirectory(publicDir)
          copyStatic(path.join(root, 'static'), publicDir)
          copyChassisAssets(root, publicDir)
          copyChassisCSS(root, publicDir)
          copyChassisIcons(root, publicDir)
          copyIconSet(root, publicDir)
          aliasStatic(root, publicDir)
          copyPagefindIndex(outDir, publicDir)
        }
      }
    },
    // https://github.com/withastro/astro/issues/6475
    mdx() as AstroIntegration,
    sitemap({
      filter: (page) => !sitemapExcludedUrls.includes(page)
    }),
    {
      // Must run after `@astrojs/sitemap` writes `sitemap-index.xml`.
      name: 'chassis-sitemap-postprocess',
      hooks: {
        'astro:build:done': ({ dir }) => {
          const builtDir = fileURLToPath(dir)

          removeRedirectsFromSitemap(builtDir)
          rebaseSitemapIndex(builtDir, config.baseURL)
        }
      }
    }
  ]
}

/**
 * Gives the icon set of the repository to the pages, as the default export of
 * `virtual:icon-set`. The pages are bundled, and cannot read the files of the set themselves.
 */
function virtualIconSet(set: IconSet) {
  const id = 'virtual:icon-set'

  return {
    name: 'chassis-icons:virtual',
    resolveId(source: string) {
      return source === id ? `\0${id}` : undefined
    },
    load(resolved: string) {
      return resolved === `\0${id}` ? `export default ${JSON.stringify(set)}` : undefined
    }
  }
}

/**
 * Removes the redirect pages from the sitemaps: the pages of `aliases` in the frontmatter and
 * `/`. `@astrojs/sitemap` lists every page that was built, and a redirect is not a page to
 * index. Those outside `/icons/` do not exist on chassis-ui.com at all.
 */
function removeRedirectsFromSitemap(outDir: string) {
  const sitemaps = fs.readdirSync(outDir).filter((file) => /^sitemap-\d+\.xml$/.test(file))

  for (const file of sitemaps) {
    const sitemapPath = path.join(outDir, file)
    const content = fs.readFileSync(sitemapPath, 'utf8')

    const updated = content.replace(/<url><loc>([^<]+)<\/loc>.*?<\/url>/g, (entry, loc: string) => {
      const page = path.join(outDir, decodeURIComponent(new URL(loc).pathname), 'index.html')
      const isRedirect =
        fs.existsSync(page) && fs.readFileSync(page, 'utf8').includes('<meta http-equiv="refresh"')

      return isRedirect ? '' : entry
    })

    fs.writeFileSync(sitemapPath, updated)
  }
}

/**
 * Rewrites the sitemaps listed in `sitemap-index.xml` to the URLs they are served from.
 *
 * `@astrojs/sitemap` lists them at the origin, `https://chassis-ui.com/sitemap-0.xml`, which is
 * the sitemap of the main site. This site is proxied under the path of `baseURL`, so its own
 * sitemap is `https://chassis-ui.com/icons/sitemap-0.xml`.
 */
function rebaseSitemapIndex(outDir: string, baseURL: string) {
  const sitemapIndexPath = path.join(outDir, 'sitemap-index.xml')
  if (!fs.existsSync(sitemapIndexPath)) return

  const origin = new URL(baseURL).origin
  const base = baseURL.replace(/\/$/, '')
  const content = fs.readFileSync(sitemapIndexPath, 'utf8')

  fs.writeFileSync(
    sitemapIndexPath,
    content.replaceAll(`<loc>${origin}/sitemap-`, `<loc>${base}/sitemap-`)
  )
}

/**
 * Copies the previously-generated Pagefind search index from `_site/icons/pagefind/`
 * into `public/icons/pagefind/` so `astro dev` can serve search at `/icons/pagefind/`,
 * matching the path prefix this site is proxied under in production.
 * No-op if no production build has been run yet — dev simply returns no results.
 */
function copyPagefindIndex(outDir: string, publicDir: string) {
  const source = path.join(outDir, 'icons', 'pagefind')
  if (!fs.existsSync(source)) return
  const destination = path.join(publicDir, 'icons', 'pagefind')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

/**
 * Deletes the contents of the `public/` directory before each dev/build run so
 * stale vendor assets (CSS, icons, images) from a previous build are removed.
 * The directory itself is preserved to avoid ENOTEMPTY errors on the root.
 * Errors on individual entries are intentionally swallowed — the directory may
 * contain locked or read-only files in some environments.
 */
function cleanPublicDirectory(dir: string) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry)
    try {
      fs.rmSync(entryPath, { force: true, recursive: true })
    } catch {
      // ignore
    }
  }
}

/**
 * Copies the Chassis assets package output into `public/static/`.
 */
function copyChassisAssets(root: string, publicDir: string) {
  const source = getChassisAssetsFsPath({ root })
  const destination = path.join(publicDir, 'static')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

/**
 * Copies the compiled Chassis CSS bundle into `public/static/`.
 */
function copyChassisCSS(root: string, publicDir: string) {
  const source = getChassisCSSFsPath({ root })
  const destination = path.join(publicDir, 'static')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

/**
 * Copies the `icons/` folder of the installed `@chassis-ui/icons` into `public/static/icons/`
 * so icons are served from `/static/icons/`. The layouts and the components of
 * `@chassis-ui/docs` draw the interface of the site with them, as on every Chassis site. They
 * are not the set that the site shows: `copyIconSet()` serves that one from a path of its own.
 */
function copyChassisIcons(root: string, publicDir: string) {
  const source = path.join(getChassisIconsFsPath({ root }), 'icons')
  const destination = path.join(publicDir, 'static', 'icons')

  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

/**
 * Copies the contents of the `static/` source directory into `public/`
 * so files are served from the root URL (`/`).
 */
function copyStatic(source: string, publicDir: string) {
  fs.mkdirSync(publicDir, { recursive: true })
  fs.cpSync(source, publicDir, { recursive: true })
}

/**
 * Copies select static files from the Chassis assets package to alternative
 * destination paths (e.g. `apple-touch-icon.png` → `/apple-touch-icon.png`).
 */
function aliasStatic(root: string, publicDir: string) {
  const source = getChassisAssetsFsPath({ root })

  for (const [aliasSource, aliasDestination] of Object.entries(staticFileAliases)) {
    fs.cpSync(path.join(source, aliasSource), path.join(publicDir, aliasDestination))
  }
}
