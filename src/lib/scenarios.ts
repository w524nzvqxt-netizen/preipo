export type Scenario = { key: string; color: "amber" | "sky" | "emerald"; mult: number; val: number; irr?: string };

// Unknown models must never look like guaranteed capital preservation.
export function parseScenarios(json: string | null): Scenario[] | null {
  try {
    const rows: unknown = JSON.parse(json ?? "null");
    if (!Array.isArray(rows) || rows.length !== 3) return null;
    const colors = ["amber", "sky", "emerald"] as const;
    const result: Scenario[] = [];
    for (const color of colors) {
      const matches = rows.filter((s) => s && typeof s === "object" && s.color === color);
      if (matches.length !== 1) return null;
      const row = matches[0];
      if (typeof row.mult !== "number" || !Number.isFinite(row.mult) || row.mult < 0) return null;
      result.push({ color, key: color === "amber" ? "Пессимистичный" : color === "sky" ? "Базовый" : "Оптимистичный", mult: row.mult, val: row.mult * 100_000 });
    }
    if (result[0].mult > result[1].mult || result[1].mult > result[2].mult) return null;
    return result;
  } catch { return null; }
}

export function exitPeriodStart(value: string | null): number {
  const text = (value ?? "").toUpperCase();
  const year = text.match(/(?<!\d)(20\d{2})(?!\d)/);
  if (!year) return Infinity;
  const quarter = text.match(/(?:Q([1-4])|([1-4])Q)/);
  const half = text.match(/(?:H([12])|([12])H)/);
  const month = quarter ? (Number(quarter[1] ?? quarter[2]) - 1) * 3 : half ? (Number(half[1] ?? half[2]) - 1) * 6 : 0;
  return Date.UTC(Number(year[1]), month, 1);
}
