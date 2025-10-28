import { defineConfig } from 'astro/config'
import { chassis } from './src/libs/astro'
import { getConfig } from './src/libs/config'
import { algoliaPlugin } from './src/plugins/algolia-plugin'
import { stackblitzPlugin } from './src/plugins/stackblitz-plugin'
import { getSiteUrl } from '@chassis-ui/docs'

const site = getSiteUrl(getConfig())

// https://astro.build/config
export default defineConfig({
  outDir: '../_site',
  build: {
    assets: `assets`
  },
  integrations: [chassis()],
  markdown: {
    smartypants: false,
    syntaxHighlight: 'prism'
  },
  site,
  vite: {
    plugins: [algoliaPlugin(), stackblitzPlugin()],
    ssr: {
      noExternal: ['@astrojs/prism']
    },
    build: {
      rollupOptions: {
        output: {
          // chunkFileNames: 'static/js/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'static/icons-docs/docs.[hash].css'
            }
            return 'static/icons-docs/[name].[hash][extname]'
          }
        }
      }
    }
  }
})
