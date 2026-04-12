"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArloClient = createArloClient;
const schema_1 = require("./schema");
const types_1 = require("./types");
const DEFAULT_MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
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
    keys() {
        return Array.from(this.map.keys());
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
function getAnalyticsPath(projectId) {
    return `/api/sdk/projects/${encodeURIComponent(projectId)}/analytics/events`;
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
    const maxStaleMs = options.maxStaleMs ?? DEFAULT_MAX_STALE_MS;
    let identity = null;
    // Track known cache keys so we can clear them all on identity change,
    // even if the cache implementation doesn't support keys().
    const knownCacheKeys = new Set();
    async function loadFromPath(pathname, etag) {
        let response;
        try {
            const headers = {
                "Content-Type": "application/json",
                "x-api-key": options.apiKey,
                ...(identity?.userId ? { "x-arlo-user-id": identity.userId } : {}),
                ...options.headers,
            };
            if (etag) {
                headers["If-None-Match"] = etag;
            }
            response = await fetchImpl(`${baseUrl}${pathname}`, {
                method: "GET",
                headers,
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
        if (response.status === 304) {
            return { type: "not-modified" };
        }
        const parsedResponse = await parseFlowResponse(response, emitter);
        const responseEtag = response.headers.get("etag") ?? undefined;
        return { type: "ok", response: parsedResponse, etag: responseEtag };
    }
    /**
     * Perform a blocking fetch, cache the result, and return it.
     * Used for cold starts (no cache), forceRefresh, and stale cache expiry.
     */
    async function fetchAndCache(cacheKey, pathname, useCache, allowOfflineFallback, cached) {
        let fetchedResponse;
        try {
            const result = await loadFromPath(pathname, cached?.etag);
            if (result.type === "not-modified" && cached?.response) {
                // Server confirmed cache is still valid — refresh the cachedAt timestamp
                if (useCache) {
                    knownCacheKeys.add(cacheKey);
                    await cache.set(cacheKey, {
                        response: cached.response,
                        cachedAt: Date.now(),
                        etag: cached.etag,
                    });
                }
                emitter.emit("flow:cache-hit", cached.response);
                return cached.response;
            }
            else if (result.type === "ok") {
                fetchedResponse = result.response;
                if (useCache) {
                    knownCacheKeys.add(cacheKey);
                    await cache.set(cacheKey, {
                        response: fetchedResponse,
                        cachedAt: Date.now(),
                        etag: result.etag,
                    });
                }
            }
            else {
                throw new Error("Unexpected load response");
            }
        }
        catch (error) {
            if (allowOfflineFallback && cached) {
                emitter.emit("flow:cache-hit", cached.response);
                return cached.response;
            }
            throw error;
        }
        emitter.emit("flow:fetched", fetchedResponse);
        return fetchedResponse;
    }
    /**
     * Fire-and-forget: ETag-conditional fetch in the background.
     * If the server returns new data, update the cache and emit `flow:updated`.
     */
    function revalidateInBackground(cacheKey, pathname, cached) {
        loadFromPath(pathname, cached.etag)
            .then(async (result) => {
            if (result.type === "ok") {
                // New data from the server — update cache
                knownCacheKeys.add(cacheKey);
                await cache.set(cacheKey, {
                    response: result.response,
                    cachedAt: Date.now(),
                    etag: result.etag,
                });
                // Notify the app that a newer version is available
                emitter.emit("flow:updated", result.response);
            }
            // 304 = cache is still valid, nothing to do
        })
            .catch(() => {
            // Network error during background revalidation — silently ignore.
            // The cached version is still perfectly usable.
        });
    }
    /**
     * Stale-While-Revalidate resource loader.
     *
     * 1. forceRefresh → blocking fetch, skip cache
     * 2. Cache exists & not too stale → return cached immediately, revalidate in background
     * 3. Cache exists but too stale (> maxStaleMs) → blocking fetch
     *    (avoids showing very old A/B variant assignments)
     * 4. No cache → blocking fetch
     */
    async function getResource(cacheKey, pathname, flowOptions) {
        const useCache = flowOptions?.useCache !== false;
        const forceRefresh = flowOptions?.forceRefresh === true;
        const allowOfflineFallback = flowOptions?.allowOfflineFallback ?? options.offlineFallback ?? true;
        const cached = useCache ? await cache.get(cacheKey) : null;
        // ── Force refresh: always block on network ──
        if (forceRefresh) {
            return fetchAndCache(cacheKey, pathname, useCache, allowOfflineFallback, cached);
        }
        // ── Has cache: use SWR strategy ──
        if (useCache && cached) {
            const cacheAge = Date.now() - cached.cachedAt;
            if (maxStaleMs > 0 && cacheAge > maxStaleMs) {
                // Cache is too old — can't serve it (stale A/B variant, etc.)
                // Fall through to a blocking fetch, but keep cached as offline fallback.
                return fetchAndCache(cacheKey, pathname, useCache, allowOfflineFallback, cached);
            }
            // Cache is fresh enough — return it immediately, revalidate in background
            revalidateInBackground(cacheKey, pathname, cached);
            emitter.emit("flow:cache-hit", cached.response);
            return cached.response;
        }
        // ── No cache: must fetch ──
        return fetchAndCache(cacheKey, pathname, useCache, allowOfflineFallback, cached);
    }
    async function getFlow(slug, flowOptions) {
        return getResource(createCacheKey(options.projectId, `flow:${slug}`), `/api/sdk/projects/${encodeURIComponent(options.projectId)}/flows/${encodeURIComponent(slug)}`, flowOptions);
    }
    async function getEntryPoint(entryPointKey, flowOptions) {
        return getResource(createCacheKey(options.projectId, `entry-point:${entryPointKey}`), `/api/sdk/projects/${encodeURIComponent(options.projectId)}/entry-points/${encodeURIComponent(entryPointKey)}`, flowOptions);
    }
    async function clearAllCachedFlows() {
        // Use cache.keys() if available, otherwise fall back to our tracked set
        const keys = cache.keys ? await cache.keys() : Array.from(knownCacheKeys);
        for (const key of keys) {
            await cache.delete?.(key);
        }
        knownCacheKeys.clear();
    }
    async function trackAnalyticsEvent(event) {
        let response;
        try {
            response = await fetchImpl(`${baseUrl}${getAnalyticsPath(options.projectId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": options.apiKey,
                    ...(identity?.userId ? { "x-arlo-user-id": identity.userId } : {}),
                    ...options.headers,
                },
                body: JSON.stringify(event),
            });
        }
        catch (cause) {
            const error = new types_1.ArloSDKError("Analytics request failed", {
                code: "NETWORK_ERROR",
            });
            if (cause instanceof Error && cause.stack) {
                error.stack = cause.stack;
            }
            throw error;
        }
        if (!response.ok) {
            throw await parseErrorResponse(response);
        }
    }
    return {
        identify(input) {
            const previousUserId = identity?.userId;
            identity = input;
            emitter.emit("user:identified", input);
            // When the user identity changes, clear all cached flows.
            // This is critical for A/B testing: different users may be assigned
            // different variants, so we can't reuse a cached variant from a
            // previous user.
            if (previousUserId !== input.userId) {
                clearAllCachedFlows().catch(() => {
                    // Best-effort cache clear — don't crash the app
                });
            }
        },
        getIdentity() {
            return identity;
        },
        getProjectId() {
            return options.projectId;
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
            knownCacheKeys.delete(cacheKey);
        },
        clearAllCachedFlows,
        trackAnalyticsEvent,
        on(event, handler) {
            return emitter.on(event, handler);
        },
    };
}
//# sourceMappingURL=client.js.map