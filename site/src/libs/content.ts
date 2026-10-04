import { getCollection } from 'astro:content'

export const iconsPages = await getCollection('icons')

export const aliasedIconsPages = await getCollection('icons', ({ data }) => {
  return data.aliases !== undefined
})
