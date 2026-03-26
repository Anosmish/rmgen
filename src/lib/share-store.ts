import { randomUUID } from "crypto";

import type { SharedReadmeRecord } from "@/types/share";

const MAX_SHARE_ITEMS = 500;

interface SharedReadmeStore {
  records: Map<string, SharedReadmeRecord>;
  orderedIds: string[];
}

const storeKey = "__README_SHARE_STORE__";
const globalStore = globalThis as typeof globalThis & {
  [storeKey]?: SharedReadmeStore;
};

function getStore(): SharedReadmeStore {
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

export function createSharedReadme(input: {
  readme: string;
  repoFullName: string;
  template: SharedReadmeRecord["template"];
  createdBy: string;
}): SharedReadmeRecord {
  const store = getStore();
  const id = randomUUID().replace(/-/g, "").slice(0, 16);

  const record: SharedReadmeRecord = {
    id,
    readme: input.readme,
    repoFullName: input.repoFullName,
    template: input.template,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };

  store.records.set(id, record);
  store.orderedIds.push(id);
  evictOldEntriesIfNeeded(store);

  return record;
}

export function getSharedReadmeById(id: string): SharedReadmeRecord | null {
  const store = getStore();
  return store.records.get(id) ?? null;
}
