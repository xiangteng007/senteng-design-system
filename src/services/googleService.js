// src/services/googleService.js
// 使用 Google Identity Services + gapi.client
// 不再使用 gapi.auth2，避免新 OAuth Client 被阻擋
// 與 App.jsx 介面相容：
//   GoogleService.initClient()
//   GoogleService.login()
//   GoogleService.logout()
//   GoogleService.getUser()
//   GoogleService.fetchSheetData()
//   GoogleService.syncToSheet()
//   GoogleService.fetchCalendarEvents()
//   GoogleService.addToCalendar()
//   GoogleService.uploadToDrive()
//   GoogleService.createDriveFolder()

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
const DRIVE_ROOT_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID;

// GIS 的 scope 要一次包含所有需要的權限
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

const DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let accessToken = null;
let currentUserProfile = null;

/* ---------------- Script 載入 ---------------- */

function loadGapiScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) return resolve();

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      console.error("[GoogleService] 無法載入 gapi script:", err);
      reject(err);
    };
    document.body.appendChild(script);
  });
}

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      return resolve();
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      console.error("[GoogleService] 無法載入 GIS script:", err);
      reject(err);
    };
    document.body.appendChild(script);
  });
}

/* ---------------- gapi.client 初始化（只負責 API，不負責登入） ---------------- */

async function ensureGapiClient() {
  if (gapiInited) return;

  if (!CLIENT_ID || !API_KEY) {
    console.error("[GoogleService] 缺少 CLIENT_ID 或 API_KEY，請確認 .env / Vercel 環境變數");
    throw new Error("Missing CLIENT_ID or API_KEY");
  }

  console.log("[GoogleService] init with:", {
    CLIENT_ID,
    API_KEY: API_KEY ? API_KEY.slice(0, 8) + "...(hidden)" : null,
    SPREADSHEET_ID,
    DRIVE_ROOT_FOLDER_ID,
  });

  await loadGapiScript();

  await new Promise((resolve, reject) => {
    window.gapi.load("client", {
      callback: resolve,
      onerror: (err) => {
        console.error("[GoogleService] gapi.load(client) 失敗:", err);
        reject(err);
      },
    });
  });

  try {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
    console.log("[GoogleService] gapi.client.init OK");
  } catch (err) {
    console.error("[GoogleService] gapi.client.init 發生錯誤:", err);
    throw err;
  }
}

/* ---------------- GIS 初始化（負責 Access Token） ---------------- */

async function ensureGisClient() {
  if (gisInited && tokenClient) return;

  await loadGisScript();

  if (!CLIENT_ID) {
    console.error("[GoogleService] 缺少 CLIENT_ID（GIS）");
    throw new Error("Missing CLIENT_ID for GIS");
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {}, // 真正 callback 會在 login() 時覆寫
  });

  gisInited = true;
  console.log("[GoogleService] GIS token client init OK");
}

/* ---------------- Auth: initClient / login / logout / getUser ---------------- */

async function initClient() {
  try {
    await ensureGapiClient();
    await ensureGisClient();

    const signedIn = !!accessToken;
    console.log("[GoogleService] initClient, signedIn =", signedIn);
    return signedIn;
  } catch (err) {
    console.warn("[GoogleService] initClient 失敗，將以 demo/mock 模式運作:", err);
    return false;
  }
}

async function login() {
  await ensureGapiClient();
  await ensureGisClient();

  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = async (tokenResponse) => {
        if (tokenResponse.error) {
          console.error("[GoogleService] 取得 Access Token 失敗:", tokenResponse);
          reject(tokenResponse);
          return;
        }

        accessToken = tokenResponse.access_token;
        window.gapi.client.setToken({ access_token: accessToken });

        try {
          // 取得使用者基本資訊（需在 OAuth 同意畫面勾選 userinfo.* scopes）
          const userRes = await window.gapi.client.request({
            path: "https://openidconnect.googleapis.com/v1/userinfo",
          });

          const result = userRes.result || {};
          currentUserProfile = {
            name: result.name || "",
            email: result.email || "",
            photo: result.picture || "",
          };

          console.log("[GoogleService] login OK, user =", currentUserProfile);
          resolve(currentUserProfile);
        } catch (userErr) {
          // userinfo 失敗，不阻斷登入流程，但記錄錯誤
          console.error("[GoogleService] 取得使用者資訊失敗:", userErr);
          currentUserProfile = { name: "", email: "", photo: "" };
          resolve(currentUserProfile);
        }
      };

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (e) {
      reject(e);
    }
  });
}

async function logout() {
  try {
    if (accessToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log("[GoogleService] Access Token revoked");
      });
    }
  } catch (e) {
    console.warn("[GoogleService] revoke token 失敗（可忽略）:", e);
  }

  accessToken = null;
  currentUserProfile = null;
  window.gapi?.client?.setToken(null);
}

function getUser() {
  return currentUserProfile;
}

/* ---------------- Sheets：syncToSheet / fetchSheetData ---------------- */

async function syncToSheet(sheetName, dataArray) {
  await ensureGapiClient();

  const values = Array.isArray(dataArray) ? dataArray : [];
  if (values.length === 0) {
    await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });
    return { success: true };
  }

  const allKeys = Array.from(
    new Set(values.flatMap((item) => Object.keys(item || {})))
  );

  const rows = [
    allKeys,
    ...values.map((item) =>
      allKeys.map((key) => {
        const v = item?.[key];
        if (v === null || v === undefined) return "";
        if (Array.isArray(v) || typeof v === "object") {
          try {
            return JSON.stringify(v);
          } catch {
            return String(v);
          }
        }
        return String(v);
      })
    ),
  ];

  await window.gapi.client.sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });

  const res = await window.gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    resource: { values: rows },
  });

  return res.result;
}

async function fetchSheetData(sheetName) {
  await ensureGapiClient();
  const res = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return res.result.values || [];
}

/* ---------------- Calendar：addToCalendar / fetchCalendarEvents ---------------- */

async function addToCalendar(event) {
  await ensureGapiClient();

  const { title, date, time } = event;
  if (!title || !date) {
    throw new Error("Event title 和 date 為必填");
  }

  const startDate = new Date(`${date} ${time || "10:00"}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const resource = {
    summary: title,
    description: event.type
      ? `類型：${event.type}${event.relatedId ? `\n關聯ID：${event.relatedId}` : ""}`
      : "",
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "Asia/Taipei",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "Asia/Taipei",
    },
  };

  const res = await window.gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource,
  });

  return res.result;
}

async function fetchCalendarEvents() {
  await ensureGapiClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const res = await window.gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin: startOfMonth.toISOString(),
    timeMax: endOfMonth.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500,
  });

  return res.result.items || [];
}

/* ---------------- Drive：createDriveFolder / uploadToDrive ---------------- */

async function createDriveFolder(clientName) {
  await ensureGapiClient();

  const folderName = clientName || "未命名客戶";

  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: DRIVE_ROOT_FOLDER_ID ? [DRIVE_ROOT_FOLDER_ID] : [],
  };

  const res = await window.gapi.client.drive.files.create({
    resource: metadata,
    fields: "id, name, webViewLink",
  });

  return res.result.webViewLink;
}

async function uploadToDrive(file, folderName) {
  await ensureGapiClient();

  if (!file || typeof file.arrayBuffer !== "function") {
    console.log(
      "[GoogleService.uploadToDrive] Mock upload:",
      file,
      "folder:",
      folderName
    );
    return {
      success: true,
      url: `https://drive.google.com/file/d/mock-${Date.now()}`,
    };
  }

  let folderId = null;

  if (DRIVE_ROOT_FOLDER_ID) {
    const q = [
      "mimeType='application/vnd.google-apps.folder'",
      `'${DRIVE_ROOT_FOLDER_ID}' in parents`,
      `name='${folderName}'`,
      "trashed=false",
    ].join(" and ");

    const searchRes = await window.gapi.client.drive.files.list({
      q,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (searchRes.result.files && searchRes.result.files.length > 0) {
      folderId = searchRes.result.files[0].id;
    } else {
      const folderMeta = {
        name: folderName || "未命名專案",
        mimeType: "application/vnd.google-apps.folder",
        parents: [DRIVE_ROOT_FOLDER_ID],
      };
      const newFolderRes = await window.gapi.client.drive.files.create({
        resource: folderMeta,
        fields: "id, name",
      });
      folderId = newFolderRes.result.id;
    }
  }

  const metadata = {
    name: file.name,
    parents: folderId
      ? [folderId]
      : DRIVE_ROOT_FOLDER_ID
      ? [DRIVE_ROOT_FOLDER_ID]
      : [],
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const data = await file.arrayBuffer();
  const base64Data = btoa(
    new Uint8Array(data).reduce((str, b) => str + String.fromCharCode(b), "")
  );

  const multipartBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || "application/octet-stream"}\r\n` +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    base64Data +
    closeDelimiter;

  const res = await window.gapi.client.request({
    path: "/upload/drive/v3/files",
    method: "POST",
    params: { uploadType: "multipart" },
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  return res.result;
}

/* ---------------- 對外匯出物件（給 App.jsx 使用） ---------------- */

export const GoogleService = {
  initClient,
  login,
  logout,
  getUser,

  fetchSheetData,
  syncToSheet,

  fetchCalendarEvents,
  addToCalendar,

  uploadToDrive,
  createDriveFolder,
};
