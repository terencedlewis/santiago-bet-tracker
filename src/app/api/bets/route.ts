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
    const { game, betType, pick, odds, amount, notes, gameDate, legs } = body;

    if (!game || !betType || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return NextResponse.json({ error: "Wager amount must be a positive number" }, { status: 400 });
    }

    const isParlay = String(betType) === "Parlay";

    if (isParlay) {
      const parlayLegs = Array.isArray(legs) ? legs : [];
      if (parlayLegs.length < 2) {
        return NextResponse.json({ error: "Parlays require at least two legs" }, { status: 400 });
      }

      const hasValidLegs = parlayLegs.every((leg) => {
        return leg && typeof leg === "object" && typeof leg.game === "string" && leg.game.trim() && typeof leg.selection === "string" && leg.selection.trim() && Number.isFinite(Number(leg.odds));
      });

      if (!hasValidLegs) {
        return NextResponse.json({ error: "Each parlay leg must include a game, selection, and odds" }, { status: 400 });
      }

      const bet = await prisma.bet.create({
        data: {
          game: String(game),
          betType: "Parlay",
          pick: null,
          odds: null,
          amount: normalizedAmount,
          payout: null,
          notes: notes ? String(notes) : null,
          gameDate: gameDate ? new Date(gameDate) : null,
          status: "PENDING",
          legs: parlayLegs.map((leg) => ({
            game: String(leg.game).trim(),
            selection: String(leg.selection).trim(),
            odds: Number(leg.odds),
            status: "PENDING",
          })),
        },
      });

      return NextResponse.json(bet, { status: 201 });
    }

    if (!pick || odds === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bet = await prisma.bet.create({
      data: {
        game: String(game),
        betType: String(betType),
        pick: String(pick),
        odds: Number(odds),
        amount: normalizedAmount,
        payout: null,
        notes: notes ? String(notes) : null,
        gameDate: gameDate ? new Date(gameDate) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error("POST /api/bets error:", error);
    return NextResponse.json({ error: "Failed to create bet" }, { status: 500 });
  }
}
