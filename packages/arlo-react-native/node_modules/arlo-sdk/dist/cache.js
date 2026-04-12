"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPersistentFlowCache = createPersistentFlowCache;
function makeStorageKey(namespace, key) {
    return `${namespace}:${key}`;
}
function createPersistentFlowCache(options) {
    const namespace = options.namespace ?? "arlo-cache";
    const maxAgeMs = options.maxAgeMs ?? 1000 * 60 * 60 * 24;
    // Track known keys so we can enumerate them for bulk deletion.
    // AsyncStorage doesn't natively support listing keys by prefix.
    const knownKeys = new Set();
    return {
        async get(key) {
            const raw = await options.storage.getItem(makeStorageKey(namespace, key));
            if (!raw) {
                knownKeys.delete(key);
                return null;
            }
            try {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.cachedAt > maxAgeMs) {
                    await options.storage.removeItem(makeStorageKey(namespace, key));
                    knownKeys.delete(key);
                    return null;
                }
                knownKeys.add(key);
                return {
                    cachedAt: parsed.cachedAt,
                    response: parsed.response,
                    etag: parsed.etag,
                };
            }
            catch {
                await options.storage.removeItem(makeStorageKey(namespace, key));
                knownKeys.delete(key);
                return null;
            }
        },
        async set(key, value) {
            const serialized = {
                cachedAt: value.cachedAt,
                response: value.response,
                etag: value.etag,
            };
            await options.storage.setItem(makeStorageKey(namespace, key), JSON.stringify(serialized));
            knownKeys.add(key);
        },
        async delete(key) {
            await options.storage.removeItem(makeStorageKey(namespace, key));
            knownKeys.delete(key);
        },
        keys() {
            return Array.from(knownKeys);
        },
    };
}
//# sourceMappingURL=cache.js.map