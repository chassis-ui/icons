import { configSchema, type z } from '@chassis-ui/docs/schema'

// The configuration of the site, `config.yml`: the keys of the package, and none of its own.
export const siteConfigSchema = configSchema

export type SiteConfig = z.infer<typeof siteConfigSchema>
