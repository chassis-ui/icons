/* global chassis: false */
(() => {
  'use strict'
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-cx-toggle="tooltip"]'))
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new chassis.Tooltip(tooltipTriggerEl)
  })
})()
