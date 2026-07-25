"use client";

import { useState } from "react";
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
import { Trash2, Pencil } from "lucide-react";

interface Bet {
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

interface BetTableProps {
  bets: Bet[];
  showActions?: boolean;
}

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function BetTable({ bets, showActions = false }: BetTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Bet | null>(null);
  const [winTarget, setWinTarget] = useState<Bet | null>(null);

  async function handleWinConfirm(payout: number) {
    if (!winTarget) return;
    setLoading(winTarget.id);
    try {
      await fetch(`/api/bets/${winTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WIN", payout }),
      });
      setWinTarget(null);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function updateStatus(id: number, status: string) {
    setLoading(id);
    try {
      await fetch(`/api/bets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDeleteConfirm() {
    if (deleteTarget === null) return;
    setLoading(deleteTarget);
    try {
      await fetch(`/api/bets/${deleteTarget}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Game</TableHead>
            <TableHead>Bet Type</TableHead>
            <TableHead>Pick</TableHead>
            <TableHead>Odds</TableHead>
            <TableHead>Wager</TableHead>
            <TableHead>Payout</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet) => {
            const displayDate = bet.gameDate
              ? new Date(bet.gameDate).toLocaleDateString()
              : new Date(bet.createdAt).toLocaleDateString();
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
        estimatedPayout={winTarget?.payout ?? winTarget?.amount ?? 0}
        onConfirm={handleWinConfirm}
        loading={loading !== null}
      />
    </>
  );
}

