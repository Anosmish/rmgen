import { randomUUID } from "crypto";

import type { SharedReadmeRecord } from "@/types/share";

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Attempt to load Vercel KV; fall back to in-memory if not configured.
type KvClient = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, opts: { ex: number }) => Promise<unknown>;
};

let kv: KvClient | null = null;
let kvInitPromise: Promise<void> | null = null;

function ensureKvInitialized(): Promise<void> {
  if (!kvInitPromise) {
    kvInitPromise = (async () => {
      if (process.env.KV_REST_API_URL) {
        try {
          const mod = await import("@vercel/kv");
          kv = mod.kv as unknown as KvClient;
        } catch {
          console.warn("[share-store] @vercel/kv import failed, falling back to in-memory store.");
        }
      } else {
        console.warn(
          "[share-store] VERCEL_KV not configured. Falling back to in-memory store (shares will not persist across restarts).",
        );
      }
    })();
  }
  return kvInitPromise;
}

// In-memory fallback
const MAX_SHARE_ITEMS = 500;

interface SharedReadmeStore {
  records: Map<string, SharedReadmeRecord>;
  orderedIds: string[];
}

const storeKey = "__README_SHARE_STORE__";
const globalStore = globalThis as typeof globalThis & {
  [storeKey]?: SharedReadmeStore;
};

function getInMemoryStore(): SharedReadmeStore {
  if (!globalStore[storeKey]) {
    globalStore[storeKey] = {
      records: new Map<string, SharedReadmeRecord>(),
      orderedIds: [],
    };
  }

  return globalStore[storeKey] as SharedReadmeStore;
}

function evictOldEntriesIfNeeded(store: SharedReadmeStore): void {
  while (store.orderedIds.length > MAX_SHARE_ITEMS) {
    const oldestId = store.orderedIds.shift();
    if (oldestId) {
      store.records.delete(oldestId);
    }
  }
}

export async function createSharedReadme(input: {
  readme: string;
  repoFullName: string;
  template: SharedReadmeRecord["template"];
  createdBy: string;
}): Promise<SharedReadmeRecord> {
  await ensureKvInitialized();
  const id = randomUUID().replace(/-/g, "").slice(0, 16);

  const record: SharedReadmeRecord = {
    id,
    readme: input.readme,
    repoFullName: input.repoFullName,
    template: input.template,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };

  if (kv) {
    await kv.set(`share:${id}`, record, { ex: TTL_SECONDS });
  } else {
    const store = getInMemoryStore();
    store.records.set(id, record);
    store.orderedIds.push(id);
    evictOldEntriesIfNeeded(store);
  }

  return record;
}

export async function getSharedReadmeById(id: string): Promise<SharedReadmeRecord | null> {
  await ensureKvInitialized();
  if (kv) {
    const result = await kv.get(`share:${id}`);
    return (result as SharedReadmeRecord | null) ?? null;
  }

  const store = getInMemoryStore();
  return store.records.get(id) ?? null;
}
