"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EditBetModal } from "@/components/EditBetModal";
import { WinPayoutDialog } from "@/components/WinPayoutDialog";
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2, Pencil } from "lucide-react";
import { type BetRecord } from "@/lib/bets";

interface BetTableProps {
  bets: BetRecord[];
  showActions?: boolean;
}

type SortKey = "date" | "game" | "betType" | "odds" | "amount" | "payout" | "status";
type SortDirection = "asc" | "desc";

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function getDisplayDate(bet: BetRecord): string {
  return bet.gameDate ?? bet.createdAt;
}

const statusSortOrder: Record<string, number> = {
  WIN: 0,
  PUSH: 1,
  PENDING: 2,
  LOSS: 3,
};

export function BetTable({ bets, showActions = false }: BetTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<BetRecord | null>(null);
  const [winTarget, setWinTarget] = useState<BetRecord | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedBets = useMemo(() => {
    const sorted = [...bets];
    sorted.sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "date") {
        return (new Date(getDisplayDate(a)).getTime() - new Date(getDisplayDate(b)).getTime()) * multiplier;
      }
      if (sortKey === "game") {
        return a.game.localeCompare(b.game) * multiplier;
      }
      if (sortKey === "betType") {
        return a.betType.localeCompare(b.betType) * multiplier;
      }
      if (sortKey === "odds") {
        return (a.odds - b.odds) * multiplier;
      }
      if (sortKey === "amount") {
        return (a.amount - b.amount) * multiplier;
      }
      if (sortKey === "payout") {
        return ((a.payout ?? -1) - (b.payout ?? -1)) * multiplier;
      }
      return ((statusSortOrder[a.status] ?? 999) - (statusSortOrder[b.status] ?? 999)) * multiplier;
    });
    return sorted;
  }, [bets, sortDirection, sortKey]);

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "date" ? "desc" : "asc");
  }

  function getSortIcon(key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
    return sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  }

  async function handleWinConfirm(payout: number) {
    if (!winTarget) return;
    setLoading(winTarget.id);
    setError(null);
    try {
      const res = await fetch(`/api/bets/${winTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WIN", payout }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to mark bet as WIN.");
      }
      setWinTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update bet.");
    } finally {
      setLoading(null);
    }
  }

  async function updateStatus(id: number, status: string) {
    setLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/bets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed to mark bet as ${status}.`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update bet.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDeleteConfirm() {
    if (deleteTarget === null) return;
    setLoading(deleteTarget);
    setError(null);
    try {
      const res = await fetch(`/api/bets/${deleteTarget}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete bet.");
      }
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bet.");
    } finally {
      setLoading(null);
    }
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No bets found.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mx-4 mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="md:hidden space-y-3 p-3">
        {sortedBets.map((bet) => {
          const displayDate = new Date(getDisplayDate(bet)).toLocaleDateString();
          return (
            <div key={bet.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-gray-500">{displayDate}</span>
                <StatusBadge status={bet.status} />
              </div>
              <p className="font-medium text-sm text-gray-900">{bet.game}</p>
              <p className="text-xs text-gray-600 mb-2">{bet.pick} • {bet.betType}</p>
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-gray-500">Odds</span>
                <span className="text-right">{formatOdds(bet.odds)}</span>
                <span className="text-gray-500">Wager</span>
                <span className="text-right">{formatCurrency(bet.amount)}</span>
                <span className="text-gray-500">Payout</span>
                <span className="text-right">{bet.payout != null ? formatCurrency(bet.payout) : "—"}</span>
              </div>
              {bet.notes && (
                <p className="mt-2 text-xs text-gray-600 border-t border-gray-100 pt-2">
                  <span className="font-medium text-gray-700">Notes:</span> {bet.notes}
                </p>
              )}
              {showActions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {bet.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-xs h-7"
                        disabled={loading === bet.id}
                        onClick={() => setWinTarget(bet)}
                      >
                        Win
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-7"
                        disabled={loading === bet.id}
                        onClick={() => updateStatus(bet.id, "LOSS")}
                      >
                        Loss
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7"
                        disabled={loading === bet.id}
                        onClick={() => updateStatus(bet.id, "PUSH")}
                      >
                        Push
                      </Button>
                    </>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-gray-500 hover:text-gray-700"
                    disabled={loading === bet.id}
                    onClick={() => setEditTarget(bet)}
                    title="Edit bet"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                    disabled={loading === bet.id}
                    onClick={() => setDeleteTarget(bet.id)}
                    title="Delete bet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("date")}>
                  Date {getSortIcon("date")}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("game")}>
                  Game {getSortIcon("game")}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("betType")}>
                  Bet Type {getSortIcon("betType")}
                </button>
              </TableHead>
              <TableHead>Pick</TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("odds")}>
                  Odds {getSortIcon("odds")}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("amount")}>
                  Wager {getSortIcon("amount")}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("payout")}>
                  Payout {getSortIcon("payout")}
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => handleSort("status")}>
                  Status {getSortIcon("status")}
                </button>
              </TableHead>
              <TableHead>Notes</TableHead>
              {showActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBets.map((bet) => {
              const displayDate = new Date(getDisplayDate(bet)).toLocaleDateString();
              return (
                <TableRow key={bet.id}>
                  <TableCell className="text-xs text-gray-500">{displayDate}</TableCell>
                  <TableCell className="font-medium">{bet.game}</TableCell>
                  <TableCell>{bet.betType}</TableCell>
                  <TableCell>{bet.pick}</TableCell>
                  <TableCell>{formatOdds(bet.odds)}</TableCell>
                  <TableCell>{formatCurrency(bet.amount)}</TableCell>
                  <TableCell>
                    {bet.payout != null ? formatCurrency(bet.payout) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={bet.status} />
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-gray-600" title={bet.notes ?? ""}>
                    {bet.notes || "—"}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {bet.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700 text-xs h-7"
                              disabled={loading === bet.id}
                              onClick={() => setWinTarget(bet)}
                            >
                              Win
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-7"
                              disabled={loading === bet.id}
                              onClick={() => updateStatus(bet.id, "LOSS")}
                            >
                              Loss
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs h-7"
                              disabled={loading === bet.id}
                              onClick={() => updateStatus(bet.id, "PUSH")}
                            >
                              Push
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-gray-500 hover:text-gray-700"
                          disabled={loading === bet.id}
                          onClick={() => setEditTarget(bet)}
                          title="Edit bet"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          disabled={loading === bet.id}
                          onClick={() => setDeleteTarget(bet.id)}
                          title="Delete bet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Bet"
        description="Are you sure you want to delete this bet? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        loading={loading !== null}
      />

      <EditBetModal
        bet={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
      />

      <WinPayoutDialog
        open={winTarget !== null}
        onOpenChange={(open) => { if (!open) setWinTarget(null); }}
        wagerAmount={winTarget?.amount ?? 0}
        odds={winTarget?.odds ?? 0}
        onConfirm={handleWinConfirm}
        loading={loading !== null}
      />
    </>
  );
}
