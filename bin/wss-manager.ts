'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// lib
import WSSManager from '../lib/wss-manager'

/* -----------------------------------------------------------------------------
 * api
 * -------------------------------------------------------------------------- */

const run = async () => {
  const send = process.send || (() => null)
  const manager = new WSSManager()

  await manager.start()

  send({ connected: true })
}

run()
