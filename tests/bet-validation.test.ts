import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as createBet } from "../src/app/api/bets/route";
import { PATCH as updateBet } from "../src/app/api/bets/[id]/route";

const baseBet = {
  game: "Yankees",
  betType: "moneyline",
  pick: "Yankees",
  odds: 110,
  amount: 100,
  notes: "Demo",
  gameDate: "2026-08-13",
};

test("create bet rejects invalid odds and amount", async () => {
  const invalidOddsRequest = new NextRequest("http://localhost/api/bets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...baseBet, odds: "bad" }),
  });

  const invalidOddsResponse = await createBet(invalidOddsRequest);
  assert.equal(invalidOddsResponse.status, 400);

  const invalidAmountRequest = new NextRequest("http://localhost/api/bets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...baseBet, amount: "bad" }),
  });

  const invalidAmountResponse = await createBet(invalidAmountRequest);
  assert.equal(invalidAmountResponse.status, 400);
});

test("win payout must be a positive numeric value greater than wager", async () => {
  const createResponse = await createBet(
    new NextRequest("http://localhost/api/bets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baseBet),
    })
  );

  assert.equal(createResponse.status, 201);
  const createdBet = await createResponse.json();

  const invalidPayoutRequest = new NextRequest(`http://localhost/api/bets/${createdBet.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "WIN", payout: "invalid" }),
  });

  const invalidPayoutResponse = await updateBet(invalidPayoutRequest, {
    params: Promise.resolve({ id: String(createdBet.id) }),
  });

  assert.equal(invalidPayoutResponse.status, 400);
});
