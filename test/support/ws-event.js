'use strict'

/* -----------------------------------------------------------------------------
 * wsEvent
 * -------------------------------------------------------------------------- */

module.exports = (ws, event) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.removeListener(event, onEvent)
      reject(new Error(`WebSocket ${event} timed out`))
    }, 1000)

    const onEvent = (...args) => {
      clearTimeout(timeout)
      resolve(args)
    }

    ws.addListener(event, onEvent)
  })
