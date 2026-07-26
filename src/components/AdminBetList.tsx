"use client";

import { useMemo, useState } from "react";
import { BetTable } from "@/components/BetTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BET_TYPES, BET_STATUSES, type BetRecord } from "@/lib/bets";
import { quoteCsvField } from "@/lib/csv";

const ALL_LABEL = "All";

interface AdminBetListProps {
  bets: BetRecord[];
}

function exportToCsv(rows: BetRecord[]) {
  const header = [
    "id",
    "date",
    "game",
    "betType",
    "pick",
    "odds",
    "amount",
    "status",
    "payout",
    "notes",
  ];

  const lines = rows.map((b) => {
    const date = (b.gameDate ?? b.createdAt).slice(0, 10);
    return [
      String(b.id),
      date,
      b.game,
      b.betType,
      b.pick,
      String(b.odds),
      b.amount.toFixed(2),
      b.status,
      b.payout != null ? b.payout.toFixed(2) : "",
      b.notes ?? "",
    ].map(quoteCsvField).join(",");
  });

  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `bets-export-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AdminBetList({ bets }: AdminBetListProps) {
  const [status, setStatus] = useState(ALL_LABEL);
  const [betType, setBetType] = useState(ALL_LABEL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  function resetFilters() {
    setStatus(ALL_LABEL);
    setBetType(ALL_LABEL);
    setFromDate("");
    setToDate("");
    setSearch("");
  }

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      if (status !== ALL_LABEL && b.status !== status) return false;
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
  }, [bets, status, betType, fromDate, toDate, search]);

  const hasFilters = status !== ALL_LABEL || betType !== ALL_LABEL || fromDate || toDate || search;

  return (
    <div>
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="Game, pick, or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value={ALL_LABEL}>All Statuses</option>
              {BET_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">
            Showing {filtered.length} of {bets.length} bets
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={() => exportToCsv(filtered)}
            disabled={filtered.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <BetTable bets={filtered} showActions />
      </div>
    </div>
  );
}
