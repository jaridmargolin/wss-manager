'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
const { Server } = require('hapi')
const { each } = require('lodash')
const classMethods = require('class-methods')

/* -----------------------------------------------------------------------------
 * api
 * -------------------------------------------------------------------------- */

module.exports = function api (manager, options = {}) {
  const opts = Object.assign({
    port: 9997,
    host: 'localhost',
    routes: { cors: true }
  }, options)

  const api = new Server()
  api.connection(opts)

  each(classMethods(manager.constructor), (method) => {
    api.route({
      method: 'POST',
      path: `/${method}`,
      handler: function (request, reply) {
        Promise.resolve(manager[method]())
          .then(__ => reply().code(204))
          .catch(e => console.log(e))
      }
    })
  })

  return api
}
