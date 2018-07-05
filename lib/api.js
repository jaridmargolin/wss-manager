'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
const Hapi = require('hapi')
const { each } = require('lodash')
const classMethods = require('class-methods')

/* -----------------------------------------------------------------------------
 * api
 * -------------------------------------------------------------------------- */

module.exports = function Api (manager, options = {}) {
  const api = Hapi.server({
    port: 9997,
    host: 'localhost',
    routes: { cors: true },
    ...options
  })

  each(classMethods(manager.constructor), method => {
    api.route({
      method: 'POST',
      path: `/${method}`,
      handler: (request, h) => {
        return Promise.resolve(manager[method]())
          .then(__ => h.response().code(204))
          .catch(e => console.log(e))
      }
    })
  })

  return api
}
