'use strict'

const codepoints = require('./icons/package/chassis-icons.json')

module.exports = {
  inputDir: './icons/svgs',
  outputDir: './icons/package',
  fontTypes: ['woff2', 'woff'],
  assetTypes: ['css', 'scss', 'json'],
  name: 'chassis-icons',
  codepoints,
  prefix: 'chassis-icon',
  selector: '.chassis-icon',
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
    json: './icons/package/chassis-icons.json',
    css: './icons/package/chassis-icons.css',
    scss: './icons/package/chassis-icons.scss',
    woff: './icons/package/chassis-icons.woff',
    woff2: './icons/package/chassis-icons.woff2'
  }
}
