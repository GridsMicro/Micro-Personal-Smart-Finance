import fs from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(CACHE_DIR, "portfolio-snapshots-cache.json");

export interface SnapshotCacheEntry {
  snapshot_date: string;
  total_value_thb: number;
  btc_price_thb: number | null;
  trx_price_thb: number | null;
}

export async function saveSnapshotsToCache(snapshots: SnapshotCacheEntry[]) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(snapshots, null, 2), "utf-8");
    console.log(`[Cache] Successfully saved ${snapshots.length} snapshots to ${CACHE_FILE}`);
  } catch (error) {
    console.error("[Cache] Failed to save snapshots to file:", error);
  }
}

export async function readSnapshotsFromCache(): Promise<SnapshotCacheEntry[]> {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    const snapshots = JSON.parse(data);
    console.log(`[Cache] Successfully read ${snapshots.length} snapshots from file cache`);
    return snapshots;
  } catch (error) {
    console.warn("[Cache] Failed to read snapshots from file cache (file may not exist yet)");
    return [];
  }
}
