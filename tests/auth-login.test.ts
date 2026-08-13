import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/auth/login/route";

test("login sets a signed session cookie instead of a static authenticated value", async () => {
  process.env.APP_PASSWORD = "userpass";
  process.env.ADMIN_PASSWORD = "adminpass";

  const request = new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "user", password: "userpass" }),
  });

  const response = await POST(request);

  assert.equal(response.status, 200);

  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie, "set-cookie header should be present");
  assert.match(setCookie, /sbt_auth=user\./, "session cookie should use a signed user token");
  assert.doesNotMatch(setCookie, /authenticated/, "session cookie should not be a static constant");
});
