import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { calculateCombinedAmericanOdds, type ParlayLeg } from "@/lib/bets";
import { Prisma } from "@/generated/prisma/client";

function parseParlayLegs(value: unknown): ParlayLeg[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const legs = value.filter((leg): leg is Record<string, unknown> => typeof leg === "object" && leg !== null);
  if (legs.length !== value.length) return null;

  const parsed = legs.map((leg) => ({
    game: typeof leg.game === "string" ? leg.game.trim() : "",
    pick: typeof leg.pick === "string" ? leg.pick.trim() : "",
    odds: Number(leg.odds),
  }));

  const hasUniqueGames = new Set(parsed.map((leg) => leg.game)).size === parsed.length;
  return hasUniqueGames && parsed.every((leg) => leg.game && leg.pick && Number.isInteger(leg.odds) && leg.odds !== 0)
    ? parsed
    : null;
}

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
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { game, betType, pick, odds, amount, notes, gameDate, parlayLegs } = body;

    if (typeof game !== "string" || !game.trim()) {
      return NextResponse.json({ error: "Game is required" }, { status: 400 });
    }
    if (typeof betType !== "string" || !betType.trim()) {
      return NextResponse.json({ error: "Bet type is required" }, { status: 400 });
    }
    if (typeof pick !== "string" || !pick.trim()) {
      return NextResponse.json({ error: "Pick is required" }, { status: 400 });
    }

    const parsedParlayLegs = betType === "Parlay" ? parseParlayLegs(parlayLegs) : null;
    if (betType === "Parlay" && parsedParlayLegs === null) {
      return NextResponse.json({ error: "A parlay requires at least two valid legs" }, { status: 400 });
    }

    const parsedOdds = parseOdds(parsedParlayLegs ? calculateCombinedAmericanOdds(parsedParlayLegs) : odds);
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
        ...(parsedParlayLegs ? { parlayLegs: parsedParlayLegs as unknown as Prisma.InputJsonValue } : {}),
        status: "PENDING",
      },
    });

    return NextResponse.json(bet, { status: 201 });
  } catch (error) {
    console.error("POST /api/bets error:", error);
    return NextResponse.json({ error: "Failed to create bet" }, { status: 500 });
  }
}
