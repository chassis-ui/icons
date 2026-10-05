import { configSchema, z } from '@chassis-ui/docs/schema'

// The keys of `config.yml` that the package does not read.
export const siteConfigSchema = configSchema.extend({
  /**
   * Name of the icon of the set that the examples of the pages show. The first icon of the
   * set when the key is left out.
   */
  exampleIcon: z.string().optional()
})

export type SiteConfig = z.infer<typeof siteConfigSchema>
