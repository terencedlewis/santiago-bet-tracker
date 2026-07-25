import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { BetTable } from "@/components/BetTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getPendingBets() {
  return prisma.bet.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export default async function PendingBetsPage() {
  const bets = await getPendingBets();

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Bets</h1>
            <p className="text-sm text-gray-500 mt-1">
              {bets.length} bet{bets.length !== 1 ? "s" : ""} awaiting results
            </p>
          </div>
          <Link href="/add-bet">
            <Button>+ Add Bet</Button>
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <BetTable
            bets={bets.map((b) => ({
              ...b,
              createdAt: b.createdAt.toISOString(),
              gameDate: b.gameDate ? b.gameDate.toISOString() : null,
            }))}
            showActions
          />
        </div>
      </div>
    </div>
  );
}
