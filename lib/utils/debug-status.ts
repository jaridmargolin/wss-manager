'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
import { padStart, padEnd, uniqueId } from 'lodash'
import debugProp from '@inventory/debug-prop'

/* -----------------------------------------------------------------------------
 * debugStatus
 *
 * Small wrapper around debugProp to add unique id to targets. Useful for
 * tracking as instances are brought up and torn down.
 * -------------------------------------------------------------------------- */

export default function debugStatus (target: any, targetName: string) {
  const uuid = padStart(uniqueId(), 4, '0')
  const debugStatus = debugProp(
    'status',
    (val: string) => `[${uuid}] status = ${val}`
  )

  debugStatus(target, padEnd(targetName, 28))
  return target
}
