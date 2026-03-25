import { createPersistentFlowCache, type ArloCacheStorage } from "arlo-sdk";

export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface CreateReactNativeFlowCacheOptions {
  storage: AsyncStorageLike;
  namespace?: string;
  maxAgeMs?: number;
}

export function createReactNativeFlowCache(
  options: CreateReactNativeFlowCacheOptions
) {
  const storage: ArloCacheStorage = {
    getItem: options.storage.getItem.bind(options.storage),
    setItem: options.storage.setItem.bind(options.storage),
    removeItem: options.storage.removeItem.bind(options.storage),
  };

  return createPersistentFlowCache({
    storage,
    namespace: options.namespace,
    maxAgeMs: options.maxAgeMs,
  });
}
