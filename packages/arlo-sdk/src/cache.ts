import type { ArloFlowCache, ArloFlowCacheEntry } from "./types";

export interface ArloCacheStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface CreatePersistentFlowCacheOptions {
  storage: ArloCacheStorage;
  namespace?: string;
  maxAgeMs?: number;
}

interface SerializedCacheEntry {
  cachedAt: number;
  response: ArloFlowCacheEntry["response"];
  etag?: string;
}

function makeStorageKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

export function createPersistentFlowCache(
  options: CreatePersistentFlowCacheOptions
): ArloFlowCache {
  const namespace = options.namespace ?? "arlo-cache";
  const maxAgeMs = options.maxAgeMs ?? 1000 * 60 * 60 * 24;

  return {
    async get(key: string): Promise<ArloFlowCacheEntry | null> {
      const raw = await options.storage.getItem(makeStorageKey(namespace, key));
      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw) as SerializedCacheEntry;
        if (Date.now() - parsed.cachedAt > maxAgeMs) {
          await options.storage.removeItem(makeStorageKey(namespace, key));
          return null;
        }

        return {
          cachedAt: parsed.cachedAt,
          response: parsed.response,
          etag: parsed.etag,
        };
      } catch {
        await options.storage.removeItem(makeStorageKey(namespace, key));
        return null;
      }
    },
    async set(key: string, value: ArloFlowCacheEntry): Promise<void> {
      const serialized: SerializedCacheEntry = {
        cachedAt: value.cachedAt,
        response: value.response,
        etag: value.etag,
      };

      await options.storage.setItem(
        makeStorageKey(namespace, key),
        JSON.stringify(serialized)
      );
    },
    async delete(key: string): Promise<void> {
      await options.storage.removeItem(makeStorageKey(namespace, key));
    },
  };
}
