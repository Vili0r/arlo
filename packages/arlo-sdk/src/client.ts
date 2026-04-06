import { sdkErrorResponseSchema, sdkFlowResponseSchema } from "./schema";
import type {
  ArloClient,
  ArloClientOptions,
  ArloEventMap,
  ArloFlowCacheEntry,
  ArloIdentifyInput,
  GetFlowOptions,
  SDKFlowResponse,
} from "./types";
import { ArloSDKError } from "./types";

class MemoryFlowCache {
  private readonly map = new Map<string, ArloFlowCacheEntry>();

  get(key: string): ArloFlowCacheEntry | null {
    return this.map.get(key) ?? null;
  }

  set(key: string, value: ArloFlowCacheEntry): void {
    this.map.set(key, value);
  }

  delete(key: string): void {
    this.map.delete(key);
  }
}

type EventHandler<K extends keyof ArloEventMap> = (payload: ArloEventMap[K]) => void;

class ArloEventEmitter {
  private listeners = new Map<keyof ArloEventMap, Set<(payload: unknown) => void>>();

  on<K extends keyof ArloEventMap>(event: K, handler: EventHandler<K>): () => void {
    const handlers = this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    handlers.add(handler as (payload: unknown) => void);
    this.listeners.set(event, handlers);

    return () => {
      handlers.delete(handler as (payload: unknown) => void);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<K extends keyof ArloEventMap>(event: K, payload: ArloEventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function createCacheKey(projectId: string, slug: string): string {
  return `${projectId}:${slug}`;
}

async function parseFlowResponse(
  response: Response,
  emitter: ArloEventEmitter
): Promise<SDKFlowResponse> {
  if (!response.ok) {
    const error = await parseErrorResponse(response);
    emitter.emit("flow:error", error);
    throw error;
  }

  const json = await response.json();
  const parsed = sdkFlowResponseSchema.safeParse(json);

  if (!parsed.success) {
    const error = new ArloSDKError("The server returned an invalid flow payload", {
      status: response.status,
      code: "INVALID_RESPONSE",
    });
    emitter.emit("flow:error", error);
    throw error;
  }

  return parsed.data;
}

async function parseErrorResponse(response: Response): Promise<ArloSDKError> {
  try {
    const json = await response.json();
    const parsed = sdkErrorResponseSchema.safeParse(json);

    if (parsed.success) {
      return new ArloSDKError(parsed.data.error, {
        status: response.status,
        code: parsed.data.code,
      });
    }
  } catch {
    // Fall through to generic error below.
  }

  return new ArloSDKError(`Request failed with status ${response.status}`, {
    status: response.status,
    code: "NETWORK_ERROR",
  });
}

export function createArloClient(options: ArloClientOptions): ArloClient {
  if (!options.apiKey.trim()) {
    throw new ArloSDKError("apiKey is required");
  }

  if (!options.projectId.trim()) {
    throw new ArloSDKError("projectId is required");
  }

  if (!options.baseUrl.trim()) {
    throw new ArloSDKError("baseUrl is required");
  }

  const fetchImpl = options.fetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new ArloSDKError("A fetch implementation is required");
  }

  const emitter = new ArloEventEmitter();
  const cache = options.cache ?? new MemoryFlowCache();
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  let identity: ArloIdentifyInput | null = null;

  type LoadResponse = 
    | { type: "ok"; response: SDKFlowResponse; etag?: string }
    | { type: "not-modified" };

  async function loadFromPath(pathname: string, etag?: string): Promise<LoadResponse> {
    let response: Response;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": options.apiKey,
        ...(identity?.userId ? { "x-arlo-user-id": identity.userId } : {}),
        ...options.headers,
      };

      if (etag) {
        headers["If-None-Match"] = etag;
      }

      response = await fetchImpl(
        `${baseUrl}${pathname}`,
        {
          method: "GET",
          headers,
        }
      );
    } catch (cause) {
      const error = new ArloSDKError("Network request failed", {
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

  async function getResource(
    cacheKey: string,
    pathname: string,
    flowOptions?: GetFlowOptions
  ): Promise<SDKFlowResponse> {
    const useCache = flowOptions?.useCache !== false;
    const forceRefresh = flowOptions?.forceRefresh === true;
    const allowOfflineFallback =
      flowOptions?.allowOfflineFallback ?? options.offlineFallback ?? true;
    const cached = useCache ? await cache.get(cacheKey) : null;

    if (useCache && !forceRefresh) {
      if (cached) {
        emitter.emit("flow:cache-hit", cached.response);
        return cached.response;
      }
    }

    let fetchedResponse: SDKFlowResponse;

    try {
      const result = await loadFromPath(pathname, cached?.etag);

      if (result.type === "not-modified" && cached?.response) {
        emitter.emit("flow:cache-hit", cached.response);
        return cached.response;
      } else if (result.type === "ok") {
        fetchedResponse = result.response;
        if (useCache) {
          await cache.set(cacheKey, {
            response: fetchedResponse,
            cachedAt: Date.now(),
            etag: result.etag,
          });
        }
      } else {
        throw new Error("Unexpected load response");
      }
    } catch (error) {
      if (allowOfflineFallback && cached) {
        emitter.emit("flow:cache-hit", cached.response);
        return cached.response;
      }

      throw error;
    }

    emitter.emit("flow:fetched", fetchedResponse);
    return fetchedResponse;
  }

  async function getFlow(slug: string, flowOptions?: GetFlowOptions): Promise<SDKFlowResponse> {
    return getResource(
      createCacheKey(options.projectId, `flow:${slug}`),
      `/api/sdk/projects/${encodeURIComponent(options.projectId)}/flows/${encodeURIComponent(slug)}`,
      flowOptions
    );
  }

  async function getEntryPoint(
    entryPointKey: string,
    flowOptions?: GetFlowOptions
  ): Promise<SDKFlowResponse> {
    return getResource(
      createCacheKey(options.projectId, `entry-point:${entryPointKey}`),
      `/api/sdk/projects/${encodeURIComponent(options.projectId)}/entry-points/${encodeURIComponent(entryPointKey)}`,
      flowOptions
    );
  }

  return {
    identify(input: ArloIdentifyInput): void {
      identity = input;
      emitter.emit("user:identified", input);
    },
    getIdentity(): ArloIdentifyInput | null {
      return identity;
    },
    getFlow(slug: string, flowOptions?: GetFlowOptions): Promise<SDKFlowResponse> {
      return getFlow(slug, flowOptions);
    },
    getEntryPoint(entryPointKey: string, flowOptions?: GetFlowOptions): Promise<SDKFlowResponse> {
      return getEntryPoint(entryPointKey, flowOptions);
    },
    preloadFlow(slug: string): Promise<SDKFlowResponse> {
      return getFlow(slug, { useCache: true });
    },
    preloadEntryPoint(entryPointKey: string): Promise<SDKFlowResponse> {
      return getEntryPoint(entryPointKey, { useCache: true });
    },
    async clearCachedFlow(slug: string): Promise<void> {
      const cacheKey = createCacheKey(options.projectId, `flow:${slug}`);
      await cache.delete?.(cacheKey);
    },
    on<K extends keyof ArloEventMap>(
      event: K,
      handler: (payload: ArloEventMap[K]) => void
    ): () => void {
      return emitter.on(event, handler);
    },
  };
}
