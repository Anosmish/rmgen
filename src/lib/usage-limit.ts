import { cookies } from "next/headers";

const DAILY_LIMIT = 5;
const COOKIE_NAME = "gen_usage";

interface UsageData {
  date: string;
  count: number;
}

function currentDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMidnightExpiry(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
}

export function consumeDailyUsageLimit(
  _key: string,
  limit = DAILY_LIMIT,
): { allowed: boolean; remaining: number } {
  const cookieStore = cookies();
  const today = currentDateKey();

  let data: UsageData = { date: today, count: 0 };

  const existing = cookieStore.get(COOKIE_NAME);
  if (existing) {
    try {
      const parsed = JSON.parse(existing.value) as UsageData;
      if (parsed.date === today) {
        data = parsed;
      }
    } catch {
      // ignore malformed cookie
    }
  }

  if (data.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  data.count += 1;

  cookieStore.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: getMidnightExpiry(),
  });

  return { allowed: true, remaining: limit - data.count };
}
