"use client";

import { useState, useMemo } from "react";
import { BetTable } from "@/components/BetTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const BET_TYPES = ["All", "Moneyline", "Run Line", "Over/Under", "First 5 Innings", "Parlay", "Prop"];
const STATUSES = ["All", "PENDING", "WIN", "LOSS", "PUSH"];

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

interface AdminBetListProps {
  bets: Bet[];
}

export function AdminBetList({ bets }: AdminBetListProps) {
  const [status, setStatus] = useState("All");
  const [betType, setBetType] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  function resetFilters() {
    setStatus("All");
    setBetType("All");
    setFromDate("");
    setToDate("");
    setSearch("");
  }

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      if (status !== "All" && b.status !== status) return false;
      if (betType !== "All" && b.betType !== betType) return false;

      const dateStr = (b.gameDate ?? b.createdAt).slice(0, 10);
      if (fromDate && dateStr < fromDate) return false;
      if (toDate && dateStr > toDate) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !b.game.toLowerCase().includes(q) &&
          !b.pick.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [bets, status, betType, fromDate, toDate, search]);

  const hasFilters = status !== "All" || betType !== "All" || fromDate || toDate || search;

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="Game or pick…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bet Type</Label>
            <Select value={betType} onChange={(e) => setBetType(e.target.value)}>
              {BET_TYPES.map((t) => (
                <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>
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
        {hasFilters && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Showing {filtered.length} of {bets.length} bets
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BetTable bets={filtered} showActions />
      </div>
    </div>
  );
}
