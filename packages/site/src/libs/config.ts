import { configSchema, z } from '@chassis-ui/docs/schema'

// The keys of `config.yml` that the package does not read.
export const siteConfigSchema = configSchema.extend({
  /** Name of the icon that the examples of the homepage show. */
  exampleIcon: z.string()
})

export type SiteConfig = z.infer<typeof siteConfigSchema>
