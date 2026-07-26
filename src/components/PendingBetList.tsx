"use client";

import { useMemo, useState } from "react";
import { BetTable } from "@/components/BetTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BET_TYPES, type BetRecord } from "@/lib/bets";

const ALL_LABEL = "All";

interface PendingBetListProps {
  bets: BetRecord[];
}

export function PendingBetList({ bets }: PendingBetListProps) {
  const [betType, setBetType] = useState(ALL_LABEL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  function resetFilters() {
    setBetType(ALL_LABEL);
    setFromDate("");
    setToDate("");
    setSearch("");
  }

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      if (betType !== ALL_LABEL && b.betType !== betType) return false;

      const dateStr = (b.gameDate ?? b.createdAt).slice(0, 10);
      if (fromDate && dateStr < fromDate) return false;
      if (toDate && dateStr > toDate) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !b.game.toLowerCase().includes(q) &&
          !b.pick.toLowerCase().includes(q) &&
          !(b.notes ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [bets, betType, fromDate, toDate, search]);

  const hasFilters = betType !== ALL_LABEL || fromDate || toDate || search;

  return (
    <div>
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="Game, pick, or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bet Type</Label>
            <Select value={betType} onChange={(e) => setBetType(e.target.value)}>
              <option value={ALL_LABEL}>All Types</option>
              {BET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Showing {filtered.length} of {bets.length} pending bets
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BetTable bets={filtered} showActions />
      </div>
    </div>
  );
}
