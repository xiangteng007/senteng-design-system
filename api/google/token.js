export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allowlist = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    "https://senteng-design-system.vercel.app",
  ]);

  if (allowlist.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const { code, codeVerifier, redirectUri } = req.body || {};

    if (!code || !codeVerifier || !redirectUri) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing code / codeVerifier / redirectUri",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: "server_misconfigured",
        error_description: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET",
      });
    }

    const tokenUrl = "https://oauth2.googleapis.com/token";
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const r = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json(data);
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({
      error: "server_error",
      error_description: e?.message || String(e),
    });
  }
}
