// File: api/google/token.js
// Vercel Serverless Function - exchanges authorization code for access token.
// IMPORTANT: set GOOGLE_CLIENT_SECRET in Vercel Project → Settings → Environment Variables
// (Do NOT use VITE_ prefix for server secrets.)

export default async function handler(req, res) {
  // Basic CORS (allow same-origin + localhost dev)
  const origin = req.headers.origin || "";
  const allowList = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://senteng-design-system.vercel.app",
  ];
  if (allowList.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    const { code, codeVerifier, redirectUri } = req.body || {};
    if (!code) return res.status(400).json({ error: "invalid_request", error_description: "missing code" });
    if (!codeVerifier) return res.status(400).json({ error: "invalid_request", error_description: "missing codeVerifier" });
    if (!redirectUri) return res.status(400).json({ error: "invalid_request", error_description: "missing redirectUri" });

    const client_id = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;

    if (!client_id) {
      return res.status(500).json({ error: "server_misconfig", error_description: "missing GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID on server" });
    }
    if (!client_secret) {
      return res.status(500).json({ error: "server_misconfig", error_description: "missing GOOGLE_CLIENT_SECRET on server" });
    }

    const params = new URLSearchParams();
    params.set("client_id", client_id);
    params.set("client_secret", client_secret);
    params.set("code", code);
    params.set("code_verifier", codeVerifier);
    params.set("grant_type", "authorization_code");
    params.set("redirect_uri", redirectUri);

    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json(data);

    // Pass-through (contains access_token, expires_in, token_type, scope, id_token sometimes)
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "server_error", error_description: String(e?.message || e) });
  }
}
