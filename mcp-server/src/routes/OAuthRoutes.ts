import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { ApiKeyDAL } from "../data-access-layer/ApiKeyDAL";
import { OAuthDAL } from "../data-access-layer/OAuthDAL";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

const oauthRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateCode(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

oauthRoutes.get("/authorize", async (c) => {
  const { client_id, redirect_uri, state, code_challenge, code_challenge_method, response_type, error } =
    c.req.query();

  if (response_type !== "code") {
    return c.text("unsupported_response_type", 400);
  }
  if (!redirect_uri || !code_challenge) {
    return c.text("invalid_request", 400);
  }

  const params = new URLSearchParams({
    client_id: client_id ?? "",
    redirect_uri,
    state: state ?? "",
    code_challenge,
    code_challenge_method: code_challenge_method ?? "S256",
  }).toString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connect Life Tracker to Claude</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .logo { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; color: #111; }
    .subtitle { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.8rem; font-weight: 600; color: #333; margin-bottom: 0.4rem; }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus { border-color: #6366f1; }
    .hint { font-size: 0.75rem; color: #888; margin-top: 0.4rem; margin-bottom: 1.25rem; }
    button {
      width: 100%;
      padding: 0.7rem;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    button:hover { background: #4f46e5; }
    .error { color: #dc2626; font-size: 0.8rem; margin-bottom: 1rem; display: none; }
    .error.visible { display: block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Life Tracker</div>
    <p class="subtitle">Authorize Claude to access your life tracking data.</p>
    <div class="error ${error ? "visible" : ""}" id="err">Invalid API key. Find yours in Life Tracker settings.</div>
    <form method="POST" action="/oauth/authorize?${params}">
      <label for="apiKey">API Key</label>
      <input
        id="apiKey"
        name="apiKey"
        type="password"
        placeholder="Paste your API key"
        autocomplete="off"
        required
      />
      <p class="hint">Found in Life Tracker → Settings → Claude Desktop API Key</p>
      <button type="submit">Authorize</button>
    </form>
  </div>
</body>
</html>`;

  return c.html(html);
});

oauthRoutes.post("/authorize", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const { client_id, redirect_uri, state, code_challenge, code_challenge_method } =
    c.req.query();

  if (!redirect_uri || !code_challenge) {
    return c.text("invalid_request", 400);
  }

  const body = await c.req.parseBody();
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  if (!apiKey) {
    return c.redirect(
      `/oauth/authorize?${new URLSearchParams({ client_id: client_id ?? "", redirect_uri, state: state ?? "", code_challenge, code_challenge_method: code_challenge_method ?? "S256", error: "1" })}`
    );
  }

  const db = getDb(c.env.DB);
  const userId = await ApiKeyDAL.getUserIdByKey(apiKey, db);

  if (!userId) {
    Logger.warn({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.AUTH,
      logAction: "OAuthInvalidApiKey",
      message: "OAuth authorize: invalid API key",
    });
    return c.redirect(
      `/oauth/authorize?${new URLSearchParams({ client_id: client_id ?? "", redirect_uri, state: state ?? "", code_challenge, code_challenge_method: code_challenge_method ?? "S256", error: "1" })}`
    );
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await OAuthDAL.insertAuthCode(
    {
      id: uuidv4(),
      userId,
      code,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method ?? "S256",
      expiresAt,
    },
    db
  );

  Logger.info({
    correlationId,
    logCategory: AppConstants.LOG_CATEGORIES.AUTH,
    logAction: "OAuthCodeIssued",
    message: "OAuth auth code issued",
    metadata: { userId },
  });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) redirectUrl.searchParams.set("state", state);

  return c.redirect(redirectUrl.toString());
});

oauthRoutes.post("/token", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";

  let body: Record<string, string>;
  const contentType = c.req.header("Content-Type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const parsed = await c.req.parseBody();
    body = Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, String(v)])
    );
  } else {
    body = await c.req.json().catch(() => ({}));
  }

  const { grant_type, code, redirect_uri, code_verifier } = body;

  if (grant_type !== "authorization_code") {
    return c.json({ error: "unsupported_grant_type" }, 400);
  }
  if (!code || !code_verifier || !redirect_uri) {
    return c.json({ error: "invalid_request" }, 400);
  }

  const db = getDb(c.env.DB);
  const authCode = await OAuthDAL.findAuthCode(code, db);

  if (!authCode) {
    return c.json({ error: "invalid_grant" }, 400);
  }

  if (new Date(authCode.expires_at) < new Date()) {
    return c.json({ error: "invalid_grant" }, 400);
  }

  if (authCode.redirect_uri !== redirect_uri) {
    return c.json({ error: "invalid_grant" }, 400);
  }

  const expectedChallenge = await sha256Base64Url(code_verifier);
  if (expectedChallenge !== authCode.code_challenge) {
    Logger.warn({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.AUTH,
      logAction: "OAuthPkceFailure",
      message: "OAuth token: PKCE verification failed",
    });
    return c.json({ error: "invalid_grant" }, 400);
  }

  await OAuthDAL.markAuthCodeUsed(authCode.id, db);

  const apiKeyRow = await ApiKeyDAL.findByUserId(authCode.user_id, db);
  if (!apiKeyRow) {
    return c.json({ error: "server_error" }, 500);
  }

  Logger.info({
    correlationId,
    logCategory: AppConstants.LOG_CATEGORIES.AUTH,
    logAction: "OAuthTokenIssued",
    message: "OAuth access token issued",
    metadata: { userId: authCode.user_id },
  });

  return c.json({
    access_token: apiKeyRow.key,
    token_type: "Bearer",
    scope: "mcp",
  });
});

export { oauthRoutes };
