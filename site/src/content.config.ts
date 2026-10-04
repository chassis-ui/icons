import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { calloutsSchema, docsSchema, z } from '@chassis-ui/docs/schema'

// The frontmatter of a docs page, with what an icon page adds.
const iconsSchema = docsSchema.extend({
  categories: z.string().optional(),
  tags: z.string().optional(),
  title: z.string()
})

const iconsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/icons' }),
  schema: iconsSchema
})

const calloutsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/callouts' }),
  schema: calloutsSchema
})

export const collections = {
  icons: iconsCollection,
  callouts: calloutsCollection
}
