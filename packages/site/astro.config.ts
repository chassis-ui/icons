import { defineConfig } from 'astro/config'
import { loadConfig } from '@chassis-ui/docs'
import { chassisDocs } from '@chassis-ui/docs/integration'
import { chassis } from './src/libs/astro'
import { siteConfigSchema } from './src/libs/config'

const root = import.meta.dirname
const config = loadConfig({ root, schema: siteConfigSchema })

// https://astro.build/config
export default defineConfig({
  outDir: '../../_site',
  build: {
    // The files of the build are written to _site/icons/static/astro/ and requested as
    // /icons/static/astro/…, which chassis-ui.com routes to this site by path. Under /static
    // it routes by the `Referer` header, and that of a script another script imports names no
    // site. The shared files stay on /static. Keep this folder in every name pattern below.
    assets: `icons/static/astro`
  },
  integrations: [chassisDocs({ config }), ...chassis({ config, root })],
  vite: {
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: `icons/static/astro/docs.[hash].js`,
              chunkFileNames: 'icons/static/astro/docs.[hash].js'
              // assetFileNames: 'icons/static/astro/docs.[hash][extname]'
            }
          }
        }
      }
    },
    // Required for CSS files
    build: {
      rolldownOptions: {
        output: {
          assetFileNames: 'icons/static/astro/docs.[hash][extname]'
        }
      }
    }
    // The integration adds the fallback `_chassis-tokens.scss` of `@chassis-ui/css` as a Sass
    // load path. For a custom override in `src/scss`, add that folder:
    // css: { preprocessorOptions: { scss: { loadPaths: [path.resolve(root, 'src/scss')] } } }
  }
})
