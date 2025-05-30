import mitt from "mitt";
import { showToast, ToastSeverity } from "./ToastService";

function checkIfCacheAPIIsSupported() {
  if (
    !("caches" in self) ||
    !navigator.storage ||
    !navigator.storage.estimate
  ) {
    throw new Error("Cache API is not supported.");
  }
}

export async function clearCache(): Promise<void> {
  checkIfCacheAPIIsSupported();

  const cacheNames = await caches.keys(); // Retrieve all cache names
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  showToast("Cache cleared.", ToastSeverity.Success);

  eventBus.emit("cacheCleared");
}

export interface CacheStatistics {
  cacheName: string;
  requestCount: number;
}

export interface CacheStatsResult {
  cacheQuota: number; // in bytes
  totalUsedCache: number; // in bytes
  cachePercentageUsed: number; // in percent
  cacheDetails: CacheStatistics[];
}

export async function getCacheStatistics(): Promise<CacheStatsResult> {
  checkIfCacheAPIIsSupported();

  // Retrieve storage estimates
  const { quota, usage } = await navigator.storage.estimate();

  // Ensure the required properties are present
  const cacheQuota = quota ?? 0;
  const totalUsedCache = usage ?? 0;
  const cachePercentageUsed = cacheQuota
    ? (totalUsedCache / cacheQuota) * 100
    : 0;

  const cachesKeys = await caches.keys();
  const cacheDetails = await Promise.all(
    cachesKeys.map(async (cacheName) => {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      return {
        cacheName,
        requestCount: requests.length,
      };
    }),
  );

  return {
    cacheQuota, // Total cache quota
    totalUsedCache: totalUsedCache, // Total size of all caches in bytes
    cachePercentageUsed: parseFloat(cachePercentageUsed.toFixed(2)), // Percentage used
    cacheDetails: cacheDetails, // Array of cache details
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const k = 1024; // Size in bytes for 1 KB
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(2)} ${units[i]}`;
}
