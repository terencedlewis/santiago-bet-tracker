import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BET_STATUSES, type BetStatus } from "@/lib/bets";
import { isAdminRequest } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

function isBetStatus(status: unknown): status is BetStatus {
  return typeof status === "string" && (BET_STATUSES as readonly string[]).includes(status);
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
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

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
    if (status === "WIN" && (payout == null || Number(payout) <= 0)) {
      return NextResponse.json({ error: "Payout is required for WIN status" }, { status: 400 });
    }
    if (status === "WIN" && Number(payout) <= existingBet.amount) {
      return NextResponse.json({ error: "Payout must be greater than the wager amount for a win" }, { status: 400 });
    }

    const bet = await prisma.bet.update({
      where: { id: betId },
      data: {
        status,
        payout: status === "WIN" ? Number(payout) : null,
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
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const { id } = await params;
    const betId = Number(id);
    if (!Number.isInteger(betId)) {
      return NextResponse.json({ error: "Invalid bet id" }, { status: 400 });
    }

    const body = await request.json();
    const { game, betType, pick, odds, amount, notes, gameDate, legs } = body;

    if (!game || !betType || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return NextResponse.json({ error: "Wager amount must be a positive number" }, { status: 400 });
    }

    const existingBet = await prisma.bet.findUnique({ where: { id: betId } });
    if (!existingBet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
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

      const bet = await prisma.bet.update({
        where: { id: betId },
        data: {
          game: String(game),
          betType: "Parlay",
          pick: null,
          odds: null,
          amount: normalizedAmount,
          payout: existingBet.status === "WIN" ? existingBet.payout : null,
          notes: notes ? String(notes) : null,
          gameDate: gameDate ? new Date(gameDate) : null,
          legs: parlayLegs.map((leg) => ({
            game: String(leg.game).trim(),
            selection: String(leg.selection).trim(),
            odds: Number(leg.odds),
            status: "PENDING",
          })),
        },
      });

      return NextResponse.json(bet);
    }

    if (!pick || odds === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bet = await prisma.bet.update({
      where: { id: betId },
      data: {
        game: String(game),
        betType: String(betType),
        pick: String(pick),
        odds: Number(odds),
        amount: normalizedAmount,
        payout: existingBet.status === "WIN" ? existingBet.payout : null,
        notes: notes ? String(notes) : null,
        gameDate: gameDate ? new Date(gameDate) : null,
        legs: Prisma.JsonNull,
      },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("PUT /api/bets/[id] error:", error);
    return NextResponse.json({ error: "Failed to update bet" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

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
