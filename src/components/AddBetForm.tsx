"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BET_TYPES, calculateEstimatedPayout, calculateParlayPayout } from "@/lib/bets";
import { buildOddsGameLabel, type OddsSuggestion } from "@/lib/mlb-odds";

export function AddBetForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oddsSuggestions, setOddsSuggestions] = useState<OddsSuggestion[]>([]);

  const [form, setForm] = useState<{
    game: string;
    betType: string;
    pick: string;
    odds: string;
    amount: string;
    notes: string;
    gameDate: string;
    legs: Array<{ selection: string; odds: string }>;
  }>({
    game: "",
    betType: BET_TYPES[0],
    pick: "",
    odds: "",
    amount: "",
    notes: "",
    gameDate: "",
    legs: [
      { selection: "", odds: "" },
      { selection: "", odds: "" },
    ],
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function updateLeg(index: number, field: "selection" | "odds", value: string) {
    setForm((current) => ({
      ...current,
      legs: current.legs.map((leg, legIndex) =>
        legIndex === index ? { ...leg, [field]: value } : leg
      ),
    }));
  }

  function addParlayLeg() {
    setForm((current) => ({
      ...current,
      legs: [...current.legs, { selection: "", odds: "" }],
    }));
  }

  function removeParlayLeg(index: number) {
    setForm((current) => ({
      ...current,
      legs: current.legs.length > 2 ? current.legs.filter((_, legIndex) => legIndex !== index) : current.legs,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(form.amount);
    const isParlay = form.betType === "Parlay";

    if (!form.game.trim()) {
      setError("Game is required.");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setError("Wager amount must be a positive number.");
      return;
    }

    if (isParlay) {
      const validLegs = form.legs
        .filter((leg) => leg.selection.trim() || leg.odds.trim())
        .map((leg) => ({
          selection: leg.selection.trim(),
          odds: parseInt(leg.odds, 10),
        }));

      if (validLegs.length < 2) {
        setError("Parlays require at least two valid legs.");
        return;
      }

      const hasInvalidLeg = validLegs.some((leg) => !leg.selection || Number.isNaN(leg.odds));
      if (hasInvalidLeg) {
        setError("Each parlay leg needs a selection and valid odds.");
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
            amount,
            notes: form.notes.trim() || null,
            gameDate: form.gameDate || null,
            legs: validLegs.map((leg) => ({
              selection: leg.selection,
              odds: leg.odds,
            })),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to save bet.");
          return;
        }

        router.push("/pending?success=created");
        router.refresh();
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const odds = parseInt(form.odds, 10);
    if (!form.pick.trim()) {
      setError("Pick is required.");
      return;
    }
    if (isNaN(odds)) {
      setError("Odds must be a valid number (e.g. -110 or +150).");
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

      router.push("/pending?success=created");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const oddsNum = parseInt(form.odds, 10);
  const amountNum = parseFloat(form.amount);
  const parlayOdds = form.legs
    .map((leg) => parseInt(leg.odds, 10))
    .filter((odds) => !Number.isNaN(odds));
  const previewPayout = isParlay
    ? parlayOdds.length >= 2 && !isNaN(amountNum) && amountNum > 0
      ? calculateParlayPayout(amountNum, parlayOdds)
      : null
    : !isNaN(oddsNum) && !isNaN(amountNum) && amountNum > 0
      ? calculateEstimatedPayout(amountNum, oddsNum)
      : null;

  const isParlay = form.betType === "Parlay";

  useEffect(() => {
    async function loadOdds() {
      setOddsLoading(true);
      try {
        const res = await fetch("/api/mlb/odds");
        if (!res.ok) return;
        const data = (await res.json()) as Array<{
          away_team: string;
          home_team: string;
          commence_time: string;
          bookmakers?: Array<{
            markets?: Array<{
              key?: string;
              outcomes?: Array<{ name?: string; price?: number }>;
            }>;
          }>;
        }>;

        const suggestions = (data ?? []).flatMap((game) => {
          const gameLabel = buildOddsGameLabel(game);
          const market = game.bookmakers
            ?.flatMap((bookmaker) => bookmaker.markets ?? [])
            .find((item) => item.key === "h2h");

          return (market?.outcomes ?? [])
            .filter((outcome): outcome is { name: string; price: number } => !!outcome.name && outcome.price != null)
            .map((outcome) => ({
              game: gameLabel,
              pick: outcome.name,
              odds: Number(outcome.price),
              commenceTime: game.commence_time,
            }));
        });

        setOddsSuggestions(suggestions.slice(0, 12));
      } catch {
        // Ignore odds fetch failures for local POC fallback.
      } finally {
        setOddsLoading(false);
      }
    }

    loadOdds();
  }, []);

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

          {oddsSuggestions.length > 0 && (
            <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-medium text-blue-800">MLB live odds suggestions</Label>
                {oddsLoading && <span className="text-xs text-blue-700">Loading…</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {oddsSuggestions.map((suggestion) => (
                  <Button
                    key={`${suggestion.game}-${suggestion.pick}-${suggestion.odds}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setForm((current) => ({
                        ...current,
                        game: suggestion.game,
                        pick: suggestion.pick,
                        odds: String(suggestion.odds),
                      }));
                    }}
                  >
                    {suggestion.game} • {suggestion.pick} {suggestion.odds}
                  </Button>
                ))}
              </div>
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

            {!isParlay && (
              <>
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
              </>
            )}

            {isParlay && (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Parlay Legs *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addParlayLeg}>
                    Add leg
                  </Button>
                </div>

                <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                  {form.legs.map((leg, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                      <div className="space-y-1.5">
                        <Label htmlFor={`leg-selection-${index}`}>Selection</Label>
                        <Input
                          id={`leg-selection-${index}`}
                          value={leg.selection}
                          onChange={(e) => updateLeg(index, "selection", e.target.value)}
                          placeholder="e.g. Yankees ML"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor={`leg-odds-${index}`}>Odds</Label>
                        <Input
                          id={`leg-odds-${index}`}
                          type="number"
                          value={leg.odds}
                          onChange={(e) => updateLeg(index, "odds", e.target.value)}
                          placeholder="e.g. -110"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 text-red-600"
                        onClick={() => removeParlayLeg(index)}
                        disabled={form.legs.length <= 2}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
