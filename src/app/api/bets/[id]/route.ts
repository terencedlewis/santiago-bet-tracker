import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const bet = await prisma.bet.findUnique({ where: { id: Number(id) } });
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
    const body = await request.json();
    const { status, payout } = body;

    const validStatuses = ["PENDING", "WIN", "LOSS", "PUSH"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const bet = await prisma.bet.update({
      where: { id: Number(id) },
      data: {
        status,
        ...(payout != null ? { payout: Number(payout) } : {}),
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
    const body = await request.json();
    const { game, betType, pick, odds, amount, payout, notes, gameDate } = body;

    if (!game || !betType || !pick || odds === undefined || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bet = await prisma.bet.update({
      where: { id: Number(id) },
      data: {
        game: String(game),
        betType: String(betType),
        pick: String(pick),
        odds: Number(odds),
        amount: Number(amount),
        payout: payout != null ? Number(payout) : null,
        notes: notes ? String(notes) : null,
        gameDate: gameDate ? new Date(gameDate) : null,
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
    await prisma.bet.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bets/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete bet" }, { status: 500 });
  }
}
