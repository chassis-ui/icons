const { readFileSync } = require('fs')

const codepoints = JSON.parse(readFileSync('./font/chassis-icons.json', 'utf-8'))

module.exports = {
  inputDir: './svgs',
  outputDir: './font',
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
    json: './font/chassis-icons.json',
    css: './font/chassis-icons.css',
    scss: './font/chassis-icons.scss',
    woff: './font/chassis-icons.woff',
    woff2: './font/chassis-icons.woff2'
  }
}
