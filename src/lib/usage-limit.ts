const usageStore = new Map<string, { date: string; count: number }>();

const DEFAULT_DAILY_LIMIT = 20;

function currentDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function consumeDailyUsageLimit(
  key: string,
  limit = DEFAULT_DAILY_LIMIT,
): { allowed: boolean; remaining: number } {
  const today = currentDateKey();
  const existing = usageStore.get(key);

  if (!existing || existing.date !== today) {
    usageStore.set(key, { date: today, count: 1 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  usageStore.set(key, existing);

  return { allowed: true, remaining: limit - existing.count };
}
