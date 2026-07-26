import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { BetTable } from "@/components/BetTable";
import { ProfitChart } from "@/components/ProfitChart";
import { BarChart3, DollarSign, TrendingUp, Clock, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function computeStreak(settled: { status: string }[]): { type: "W" | "L"; count: number } | null {
  if (settled.length === 0) return null;
  const last = settled[0].status as "WIN" | "LOSS";
  if (last !== "WIN" && last !== "LOSS") return null;
  let count = 0;
  for (const b of settled) {
    if (b.status === last) count++;
    else break;
  }
  return { type: last === "WIN" ? "W" : "L", count };
}

async function getDashboardData() {
  const [allBets, recentBets, settledBets] = await Promise.all([
    prisma.bet.findMany({ select: { status: true, amount: true, payout: true } }),
    prisma.bet.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.bet.findMany({
      where: { status: { in: ["WIN", "LOSS"] } },
      orderBy: { updatedAt: "desc" },
      select: { status: true, amount: true, payout: true, updatedAt: true },
    }),
  ]);

  const totalBets = allBets.length;
  const wins = allBets.filter((b) => b.status === "WIN").length;
  const losses = allBets.filter((b) => b.status === "LOSS").length;
  const pending = allBets.filter((b) => b.status === "PENDING").length;
  const settled = wins + losses;
  const winRate = settled > 0 ? ((wins / settled) * 100).toFixed(1) : "—";

  const totalReturned = allBets
    .filter((b) => b.status === "WIN" && b.payout != null)
    .reduce((sum, b) => sum + (b.payout ?? 0), 0);
  const amountRiskedOnWins = allBets
    .filter((b) => b.status === "WIN")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalLost = allBets
    .filter((b) => b.status === "LOSS")
    .reduce((sum, b) => sum + b.amount, 0);
  const netProfit = totalReturned - amountRiskedOnWins - totalLost;

  const streak = computeStreak(settledBets);

  // Build cumulative net profit over time for chart
  const chronological = [...settledBets].reverse();
  let running = 0;
  const chartData = chronological.map((b) => {
    if (b.status === "WIN") {
      running += (b.payout ?? 0) - b.amount;
    } else {
      running -= b.amount;
    }
    return {
      date: b.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      net: Math.round(running * 100) / 100,
    };
  });

  return {
    totalBets,
    wins,
    losses,
    pending,
    winRate,
    netProfit,
    recentBets,
    streak,
    chartData,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Your betting overview</p>
          </div>
          <Link href="/add-bet">
            <Button>+ Add Bet</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Bets"
            value={data.totalBets}
            description="All-time bets placed"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <StatCard
            title="Win Rate"
            value={data.winRate === "—" ? "—" : `${data.winRate}%`}
            description={`${data.wins}W / ${data.losses}L`}
            icon={<TrendingUp className="h-4 w-4" />}
            valueClassName={
              data.winRate !== "—" && parseFloat(data.winRate) >= 50
                ? "text-green-600"
                : "text-gray-900"
            }
          />
          <StatCard
            title="Net Profit"
            value={`${data.netProfit >= 0 ? "+" : ""}$${Math.abs(data.netProfit).toFixed(2)}`}
            description="Settled bets"
            icon={<DollarSign className="h-4 w-4" />}
            valueClassName={data.netProfit >= 0 ? "text-green-600" : "text-red-600"}
          />
          {data.streak ? (
            <StatCard
              title="Current Streak"
              value={`${data.streak.count}${data.streak.type}`}
              description={data.streak.type === "W" ? "Win streak 🔥" : "Loss streak"}
              icon={<Flame className="h-4 w-4" />}
              valueClassName={data.streak.type === "W" ? "text-green-600" : "text-red-600"}
            />
          ) : (
            <StatCard
              title="Pending"
              value={data.pending}
              description="Awaiting results"
              icon={<Clock className="h-4 w-4" />}
            />
          )}
        </div>

        {/* Net Profit Chart */}
        {data.chartData.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Net Profit Over Time</h2>
            <ProfitChart data={data.chartData} />
          </div>
        )}

        {/* Recent Bets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bets</h2>
            <Link href="/pending" className="text-sm text-blue-600 hover:underline">
              View pending →
            </Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <BetTable bets={data.recentBets.map((b) => ({
              ...b,
              createdAt: b.createdAt.toISOString(),
              gameDate: b.gameDate ? b.gameDate.toISOString() : null,
            }))} />
          </div>
        </div>
      </div>
    </div>
  );
}
