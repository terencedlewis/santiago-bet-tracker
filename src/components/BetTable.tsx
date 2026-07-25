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
import { Trash2 } from "lucide-react";

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

  async function deleteBet(id: number) {
    if (!confirm("Delete this bet?")) return;
    setLoading(id);
    try {
      await fetch(`/api/bets/${id}`, { method: "DELETE" });
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
        {bets.map((bet) => (
          <TableRow key={bet.id}>
            <TableCell className="text-xs text-gray-500">
              {new Date(bet.createdAt).toLocaleDateString()}
            </TableCell>
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
                        onClick={() => updateStatus(bet.id, "WIN")}
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
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                    disabled={loading === bet.id}
                    onClick={() => deleteBet(bet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
