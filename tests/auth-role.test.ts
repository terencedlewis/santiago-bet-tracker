import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

process.env.APP_PASSWORD = "app-password";
process.env.ADMIN_PASSWORD = "admin-password";

import { buildSessionToken, getPasswordForRole, verifySessionToken } from "../src/lib/auth";
import { POST as createBet } from "../src/app/api/bets/route";

test("user and admin sessions carry distinct roles", async () => {
  const userToken = await buildSessionToken("user", "test-secret");
  const adminToken = await buildSessionToken("admin", "test-secret");

  assert.equal(await verifySessionToken(userToken, "test-secret"), "user");
  assert.equal(await verifySessionToken(adminToken, "test-secret"), "admin");
  assert.notEqual(userToken, adminToken);

  assert.equal(getPasswordForRole("user"), "app-password");
  assert.equal(getPasswordForRole("admin"), "admin-password");
});

test("user sessions cannot mutate bets", async () => {
  const userToken = await buildSessionToken("user", "app-password");
  const request = new NextRequest("http://localhost/api/bets", {
    method: "POST",
    headers: {
      cookie: `sbt_auth=${userToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const response = await createBet(request);

  assert.equal(response.status, 403);
});
