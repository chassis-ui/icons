import { z, defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

const iconsSchema = z.object({
  added: z
    .object({
      show_badge: z.boolean().optional(),
      version: z.string()
    })
    .optional(),
  aliases: z.string().or(z.string().array()).optional(),
  categories: z.string().optional(),
  description: z.string().optional(),
  direction: z.literal('rtl').optional(),
  extra_js: z
    .object({
      async: z.boolean().optional(),
      src: z.string()
    })
    .array()
    .optional(),
  sections: z
    .object({
      description: z.string(),
      title: z.string()
    })
    .array()
    .optional(),
  tags: z.string().optional(),
  thumbnail: z.string().optional(),
  title: z.string(),
  toc: z.boolean().optional()
})

const iconsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/icons' }),
  schema: iconsSchema
})

const calloutsSchema = z.object({})

const calloutsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/callouts' }),
  schema: calloutsSchema
})

export const collections = {
  icons: iconsCollection,
  callouts: calloutsCollection
}
