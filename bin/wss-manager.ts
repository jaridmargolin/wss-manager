#!/usr/bin/env node
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
  const manager = new WSSManager()
  await manager.start()

  return process.send ? process.send({ connected: true }) : null
}

run()
