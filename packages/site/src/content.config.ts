import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { docsSchema } from '@chassis-ui/docs/schema'

// The documentation of the builder
const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/docs' }),
  schema: docsSchema
})

export const collections = {
  docs: docsCollection
}
