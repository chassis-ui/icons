const { existsSync, readFileSync } = require('fs')

// The code points that the last build gave out, so that an icon keeps its own. A set whose
// file was deleted starts again at the first code point.
const registry = './icons/chassis-icons.json'
const codepoints = existsSync(registry) ? JSON.parse(readFileSync(registry, 'utf-8')) : {}

// Fantasticon gives a template the `src` of the font face and not the hash in it. The SCSS
// keeps the hash in a variable of its own, so its template reads it from the `src` with this
// helper. It is registered on the Handlebars that Fantasticon renders the templates with.
const handlebars = require(
  require.resolve('handlebars', { paths: [require.resolve('@twbs/fantasticon')] })
)

handlebars.registerHelper('fontHash', (fontSrc) => /\?([\da-f]{32})/.exec(fontSrc)[1])

module.exports = {
  inputDir: './svgs',
  outputDir: './icons',
  fontTypes: ['woff2', 'woff'],
  assetTypes: ['css', 'scss', 'json'],
  name: 'chassis-icons',
  codepoints,
  prefix: 'cx',
  selector: '.icon',
  fontsUrl: '.',
  formatOptions: {
    json: {
      indent: 2
    }
  },
  // Use our custom Handlebars templates
  templates: {
    css: './build/font/css.hbs',
    scss: './build/font/scss.hbs'
  },
  pathOptions: {
    json: './icons/chassis-icons.json',
    css: './icons/chassis-icons.css',
    scss: './icons/chassis-icons.scss',
    woff: './icons/chassis-icons.woff',
    woff2: './icons/chassis-icons.woff2'
  }
}
