export const BET_TYPES = [
  "Moneyline",
  "Run Line",
  "Over/Under",
  "First 5 Innings",
  "Parlay",
  "Prop",
] as const;

export const BET_STATUSES = ["PENDING", "WIN", "LOSS", "PUSH"] as const;

export type BetStatus = (typeof BET_STATUSES)[number];
export type ParlayLegStatus = BetStatus;

export interface BetLeg {
  game: string;
  selection: string;
  odds: number;
  status?: ParlayLegStatus;
}

export interface BetRecord {
  id: number;
  game: string;
  betType: string;
  pick: string | null;
  odds: number | null;
  amount: number;
  status: string;
  payout: number | null;
  notes: string | null;
  createdAt: string;
  gameDate: string | null;
  legs?: BetLeg[] | null;
}

export interface ParlayLegInput {
  game?: string;
  selection?: string;
  odds: number;
  status: ParlayLegStatus;
}

/**
 * American odds payout calculator.
 * Examples:
 * - +150 on $100 returns $250 total.
 * - -150 on $100 returns about $166.67 total.
 */
export function calculateEstimatedPayout(amount: number, odds: number): number {
  if (odds > 0) {
    return amount + (amount * odds) / 100;
  }
  return amount + (amount * 100) / Math.abs(odds);
}

export function americanToDecimalOdds(odds: number): number {
  if (odds > 0) {
    return 1 + odds / 100;
  }
  return 1 + 100 / Math.abs(odds);
}

export function calculateParlayPayout(stake: number, oddsList: number[]): number {
  const multiplier = oddsList.reduce((total, odds) => total * americanToDecimalOdds(odds), 1);
  return stake * multiplier;
}

export function normalizeParlayLegs(value: unknown): BetLeg[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): BetLeg | null => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const game = typeof candidate.game === "string" ? candidate.game.trim() : "";
      const selection = typeof candidate.selection === "string" ? candidate.selection.trim() : "";
      const odds = Number(candidate.odds);
      if (!selection || !Number.isFinite(odds)) {
        return null;
      }
      const status =
        typeof candidate.status === "string" && (BET_STATUSES as readonly string[]).includes(candidate.status)
          ? (candidate.status as ParlayLegStatus)
          : "PENDING";
      return { game, selection, odds, status };
    })
    .filter((entry): entry is BetLeg => entry !== null);
}

export function calculateParlayResult(
  stake: number,
  legs: ParlayLegInput[]
): {
  status: BetStatus;
  totalPayout: number | null;
  profit: number | null;
} {
  const activeLegs = legs.filter((leg) => leg.status !== "PUSH");

  if (activeLegs.length === 0) {
    return { status: "PUSH", totalPayout: 0, profit: 0 };
  }

  if (activeLegs.some((leg) => leg.status === "LOSS")) {
    return { status: "LOSS", totalPayout: 0, profit: -stake };
  }

  if (activeLegs.some((leg) => leg.status === "PENDING")) {
    return { status: "PENDING", totalPayout: null, profit: null };
  }

  const totalMultiplier = activeLegs.reduce((total, leg) => total * americanToDecimalOdds(leg.odds), 1);
  const totalPayout = stake * totalMultiplier;

  return {
    status: "WIN",
    totalPayout,
    profit: totalPayout - stake,
  };
}
