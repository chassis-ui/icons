const { readFileSync } = require('fs')

const codepoints = JSON.parse(readFileSync('./icons/chassis-icons.json', 'utf-8'))

module.exports = {
  inputDir: './svgs',
  outputDir: './icons',
  fontTypes: ['woff2', 'woff'],
  assetTypes: ['css', 'scss', 'json'],
  name: 'chassis-icons',
  codepoints,
  prefix: 'icon',
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
