import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseOdds(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed === 0) {
    return null;
  }
  return parsed;
}

function parsePositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseOptionalDate(value: unknown): Date | null {
  if (value == null || value === "") {
    return null;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

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
    const { game, betType, pick, odds, amount, notes, gameDate } = body;

    if (typeof game !== "string" || !game.trim()) {
      return NextResponse.json({ error: "Game is required" }, { status: 400 });
    }
    if (typeof betType !== "string" || !betType.trim()) {
      return NextResponse.json({ error: "Bet type is required" }, { status: 400 });
    }
    if (typeof pick !== "string" || !pick.trim()) {
      return NextResponse.json({ error: "Pick is required" }, { status: 400 });
    }

    const parsedOdds = parseOdds(odds);
    if (parsedOdds === null) {
      return NextResponse.json({ error: "Odds must be a non-zero integer" }, { status: 400 });
    }

    const parsedAmount = parsePositiveNumber(amount);
    if (parsedAmount === null) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const parsedGameDate = parseOptionalDate(gameDate);
    if (gameDate !== undefined && gameDate !== null && gameDate !== "" && parsedGameDate === null) {
      return NextResponse.json({ error: "Game date is invalid" }, { status: 400 });
    }

    const bet = await prisma.bet.create({
      data: {
        game: game.trim(),
        betType: betType.trim(),
        pick: pick.trim(),
        odds: parsedOdds,
        amount: parsedAmount,
        payout: null,
        notes: notes != null && notes !== "" ? String(notes) : null,
        gameDate: parsedGameDate,
        status: "PENDING",
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error("POST /api/bets error:", error);
    return NextResponse.json({ error: "Failed to create bet" }, { status: 500 });
  }
}
