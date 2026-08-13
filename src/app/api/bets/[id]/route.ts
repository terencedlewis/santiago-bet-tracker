import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BET_STATUSES, type BetStatus } from "@/lib/bets";

type Params = { params: Promise<{ id: string }> };

function isBetStatus(status: unknown): status is BetStatus {
  return typeof status === "string" && (BET_STATUSES as readonly string[]).includes(status);
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

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const betId = Number(id);
    if (!Number.isInteger(betId)) {
      return NextResponse.json({ error: "Invalid bet id" }, { status: 400 });
    }

    const bet = await prisma.bet.findUnique({ where: { id: betId } });
    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    return NextResponse.json(bet);
  } catch (error) {
    console.error("GET /api/bets/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch bet" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const betId = Number(id);
    if (!Number.isInteger(betId)) {
      return NextResponse.json({ error: "Invalid bet id" }, { status: 400 });
    }

    const body = await request.json();
    const { status, payout } = body;
    const existingBet = await prisma.bet.findUnique({ where: { id: betId } });
    if (!existingBet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    if (!isBetStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    let normalizedPayout: number | null = null;
    if (status === "WIN") {
      normalizedPayout = parsePositiveNumber(payout);
      if (normalizedPayout === null) {
        return NextResponse.json({ error: "Payout is required for WIN status" }, { status: 400 });
      }
      if (normalizedPayout <= existingBet.amount) {
        return NextResponse.json({ error: "Payout must be greater than the wager amount for a win" }, { status: 400 });
      }
    }

    const bet = await prisma.bet.update({
      where: { id: betId },
      data: {
        status,
        payout: normalizedPayout,
      },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("PATCH /api/bets/[id] error:", error);
    return NextResponse.json({ error: "Failed to update bet" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const betId = Number(id);
    if (!Number.isInteger(betId)) {
      return NextResponse.json({ error: "Invalid bet id" }, { status: 400 });
    }

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

    const parsedOdds = Number(odds);
    if (!Number.isFinite(parsedOdds) || !Number.isInteger(parsedOdds) || parsedOdds === 0) {
      return NextResponse.json({ error: "Odds must be a non-zero integer" }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const parsedGameDate = parseOptionalDate(gameDate);
    if (gameDate !== undefined && gameDate !== null && gameDate !== "" && parsedGameDate === null) {
      return NextResponse.json({ error: "Game date is invalid" }, { status: 400 });
    }

    const existingBet = await prisma.bet.findUnique({ where: { id: betId } });
    if (!existingBet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    const bet = await prisma.bet.update({
      where: { id: betId },
      data: {
        game: game.trim(),
        betType: betType.trim(),
        pick: pick.trim(),
        odds: parsedOdds,
        amount: parsedAmount,
        payout: existingBet.status === "WIN" ? existingBet.payout : null,
        notes: notes != null && notes !== "" ? String(notes) : null,
        gameDate: parsedGameDate,
      },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("PUT /api/bets/[id] error:", error);
    return NextResponse.json({ error: "Failed to update bet" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const betId = Number(id);
    if (!Number.isInteger(betId)) {
      return NextResponse.json({ error: "Invalid bet id" }, { status: 400 });
    }

    await prisma.bet.delete({ where: { id: betId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bets/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete bet" }, { status: 500 });
  }
}
