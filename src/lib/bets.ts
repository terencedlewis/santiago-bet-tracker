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

export interface BetRecord {
  id: number;
  game: string;
  betType: string;
  pick: string;
  odds: number;
  amount: number;
  status: string;
  payout: number | null;
  notes: string | null;
  createdAt: string;
  gameDate: string | null;
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
