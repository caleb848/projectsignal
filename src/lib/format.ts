export function money(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact !== false && Math.abs(n) >= 1000) {
    const k = n / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export const pct = (n: number, digits = 0) => `${n.toFixed(digits)}%`;

export const signedPct = (n: number, digits = 1) => `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;

/** Lower-cases the first letter unless the word is an acronym ("DNS", "QA"). */
export const lowerFirst = (s: string) =>
  /^[A-Z][A-Z0-9&]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);

/** "Brightmere · IT Director" → "Brightmere" */
export const orgOf = (owner: string) => owner.split(" · ")[0];

export function listToSentence(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export const shortName = (projectName: string) => projectName.split(" ")[0];
