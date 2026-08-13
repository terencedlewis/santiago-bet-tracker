import test from "node:test";
import assert from "node:assert/strict";

process.env.APP_PASSWORD = "app-password";
process.env.ADMIN_PASSWORD = "admin-password";

import { buildSessionToken, getPasswordForRole, verifySessionToken } from "../src/lib/auth";

test("user and admin sessions carry distinct roles", async () => {
  const userToken = await buildSessionToken("user", "test-secret");
  const adminToken = await buildSessionToken("admin", "test-secret");

  assert.equal(await verifySessionToken(userToken, "test-secret"), "user");
  assert.equal(await verifySessionToken(adminToken, "test-secret"), "admin");
  assert.notEqual(userToken, adminToken);

  assert.equal(getPasswordForRole("user"), "app-password");
  assert.equal(getPasswordForRole("admin"), "admin-password");
});
