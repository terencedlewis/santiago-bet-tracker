"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BET_TYPES, type BetRecord, calculateEstimatedPayout } from "@/lib/bets";

interface EditBetModalProps {
  bet: BetRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBetModal({ bet, open, onOpenChange }: EditBetModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    game: "",
    betType: BET_TYPES[0],
    pick: "",
    odds: "",
    amount: "",
    notes: "",
    gameDate: "",
  });

  useEffect(() => {
    if (bet) {
      setForm({
        game: bet.game,
        betType: bet.betType,
        pick: bet.pick,
        odds: String(bet.odds),
        amount: String(bet.amount),
        notes: bet.notes ?? "",
        gameDate: bet.gameDate ? bet.gameDate.slice(0, 10) : "",
      });
      setError(null);
    }
  }, [bet]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bet) return;
    setError(null);

    const odds = parseInt(form.odds, 10);
    const amount = parseFloat(form.amount);

    if (!form.game.trim() || !form.pick.trim()) {
      setError("Game and Pick are required.");
      return;
    }
    if (isNaN(odds)) {
      setError("Odds must be a valid number (e.g. -110 or +150).");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError("Wager amount must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/bets/${bet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: form.game.trim(),
          betType: form.betType,
          pick: form.pick.trim(),
          odds,
          amount,
          notes: form.notes.trim() || null,
          gameDate: form.gameDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update bet.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const oddsNum = parseInt(form.odds, 10);
  const amountNum = parseFloat(form.amount);
  const previewPayout =
    !isNaN(oddsNum) && !isNaN(amountNum) && amountNum > 0
      ? calculateEstimatedPayout(amountNum, oddsNum)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-game">Game *</Label>
              <Input
                id="edit-game"
                name="game"
                placeholder="e.g. Yankees vs Red Sox"
                value={form.game}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-betType">Bet Type *</Label>
              <Select
                id="edit-betType"
                name="betType"
                value={form.betType}
                onChange={handleChange}
              >
                {BET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-pick">Pick *</Label>
              <Input
                id="edit-pick"
                name="pick"
                placeholder="e.g. Yankees ML"
                value={form.pick}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-odds">Odds *</Label>
              <Input
                id="edit-odds"
                name="odds"
                type="number"
                placeholder="e.g. -110 or +150"
                value={form.odds}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-amount">Wager ($) *</Label>
              <Input
                id="edit-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 50.00"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-gameDate">Game Date</Label>
              <Input
                id="edit-gameDate"
                name="gameDate"
                type="date"
                value={form.gameDate}
                onChange={handleChange}
              />
            </div>

            {previewPayout !== null && bet?.status === "PENDING" && (
              <div className="space-y-1.5">
                <Label>Estimated Payout</Label>
                <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-green-700 font-medium">
                  ${previewPayout.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
