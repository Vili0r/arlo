import type { ArloFlowCache } from "./types";
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
export declare function createPersistentFlowCache(options: CreatePersistentFlowCacheOptions): ArloFlowCache;
//# sourceMappingURL=cache.d.ts.map