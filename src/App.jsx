import { useEffect, useState } from "react";
import GoogleService from "./services/googleService";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { signedIn } = await GoogleService.initClient();
        if (!mounted) return;
        setSignedIn(signedIn);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || String(e));
        setSignedIn(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        Loading...
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        <h2>森騰室內設計</h2>
        <p>請登入 Google 帳戶以存取雲端資料。</p>

        <button
          onClick={() => GoogleService.loginRedirect()}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          使用 Google 帳戶登入
        </button>

        {error ? (
          <pre style={{ marginTop: 16, color: "crimson", whiteSpace: "pre-wrap" }}>
            {error}
          </pre>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>後台</h2>
      <p>已登入，gapi token 已設定，可開始讀寫 Sheets/Drive/Calendar。</p>

      <button
        onClick={() => {
          GoogleService.logout();
          window.location.reload();
        }}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          cursor: "pointer",
        }}
      >
        登出
      </button>
    </div>
  );
}
