"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReactNativeFlowCache = createReactNativeFlowCache;
const arlo_sdk_1 = require("arlo-sdk");
function createReactNativeFlowCache(options) {
    const storage = {
        getItem: options.storage.getItem.bind(options.storage),
        setItem: options.storage.setItem.bind(options.storage),
        removeItem: options.storage.removeItem.bind(options.storage),
    };
    return (0, arlo_sdk_1.createPersistentFlowCache)({
        storage,
        namespace: options.namespace,
        maxAgeMs: options.maxAgeMs,
    });
}
//# sourceMappingURL=storage-cache.js.map