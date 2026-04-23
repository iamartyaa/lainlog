import { GOATCOUNTER_CODE } from "./site";

const ENDPOINT = `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/total`;

export async function getUniqueReaderCount(): Promise<number | null> {
  const mock = process.env.READER_COUNT_MOCK;
  if (mock) {
    const n = Number(mock);
    return Number.isFinite(n) ? n : null;
  }

  const token = process.env.GOATCOUNTER_API_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { total?: number };
    return typeof data.total === "number" ? data.total : null;
  } catch {
    return null;
  }
}
