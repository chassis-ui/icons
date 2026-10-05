// The markup of an icon of the set, for the `code` of an `<Example>`: that prop is rendered
// as HTML, so a component in it is never called. `<SetIcon>` renders the same in a page.

import set from 'virtual:icon-set'

/** An icon of the set from its sprite: `<svg class="icon"><use href="…#name"></use></svg>`. */
export function spriteIcon(name: string, className?: string): string {
  const classes = ['icon', className].filter(Boolean).join(' ')

  return `<svg class="${classes}" width="${set.frame}" height="${set.frame}" aria-hidden="true"><use href="${set.path.sprite}#${name}"></use></svg>`
}

/** An icon of the set as a glyph of its font: `<span class="icon <prefix>-name"></span>`. */
export function fontIcon(name: string, className?: string): string {
  const classes = ['icon', `${set.prefix}-${name}`, className].filter(Boolean).join(' ')

  return `<span class="${classes}" aria-hidden="true"></span>`
}

/** URL path of the SVG file of an icon of the set. */
export function svgPath(name: string): string {
  return `${set.path.svgs}/${name}.svg`
}
