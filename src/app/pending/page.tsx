import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { PendingBetList } from "@/components/PendingBetList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeParlayLegs } from "@/lib/bets";

export const dynamic = "force-dynamic";

async function getPendingBets() {
  return prisma.bet.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

interface PendingBetsPageProps {
  searchParams?: Promise<{ success?: string }>;
}

export default async function PendingBetsPage({ searchParams }: PendingBetsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const bets = await getPendingBets();
  const successMessage = params?.success === "created" ? "Bet added successfully." : null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 max-w-6xl">
        {successMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

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

        <PendingBetList
          bets={bets.map((b) => ({
            ...b,
            createdAt: b.createdAt.toISOString(),
            gameDate: b.gameDate ? b.gameDate.toISOString() : null,
            legs: normalizeParlayLegs(b.legs),
          }))}
        />
      </div>
    </div>
  );
}
