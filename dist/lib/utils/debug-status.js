'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */
// 3rd party
const lodash_1 = require("lodash");
const debug_prop_1 = __importDefault(require("@inventory/debug-prop"));
/* -----------------------------------------------------------------------------
 * debugStatus
 *
 * Small wrapper around debugProp to add unique id to targets. Useful for
 * tracking as instances are brought up and torn down.
 * -------------------------------------------------------------------------- */
function debugStatus(target, targetName) {
    const uuid = lodash_1.padStart(lodash_1.uniqueId(), 4, '0');
    const debugStatus = debug_prop_1.default('status', (val) => `[${uuid}] status = ${val}`);
    debugStatus(target, lodash_1.padEnd(targetName, 28));
    return target;
}
exports.default = debugStatus;
