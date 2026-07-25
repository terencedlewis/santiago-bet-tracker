import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { AdminBetList } from "@/components/AdminBetList";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getAdminData() {
  const bets = await prisma.bet.findMany({ orderBy: { createdAt: "desc" } });

  const totalBets = bets.length;
  const wins = bets.filter((b) => b.status === "WIN").length;
  const losses = bets.filter((b) => b.status === "LOSS").length;
  const pushes = bets.filter((b) => b.status === "PUSH").length;
  const pending = bets.filter((b) => b.status === "PENDING").length;
  const settled = wins + losses;
  const winRate = settled > 0 ? ((wins / settled) * 100).toFixed(1) : "—";

  const totalWagered = bets.reduce((sum, b) => sum + b.amount, 0);

  const winBets = bets.filter((b) => b.status === "WIN");
  const totalReturned = winBets.reduce((sum, b) => sum + (b.payout ?? 0), 0);
  const totalLost = bets
    .filter((b) => b.status === "LOSS")
    .reduce((sum, b) => sum + b.amount, 0);
  const amountRiskedOnWins = winBets.reduce((sum, b) => sum + b.amount, 0);
  const netProfit = totalReturned - amountRiskedOnWins - totalLost;

  return {
    bets,
    totalBets,
    wins,
    losses,
    pushes,
    pending,
    winRate,
    totalWagered,
    netProfit,
  };
}

export default async function AdminPage() {
  const data = await getAdminData();

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Full overview of all bets and performance metrics
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Bets"
            value={data.totalBets}
            description="All time"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <StatCard
            title="Wins"
            value={data.wins}
            description="Settled wins"
            icon={<CheckCircle className="h-4 w-4" />}
            valueClassName="text-green-600"
          />
          <StatCard
            title="Losses"
            value={data.losses}
            description="Settled losses"
            icon={<XCircle className="h-4 w-4" />}
            valueClassName="text-red-600"
          />
          <StatCard
            title="Pushes"
            value={data.pushes}
            description="Returned stake"
            icon={<MinusCircle className="h-4 w-4" />}
            valueClassName="text-gray-500"
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
            title="Total Wagered"
            value={`$${data.totalWagered.toFixed(2)}`}
            description="Sum of all wagers"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatCard
            title="Net Profit"
            value={`${data.netProfit >= 0 ? "+" : ""}$${Math.abs(data.netProfit).toFixed(2)}`}
            description="Wins minus losses"
            icon={<DollarSign className="h-4 w-4" />}
            valueClassName={data.netProfit >= 0 ? "text-green-600" : "text-red-600"}
          />
          <StatCard
            title="Pending"
            value={data.pending}
            description="Awaiting results"
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        {/* All bets table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Bets</h2>
          <AdminBetList
            bets={data.bets.map((b) => ({
              ...b,
              createdAt: b.createdAt.toISOString(),
              gameDate: b.gameDate ? b.gameDate.toISOString() : null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
