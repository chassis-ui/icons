import path from 'node:path'
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { docsSchema, z } from '@chassis-ui/docs/schema'
import { loadIconSet, loadIcons, toTitle } from './libs/set'

// The page of an icon: the frontmatter of a docs page, with what the build wrote for the icon.
const iconsSchema = docsSchema.extend({
  title: z.string(),
  description: z.string(),
  /** What the icon shows: its name without the style. */
  base: z.string(),
  /** The style it is drawn in, when the set has styles. */
  style: z.string().optional(),
  categories: z.string().array(),
  tags: z.string().array(),
  /** The code point of the icon in the font, in hexadecimal. */
  codepoint: z.string(),
  /** The optimized SVG file. */
  svg: z.string()
})

// One entry per icon of the output of the build, so the site has a page for each icon of
// the set and for no other. An icon is added by building it: there is no page to write.
const iconsCollection = defineCollection({
  loader: () => {
    const siteRoot = path.resolve(import.meta.dirname, '..')
    const set = loadIconSet(siteRoot)

    return loadIcons(siteRoot).map((icon) => ({
      id: icon.name,
      title: icon.name,
      description: `${toTitle(icon.name)} icon of ${set.title}`,
      base: icon.base,
      style: icon.style,
      // Until the set has curated metadata, an icon is filed under the first word of its
      // name and tagged with its style.
      categories: [icon.base.split('-')[0]],
      tags: ['icon', ...(icon.style ? [icon.style] : []), 'svg'],
      codepoint: icon.codepoint,
      svg: icon.svg
    }))
  },
  schema: iconsSchema
})

// The documentation of the toolkit
const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/docs' }),
  schema: docsSchema
})

export const collections = {
  icons: iconsCollection,
  docs: docsCollection
}
