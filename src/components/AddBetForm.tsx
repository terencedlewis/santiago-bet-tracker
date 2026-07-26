"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BET_TYPES, calculateEstimatedPayout } from "@/lib/bets";

export function AddBetForm() {
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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const res = await fetch("/api/bets", {
        method: "POST",
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
        setError(data.error || "Failed to save bet.");
        return;
      }

      router.push("/pending");
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>New MLB Bet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="game">Game *</Label>
              <Input
                id="game"
                name="game"
                placeholder="e.g. Yankees vs Red Sox"
                value={form.game}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="betType">Bet Type *</Label>
              <Select
                id="betType"
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
              <Label htmlFor="pick">Pick *</Label>
              <Input
                id="pick"
                name="pick"
                placeholder="e.g. Yankees ML"
                value={form.pick}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="odds">Odds *</Label>
              <Input
                id="odds"
                name="odds"
                type="number"
                placeholder="e.g. -110 or +150"
                value={form.odds}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Wager ($) *</Label>
              <Input
                id="amount"
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

            {previewPayout !== null && (
              <div className="space-y-1.5">
                <Label>Estimated Payout</Label>
                <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-green-700 font-medium">
                  ${previewPayout.toFixed(2)}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="gameDate">Game Date</Label>
              <Input
                id="gameDate"
                name="gameDate"
                type="date"
                value={form.gameDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Bet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
