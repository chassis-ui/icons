;(() => {
  const set = JSON.parse(document.getElementById('page_set').textContent)
  const icons = new Map(set.icons.map((icon) => [icon.name, icon]))
  const tiles = [...document.querySelectorAll('#page_list li')]
  const search = document.getElementById('page_search')
  const drawer = document.getElementById('page_drawer')
  const sprite = set.name + '.svg'
  const snippets = {}
  let style = ''
  let selected = null
  // Whether the icons are drawn with the font, because the browser did not read the sprite
  let font = false

  const escape = (text) =>
    text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

  // The tags, the attributes and their values of a snippet of HTML, each in a color
  function highlight(code) {
    const pattern = /(<\/?)([\w:-]+)|([\w:-]+)(=)("[^"]*")|(\/?>)/g
    let html = ''
    let last = 0

    for (const match of code.matchAll(pattern)) {
      html += escape(code.slice(last, match.index))

      if (match[2]) {
        html +=
          '<span class="page_punct">' +
          escape(match[1]) +
          '</span><span class="page_tag">' +
          match[2] +
          '</span>'
      } else if (match[3]) {
        html +=
          '<span class="page_attr">' +
          match[3] +
          '</span><span class="page_punct">=</span><span class="page_string">' +
          escape(match[5]) +
          '</span>'
      } else {
        html += '<span class="page_punct">' + escape(match[6]) + '</span>'
      }

      last = match.index + match[0].length
    }

    return html + escape(code.slice(last))
  }

  function filter() {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean)
    let shown = 0

    for (const tile of tiles) {
      tile.hidden =
        (style !== '' && tile.dataset.style !== style) ||
        !words.every((word) => tile.dataset.name.includes(word))
      shown += tile.hidden ? 0 : 1
    }

    document.getElementById('page_empty').hidden = shown > 0
    document.getElementById('page_count').textContent =
      shown === tiles.length ? '' : shown + ' of ' + tiles.length + ' icons'
  }

  function embedded(name) {
    const symbol = document.getElementById(name)

    if (!symbol) {
      return (
        '<!-- The SVG of the sprite needs a served folder. The file is svgs/' + name + '.svg -->'
      )
    }

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      set.frame +
      '" height="' +
      set.frame +
      '" fill="currentcolor" class="' +
      set.prefix +
      '-' +
      name +
      '" viewBox="' +
      symbol.getAttribute('viewBox') +
      '">\n  ' +
      symbol.innerHTML.trim() +
      '\n</svg>'
    )
  }

  function badge(text, color) {
    const element = document.createElement('span')

    element.className = 'badge smooth ' + color
    element.textContent = text
    return element
  }

  // Fills the drawer with an icon. The Chassis data API opens it, on a click of a tile
  function show(name) {
    const icon = icons.get(name)

    if (!icon) return false

    const codepoint = icon.codepoint.toUpperCase()

    selected = name
    for (const tile of tiles) {
      tile.firstElementChild.setAttribute('aria-current', String(tile.dataset.name === name))
    }

    for (const element of drawer.querySelectorAll('[data-page-icon]')) {
      if (font) element.className = element.dataset.pageClass + ' ' + set.prefix + '-' + name
      else element.setAttribute('href', '#' + name)
    }

    document.getElementById('page_name').textContent = name
    document.getElementById('page_preview').setAttribute('aria-label', name)
    document
      .getElementById('page_badges')
      .replaceChildren(
        ...(icon.style ? [badge(icon.style, 'primary')] : []),
        badge(set.prefix + '-' + name, 'neutral'),
        badge('U+' + codepoint, 'neutral')
      )
    document.getElementById('page_download').href = 'svgs/' + name + '.svg'

    snippets.sprite =
      '<svg width="' +
      set.frame +
      '" height="' +
      set.frame +
      '" fill="currentcolor" aria-hidden="true">\n' +
      // \u003c is "<": the page holds no tag in a string of its script, for a reader of its tags
      '  \u003cuse href="' +
      sprite +
      '#' +
      name +
      '">\u003c/use>\n</svg>'
    snippets.font = '<i class="' + set.prefix + '-' + name + '"></i>'
    snippets.embedded = embedded(name)

    for (const code of drawer.querySelectorAll('[data-page-snippet]')) {
      code.innerHTML = highlight(snippets[code.dataset.pageSnippet])
    }

    const codepoints = {
      unicode: 'U+' + codepoint,
      css: '\\' + icon.codepoint,
      js: '\\u' + codepoint,
      html: '&#x' + codepoint + ';'
    }

    for (const code of drawer.querySelectorAll('[data-page-codepoint]')) {
      code.textContent = codepoints[code.dataset.pageCodepoint]
    }

    history.replaceState(null, '', '#' + name)
    return true
  }

  function theme(value) {
    if (value === 'auto') document.documentElement.removeAttribute('data-cx-theme')
    else document.documentElement.setAttribute('data-cx-theme', value)

    for (const button of document.querySelectorAll('[data-page-theme]')) {
      const on = button.dataset.pageTheme === value

      button.classList.toggle('active', on)
      button.setAttribute('aria-pressed', String(on))
    }

    try {
      localStorage.setItem('page-theme', value)
    } catch {
      // Storage may be off, as in a private window: the choice lasts for this visit
    }
  }

  // An element that draws an icon with the font, in place of an <svg> of the sprite
  function glyph(name, className) {
    const element = document.createElement('i')

    element.className = className + ' ' + set.prefix + '-' + name
    element.dataset.pageClass = className
    element.setAttribute('aria-hidden', 'true')
    return element
  }

  function useFont() {
    font = true
    document.getElementById('page_font_note').hidden = false

    for (const tile of tiles) {
      tile.querySelector('svg').replaceWith(glyph(tile.dataset.name, 'icon'))
    }

    for (const use of drawer.querySelectorAll('[data-page-icon]')) {
      const svg = use.closest('svg')
      const element = glyph(selected ?? set.icons[0].name, svg.getAttribute('class'))

      element.dataset.pageIcon = ''
      svg.replaceWith(element)
    }

    if (selected) show(selected)
  }

  // The sprite beside the page goes into it, hidden, so that the tiles and the drawer draw its
  // symbols and the drawer shows the SVG of an icon. A browser does not read a file of the file
  // system, so from there the icons are drawn with the font, which a stylesheet may load.
  fetch(sprite)
    .then((response) => {
      if (!response.ok) throw new Error(response.statusText)
      return response.text()
    })
    .then((text) => {
      const holder = document.createElement('div')

      holder.innerHTML = text
      const svg = holder.querySelector('svg')

      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden')
      document.body.prepend(svg)
    })
    .catch(useFont)

  search.addEventListener('input', filter)

  for (const button of document.querySelectorAll('[data-page-style]')) {
    button.addEventListener('click', () => {
      style = button.dataset.pageStyle

      for (const other of document.querySelectorAll('[data-page-style]')) {
        other.classList.toggle('active', other === button)
        other.setAttribute('aria-pressed', String(other === button))
      }

      filter()
    })
  }

  for (const button of document.querySelectorAll('[data-page-theme]')) {
    button.addEventListener('click', () => theme(button.dataset.pageTheme))
  }

  // Without the script of Chassis, as offline, the drawer opens and closes as a plain dialog
  const offline = () => 'failed' in document.getElementById('page_chassis').dataset

  document.getElementById('page_list').addEventListener('click', (event) => {
    const tile = event.target.closest('li[data-name]')

    if (tile && show(tile.dataset.name) && offline()) drawer.showModal()
  })

  drawer.querySelector('.close-button').addEventListener('click', () => {
    if (offline()) drawer.close()
  })

  drawer.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-page-copy]')

    if (!button) return

    try {
      await navigator.clipboard.writeText(snippets[button.dataset.pageCopy])
      button.textContent = 'Copied'
    } catch {
      button.textContent = 'Select it'
    }

    setTimeout(() => (button.textContent = 'Copy'), 1500)
  })

  drawer.addEventListener('close', () => {
    for (const tile of tiles) tile.firstElementChild.removeAttribute('aria-current')
    selected = null
    history.replaceState(null, '', location.pathname + location.search)
  })

  try {
    const saved = localStorage.getItem('page-theme')

    if (saved) theme(saved)
  } catch {
    // No stored choice: the page follows the system
  }

  filter()

  // A link to an icon opens the drawer, when the page has loaded with Chassis or when the
  // address changes to it
  function openFromHash() {
    const name = decodeURIComponent(location.hash.slice(1))
    const tile = tiles.find((item) => item.dataset.name === name)

    if (tile && selected === null) tile.firstElementChild.click()
  }

  // After the load handler of Chassis, which handles a drawer that is open at load
  window.addEventListener('load', () => setTimeout(openFromHash))
  window.addEventListener('hashchange', openFromHash)
})()
