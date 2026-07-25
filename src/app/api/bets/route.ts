import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const bets = await prisma.bet.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error("GET /api/bets error:", error);
    return NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game, betType, pick, odds, amount, payout, notes } = body;

    if (!game || !betType || !pick || odds === undefined || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bet = await prisma.bet.create({
      data: {
        game: String(game),
        betType: String(betType),
        pick: String(pick),
        odds: Number(odds),
        amount: Number(amount),
        payout: payout != null ? Number(payout) : null,
        notes: notes ? String(notes) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error("POST /api/bets error:", error);
    return NextResponse.json({ error: "Failed to create bet" }, { status: 500 });
  }
}
