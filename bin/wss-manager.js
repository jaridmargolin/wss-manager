'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// lib
const Api = require('../lib/api')
const WSSManager = require('../lib/wss-manager')

/* -----------------------------------------------------------------------------
 * api
 * -------------------------------------------------------------------------- */

const api = Api(new WSSManager())
const send = process.send || (() => null)

api.start().then(() => send({ connected: true }))
