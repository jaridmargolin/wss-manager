'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
const axios = require('axios')
const WebSocket = require('ws')

// lib
const wsEvent = require('./support/ws-event')
const Api = require('../lib/api')
const WSSManager = require('../lib/wss-manager')

/* -----------------------------------------------------------------------------
 * ws helpers
 * -------------------------------------------------------------------------- */

const createWebSocket = async () => {
  const ws = new WebSocket('ws://localhost:9996')

  await wsEvent(ws, 'open')
  return ws
}

const confirmConnected = async ws => {
  ws.send('something')
  await wsEvent(ws, 'message')
}

const confirmDisconnected = async ws => {
  ws.send('something')

  try {
    await wsEvent(ws, 'message')
    throw new Error('Message received')
  } catch (e) {}
}

/* -----------------------------------------------------------------------------
 * test
 * -------------------------------------------------------------------------- */

describe('WSSManager', function () {
  test('Should expose endpoints to manipulate websocket', async () => {
    const api = Api(new WSSManager({ debug: true }))
    await api.start()

    // start websocket
    const startRes = await axios.post('http://localhost:9997/start')
    expect(startRes.status).toBe(204)

    const ws = await createWebSocket()
    expect(ws.readyState).toBe(WebSocket.OPEN)
    await confirmConnected(ws)

    const closeRes = await axios.post('http://localhost:9997/close')
    expect(closeRes.status).toBe(204)

    expect(ws.readyState).toBe(WebSocket.OPEN)
    await confirmDisconnected(ws)

    const openRes = await axios.post('http://localhost:9997/open')
    expect(openRes.status).toBe(204)

    expect(ws.readyState).toBe(WebSocket.OPEN)
    await confirmConnected(ws)

    const stopRes = await axios.post('http://localhost:9997/stop')
    expect(stopRes.status).toBe(204)
    expect(ws.readyState).toBe(WebSocket.CLOSED)

    await api.stop()
  })
})
