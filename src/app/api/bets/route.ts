import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

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
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { game, betType, pick, odds, amount, notes, gameDate, legs } = body;
    const normalizedGame = typeof game === "string" ? game.trim() : "";
    const normalizedBetType = typeof betType === "string" ? betType.trim() : "";

    if (!normalizedGame || !normalizedBetType || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return NextResponse.json({ error: "Wager amount must be a positive number" }, { status: 400 });
    }

    const isParlay = normalizedBetType === "Parlay";

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
          game: normalizedGame,
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

    const normalizedPick = typeof pick === "string" ? pick.trim() : "";
    if (!normalizedPick || odds === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const normalizedOdds = Number(odds);
    if (!Number.isFinite(normalizedOdds) || !Number.isInteger(normalizedOdds) || normalizedOdds === 0) {
      return NextResponse.json({ error: "Odds must be a non-zero integer" }, { status: 400 });
    }

    const bet = await prisma.bet.create({
      data: {
        game: normalizedGame,
        betType: normalizedBetType,
        pick: normalizedPick,
        odds: normalizedOdds,
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
