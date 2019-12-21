#!/usr/bin/env node
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */
// lib
const wss_manager_1 = __importDefault(require("../lib/wss-manager"));
/* -----------------------------------------------------------------------------
 * api
 * -------------------------------------------------------------------------- */
const run = async () => {
    const manager = new wss_manager_1.default();
    await manager.start();
    return process.send ? process.send({ connected: true }) : null;
};
run();
