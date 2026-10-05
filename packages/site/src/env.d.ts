/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '@chassis-ui/css'

declare module 'virtual:icon-set' {
  const set: import('./libs/set').IconSet
  export default set
}
