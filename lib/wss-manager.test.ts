'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
import { promisify } from 'util'

// 3rd party
import axios from 'axios'
import WebSocket from 'ws'
import { EventListener, Timer } from '@inventory/async'
import portscanner, { Status } from 'portscanner'

// lib
import WSSManager from './wss-manager'

// Checks the status of a single port
const checkPortStatus = promisify(portscanner.checkPortStatus) as (
  port: number,
  host: string
) => Promise<Status>

/* -----------------------------------------------------------------------------
 * ws helpers
 * -------------------------------------------------------------------------- */

const waitForEvent = (ws: WebSocket, event: string) =>
  Promise.race([
    new EventListener(ws, event),
    new Timer(1000).start().then(() => {
      throw new Error('Timed out')
    })
  ])

const confirmUnblocked = (ws: WebSocket) => {
  ws.send('ping')
  return waitForEvent(ws, 'message')
}

const confirmBlocked = async (ws: WebSocket) => {
  ws.send('ping')

  try {
    await waitForEvent(ws, 'message')
  } catch (e) {
    return undefined
  }

  throw new Error('Message received')
}

/* -----------------------------------------------------------------------------
 * test
 * -------------------------------------------------------------------------- */

describe('WSSManager', function () {
  test('Should start/stop api, ws, and link server', async () => {
    const manager = new WSSManager()
    await manager.start()

    expect(await checkPortStatus(9995, '127.0.0.1')).toBe('open')
    expect(await checkPortStatus(9996, '127.0.0.1')).toBe('open')
    expect(await checkPortStatus(9997, '127.0.0.1')).toBe('open')

    const ws = new WebSocket('ws://localhost:9996')

    await waitForEvent(ws, 'open')
    expect(ws.readyState).toBe(WebSocket.OPEN)

    await manager.stop()

    await waitForEvent(ws, 'close')
    expect(ws.readyState).toBe(WebSocket.CLOSED)

    expect(await checkPortStatus(9995, '127.0.0.1')).toBe('closed')
    expect(await checkPortStatus(9996, '127.0.0.1')).toBe('closed')
    expect(await checkPortStatus(9997, '127.0.0.1')).toBe('closed')
  })

  test('Should expose endpoints to start/stop ws/link servers', async () => {
    const manager = new WSSManager()
    await manager.start()

    const ws1 = new WebSocket('ws://localhost:9996')

    await waitForEvent(ws1, 'open')
    expect(ws1.readyState).toBe(WebSocket.OPEN)

    const stopRes = await axios.post('http://localhost:9997/stop')
    expect(stopRes.status).toBe(200)

    await waitForEvent(ws1, 'close')
    expect(ws1.readyState).toBe(WebSocket.CLOSED)

    expect(await checkPortStatus(9995, '127.0.0.1')).toBe('closed')
    expect(await checkPortStatus(9996, '127.0.0.1')).toBe('closed')

    const startRes = await axios.post('http://localhost:9997/start')
    expect(startRes.status).toBe(200)

    const ws2 = new WebSocket('ws://localhost:9996')

    await waitForEvent(ws2, 'open')
    expect(ws2.readyState).toBe(WebSocket.OPEN)

    expect(await checkPortStatus(9995, '127.0.0.1')).toBe('open')
    expect(await checkPortStatus(9996, '127.0.0.1')).toBe('open')

    await manager.stop()
  })

  test('Should expose endpoints to block/unblock traffic', async () => {
    const manager = new WSSManager()
    await manager.start()

    const ws = new WebSocket('ws://localhost:9996')
    await waitForEvent(ws, 'open')

    const blockRes = await axios.post('http://localhost:9997/block')
    expect(blockRes.status).toBe(200)

    expect(ws.readyState).toBe(WebSocket.OPEN)
    await confirmBlocked(ws)

    const unblockRes = await axios.post('http://localhost:9997/unblock')
    expect(unblockRes.status).toBe(200)

    expect(ws.readyState).toBe(WebSocket.OPEN)
    await confirmUnblocked(ws)

    await manager.stop()
  })

  test('Should reply with sent message', async () => {
    const manager = new WSSManager()
    await manager.start()

    const ws = new WebSocket('ws://localhost:9996')
    await waitForEvent(ws, 'open')

    ws.send('1234')
    expect(await new EventListener(ws, 'message')).toBe('1234')

    await manager.stop()
  })

  test('Should allow overriding message handler', async () => {
    const manager = new WSSManager({
      wsMessageHandler: (data, reply) => reply(data + '5')
    })

    await manager.start()

    const ws = new WebSocket('ws://localhost:9996')
    await waitForEvent(ws, 'open')

    ws.send('1234')
    expect(await new EventListener(ws, 'message')).toBe('12345')

    await manager.stop()
  })
})
