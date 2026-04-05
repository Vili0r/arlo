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
export declare function createReactNativeFlowCache(options: CreateReactNativeFlowCacheOptions): import("arlo-sdk").ArloFlowCache;
//# sourceMappingURL=storage-cache.d.ts.map