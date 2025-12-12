// File: src/services/googleService.js

const GoogleService = (() => {
  const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" ");

  const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  ];

  const STATE_KEY = "g_oauth_state";
  const VERIFIER_KEY = "g_pkce_verifier";
  const TOKEN_KEY = "g_access_token";

  const cfg = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    redirectUri:
      import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin,
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
    driveRootFolderId: import.meta.env.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "", // local 可設成 https://senteng-design-system.vercel.app
  };

  function assertConfig() {
    const missing = [];
    if (!cfg.clientId) missing.push("VITE_GOOGLE_CLIENT_ID");
    if (!cfg.apiKey) missing.push("VITE_GOOGLE_API_KEY");
    if (missing.length) {
      throw new Error(`Missing env: ${missing.join(", ")}`);
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  function randomString(len = 64) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }

  function base64UrlEncode(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let str = "";
    for (const b of bytes) str += String.fromCharCode(b);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    return digest;
  }

  async function buildPkce() {
    const verifier = randomString(64);
    const challenge = base64UrlEncode(await sha256(verifier));
    return { verifier, challenge };
  }

  function getAuthUrl({ codeChallenge, state }) {
    const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    u.searchParams.set("client_id", cfg.clientId);
    u.searchParams.set("redirect_uri", cfg.redirectUri);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("scope", SCOPES);
    u.searchParams.set("access_type", "offline"); // 不一定會拿到 refresh_token（web 端常受限制）
    u.searchParams.set("prompt", "consent"); // 需要時再改回 select_account
    u.searchParams.set("include_granted_scopes", "true");
    u.searchParams.set("state", state);
    u.searchParams.set("code_challenge", codeChallenge);
    u.searchParams.set("code_challenge_method", "S256");
    return u.toString();
  }

  async function exchangeTokenOnServer({ code, codeVerifier, redirectUri }) {
    const endpoint = `${cfg.apiBaseUrl}/api/google/token`;

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, codeVerifier, redirectUri }),
    });

    const data = await r.json();
    if (!r.ok) {
      const msg =
        data?.error_description ||
        data?.error ||
        `Token exchange failed (${r.status})`;
      throw new Error(msg);
    }
    return data;
  }

  function stripAuthParamsFromUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("scope");
    url.searchParams.delete("authuser");
    url.searchParams.delete("prompt");
    window.history.replaceState({}, document.title, url.toString());
  }

  async function handleRedirectCallbackIfAny() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) return { exchanged: false };

    const expectedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);

    if (!state || !expectedState || state !== expectedState) {
      throw new Error("OAuth state mismatch");
    }
    if (!verifier) {
      throw new Error("Missing PKCE code_verifier (sessionStorage)");
    }

    const token = await exchangeTokenOnServer({
      code,
      codeVerifier: verifier,
      redirectUri: cfg.redirectUri,
    });

    // 儲存 access_token，讓 reload 後可以恢復登入狀態
    if (token?.access_token) {
      sessionStorage.setItem(TOKEN_KEY, token.access_token);
    }

    // 清理一次性資料
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    stripAuthParamsFromUrl();

    return { exchanged: true, token };
  }

  async function initGapiClient() {
    await loadScript("https://apis.google.com/js/api.js");
    await new Promise((resolve) => window.gapi.load("client", resolve));

    await window.gapi.client.init({
      apiKey: cfg.apiKey,
      discoveryDocs: DISCOVERY_DOCS,
    });

    // 如果有 token，就設回去
    const accessToken = sessionStorage.getItem(TOKEN_KEY);
    if (accessToken) {
      window.gapi.client.setToken({ access_token: accessToken });
    }
  }

  async function initClient() {
    assertConfig();

    // 1) 先處理 redirect callback（如果有 code）
    const result = await handleRedirectCallbackIfAny().catch((e) => {
      console.error("[GoogleService] handleRedirectCallback failed:", e);
      throw e;
    });

    // 2) 初始化 gapi client
    await initGapiClient();

    const token = window.gapi.client.getToken();
    const signedIn = Boolean(token?.access_token);
    return { signedIn, result };
  }

  async function loginRedirect() {
    assertConfig();

    const { verifier, challenge } = await buildPkce();
    const state = randomString(32);

    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);

    const url = getAuthUrl({ codeChallenge: challenge, state });
    window.location.assign(url);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);

    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
    }
  }

  // ====== 你原本的 API wrapper（保留介面；內部用 gapi） ======

  function _normalizeRange(sheetName, defaultA1 = "A1:Z") {
    if (!sheetName) throw new Error("Missing sheetName");
    // If caller already passed A1 notation like "clients!A1:Z" keep it.
    if (sheetName.includes("!")) return sheetName;
    // Default: read a reasonable rectangular range so Sheets API won't 404.
    return `${sheetName}!${defaultA1}`;
  }

  async function fetchSheetData(sheetName) {
    if (!cfg.spreadsheetId) throw new Error("Missing VITE_GOOGLE_SPREADSHEET_ID");
    const res = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: cfg.spreadsheetId,
      range: _normalizeRange(sheetName, "A1:Z"),
    });
    return res.result;
  }

  async function syncToSheet(sheetName, values2D) {
    if (!cfg.spreadsheetId) throw new Error("Missing VITE_GOOGLE_SPREADSHEET_ID");
    const res = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: cfg.spreadsheetId,
      range: _normalizeRange(sheetName, "A1"),
      valueInputOption: "RAW",
      resource: { values: values2D },
    });
    return res.result;
  }

  async function createDriveFolder(name) {
    const parent = cfg.driveRootFolderId || undefined;
    const res = await window.gapi.client.drive.files.create({
      resource: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        ...(parent ? { parents: [parent] } : {}),
      },
      fields: "id,name",
    });
    return res.result;
  }

  async function fetchCalendarEvents() {
    const res = await window.gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });
    return res.result?.items || [];
  }

  async function addToCalendar(event) {
    const res = await window.gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    return res.result;
  }

  return {
    initClient,
    // Backward-compatible alias (older App.jsx may call GoogleService.login())
    login: loginRedirect,
    loginRedirect,
    logout,
    fetchSheetData,
    syncToSheet,
    createDriveFolder,
    fetchCalendarEvents,
    addToCalendar,
  };
})();

export default GoogleService;
