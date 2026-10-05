import { getCollection, type CollectionEntry } from 'astro:content'

export type IconPage = CollectionEntry<'icons'>

export const iconsPages = await getCollection('icons')

/**
 * The icons of each value of a list field, such as the icons of each tag.
 * @returns The values in the order of their first icon, each with its icons.
 */
export function groupIcons(field: 'categories' | 'tags'): Map<string, IconPage[]> {
  const groups = new Map<string, IconPage[]>()

  for (const page of iconsPages) {
    for (const value of page.data[field]) {
      groups.set(value, [...(groups.get(value) ?? []), page])
    }
  }

  return groups
}
