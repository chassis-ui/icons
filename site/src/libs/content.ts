import { getCollection, getEntry } from 'astro:content'

export const iconsPages = await getCollection('icons')
export const callouts = await getCollection('callouts')

export const aliasedIconsPages = await getCollection('icons', ({ data }) => {
  return data.aliases !== undefined
})

export function getCalloutByName(name: string) {
  return getEntry('callouts', name)
}
