import { getCollection, getEntry } from 'astro:content'

export const docsPages = await getCollection('docs')
export const iconsPages = await getCollection('icons')
export const callouts = await getCollection('callouts')

export const aliasedDocsPages = await getCollection('docs', ({ data }) => {
  return data.aliases !== undefined
})

export const aliasedIconsPages = await getCollection('icons', ({ data }) => {
  return data.aliases !== undefined
})

export function getCalloutByName(name: string) {
  return getEntry('callouts', name)
}
