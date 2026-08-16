import test from "node:test";
import assert from "node:assert/strict";

import { calculateParlayPayout, calculateParlayResult } from "../src/lib/bets";

test("calculateParlayPayout multiplies american odds across all legs", () => {
  const payout = calculateParlayPayout(100, [150, -110, 200]);

  assert.ok(Math.abs(payout - 1431.8181818181818) < 0.01);
});

test("calculateParlayResult resolves wins, losses, pushes, and pending legs", () => {
  const winResult = calculateParlayResult(100, [
    { odds: 150, status: "WIN" },
    { odds: -110, status: "WIN" },
    { odds: 200, status: "WIN" },
  ]);
  assert.equal(winResult.status, "WIN");
  assert.ok(Math.abs((winResult.totalPayout ?? 0) - 1431.8181818181818) < 0.01);

  const lossResult = calculateParlayResult(100, [
    { odds: 150, status: "WIN" },
    { odds: -110, status: "LOSS" },
    { odds: 200, status: "WIN" },
  ]);
  assert.equal(lossResult.status, "LOSS");
  assert.equal(lossResult.totalPayout, 0);

  const pushResult = calculateParlayResult(100, [
    { odds: 150, status: "WIN" },
    { odds: -110, status: "PUSH" },
    { odds: 200, status: "WIN" },
  ]);
  assert.equal(pushResult.status, "WIN");
  assert.ok(Math.abs((pushResult.totalPayout ?? 0) - 750) < 0.01);

  const pendingResult = calculateParlayResult(100, [
    { odds: 150, status: "WIN" },
    { odds: -110, status: "PENDING" },
    { odds: 200, status: "WIN" },
  ]);
  assert.equal(pendingResult.status, "PENDING");
  assert.equal(pendingResult.totalPayout, null);
});
