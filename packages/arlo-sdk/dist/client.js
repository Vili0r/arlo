"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArloClient = createArloClient;
const schema_1 = require("./schema");
const types_1 = require("./types");
class MemoryFlowCache {
    constructor() {
        this.map = new Map();
    }
    get(key) {
        return this.map.get(key) ?? null;
    }
    set(key, value) {
        this.map.set(key, value);
    }
    delete(key) {
        this.map.delete(key);
    }
}
class ArloEventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    on(event, handler) {
        const handlers = this.listeners.get(event) ?? new Set();
        handlers.add(handler);
        this.listeners.set(event, handlers);
        return () => {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(event);
            }
        };
    }
    emit(event, payload) {
        const handlers = this.listeners.get(event);
        if (!handlers) {
            return;
        }
        for (const handler of handlers) {
            handler(payload);
        }
    }
}
function normalizeBaseUrl(baseUrl) {
    return baseUrl.replace(/\/+$/, "");
}
function createCacheKey(projectId, slug) {
    return `${projectId}:${slug}`;
}
async function parseFlowResponse(response, emitter) {
    if (!response.ok) {
        const error = await parseErrorResponse(response);
        emitter.emit("flow:error", error);
        throw error;
    }
    const json = await response.json();
    const parsed = schema_1.sdkFlowResponseSchema.safeParse(json);
    if (!parsed.success) {
        const error = new types_1.ArloSDKError("The server returned an invalid flow payload", {
            status: response.status,
            code: "INVALID_RESPONSE",
        });
        emitter.emit("flow:error", error);
        throw error;
    }
    return parsed.data;
}
async function parseErrorResponse(response) {
    try {
        const json = await response.json();
        const parsed = schema_1.sdkErrorResponseSchema.safeParse(json);
        if (parsed.success) {
            return new types_1.ArloSDKError(parsed.data.error, {
                status: response.status,
                code: parsed.data.code,
            });
        }
    }
    catch {
        // Fall through to generic error below.
    }
    return new types_1.ArloSDKError(`Request failed with status ${response.status}`, {
        status: response.status,
        code: "NETWORK_ERROR",
    });
}
function createArloClient(options) {
    if (!options.apiKey.trim()) {
        throw new types_1.ArloSDKError("apiKey is required");
    }
    if (!options.projectId.trim()) {
        throw new types_1.ArloSDKError("projectId is required");
    }
    if (!options.baseUrl.trim()) {
        throw new types_1.ArloSDKError("baseUrl is required");
    }
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
        throw new types_1.ArloSDKError("A fetch implementation is required");
    }
    const emitter = new ArloEventEmitter();
    const cache = options.cache ?? new MemoryFlowCache();
    const baseUrl = normalizeBaseUrl(options.baseUrl);
    let identity = null;
    async function loadFromPath(pathname) {
        let response;
        try {
            response = await fetchImpl(`${baseUrl}${pathname}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": options.apiKey,
                    ...(identity?.userId ? { "x-arlo-user-id": identity.userId } : {}),
                    ...options.headers,
                },
            });
        }
        catch (cause) {
            const error = new types_1.ArloSDKError("Network request failed", {
                code: "NETWORK_ERROR",
            });
            if (cause instanceof Error && cause.stack) {
                error.stack = cause.stack;
            }
            emitter.emit("flow:error", error);
            throw error;
        }
        return parseFlowResponse(response, emitter);
    }
    async function getResource(cacheKey, pathname, flowOptions) {
        const useCache = flowOptions?.useCache !== false;
        const forceRefresh = flowOptions?.forceRefresh === true;
        const allowOfflineFallback = flowOptions?.allowOfflineFallback ?? options.offlineFallback ?? true;
        const cached = useCache ? await cache.get(cacheKey) : null;
        if (useCache && !forceRefresh) {
            if (cached) {
                emitter.emit("flow:cache-hit", cached.response);
                return cached.response;
            }
        }
        let response;
        try {
            response = await loadFromPath(pathname);
        }
        catch (error) {
            if (allowOfflineFallback && cached) {
                emitter.emit("flow:cache-hit", cached.response);
                return cached.response;
            }
            throw error;
        }
        if (useCache) {
            await cache.set(cacheKey, {
                response,
                cachedAt: Date.now(),
            });
        }
        emitter.emit("flow:fetched", response);
        return response;
    }
    async function getFlow(slug, flowOptions) {
        return getResource(createCacheKey(options.projectId, `flow:${slug}`), `/api/sdk/projects/${encodeURIComponent(options.projectId)}/flows/${encodeURIComponent(slug)}`, flowOptions);
    }
    async function getEntryPoint(entryPointKey, flowOptions) {
        return getResource(createCacheKey(options.projectId, `entry-point:${entryPointKey}`), `/api/sdk/projects/${encodeURIComponent(options.projectId)}/entry-points/${encodeURIComponent(entryPointKey)}`, flowOptions);
    }
    return {
        identify(input) {
            identity = input;
            emitter.emit("user:identified", input);
        },
        getIdentity() {
            return identity;
        },
        getFlow(slug, flowOptions) {
            return getFlow(slug, flowOptions);
        },
        getEntryPoint(entryPointKey, flowOptions) {
            return getEntryPoint(entryPointKey, flowOptions);
        },
        preloadFlow(slug) {
            return getFlow(slug, { useCache: true });
        },
        preloadEntryPoint(entryPointKey) {
            return getEntryPoint(entryPointKey, { useCache: true });
        },
        async clearCachedFlow(slug) {
            const cacheKey = createCacheKey(options.projectId, `flow:${slug}`);
            await cache.delete?.(cacheKey);
        },
        on(event, handler) {
            return emitter.on(event, handler);
        },
    };
}
//# sourceMappingURL=client.js.map