"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.wasmBackend = exports.initializeFlags = void 0;
const fs_1 = require("fs");
const onnxruntime_common_1 = require("onnxruntime-common");
const os_1 = require("os");
const util_1 = require("util");
const proxy_wrapper_1 = require("./wasm/proxy-wrapper");
const session_handler_1 = require("./wasm/session-handler");
/**
 * This function initializes all flags for WebAssembly.
 *
 * Those flags are accessible from `ort.env.wasm`. Users are allow to set those flags before the first inference session
 * being created, to override default value.
 */
const initializeFlags = () => {
    if (typeof onnxruntime_common_1.env.wasm.initTimeout !== 'number' || onnxruntime_common_1.env.wasm.initTimeout < 0) {
        onnxruntime_common_1.env.wasm.initTimeout = 0;
    }
    if (typeof onnxruntime_common_1.env.wasm.simd !== 'boolean') {
        onnxruntime_common_1.env.wasm.simd = true;
    }
    if (typeof onnxruntime_common_1.env.wasm.proxy !== 'boolean') {
        onnxruntime_common_1.env.wasm.proxy = false;
    }
    if (typeof onnxruntime_common_1.env.wasm.numThreads !== 'number' || !Number.isInteger(onnxruntime_common_1.env.wasm.numThreads) || onnxruntime_common_1.env.wasm.numThreads <= 0) {
        const numCpuLogicalCores = typeof navigator === 'undefined' ? os_1.cpus().length : navigator.hardwareConcurrency;
        onnxruntime_common_1.env.wasm.numThreads = Math.min(4, Math.ceil((numCpuLogicalCores || 1) / 2));
    }
};
exports.initializeFlags = initializeFlags;
class OnnxruntimeWebAssemblyBackend {
    async init() {
        // populate wasm flags
        exports.initializeFlags();
        // init wasm
        await proxy_wrapper_1.initWasm();
    }
    async createSessionHandler(pathOrBuffer, options) {
        let buffer;
        if (typeof pathOrBuffer === 'string') {
            if (typeof fetch === 'undefined') {
                // node
                buffer = await util_1.promisify(fs_1.readFile)(pathOrBuffer);
            }
            else {
                // browser
                const response = await fetch(pathOrBuffer);
                const arrayBuffer = await response.arrayBuffer();
                buffer = new Uint8Array(arrayBuffer);
            }
        }
        else {
            buffer = pathOrBuffer;
        }
        const handler = new session_handler_1.OnnxruntimeWebAssemblySessionHandler();
        await handler.loadModel(buffer, options);
        return Promise.resolve(handler);
    }
}
exports.wasmBackend = new OnnxruntimeWebAssemblyBackend();
//# sourceMappingURL=backend-wasm.js.map