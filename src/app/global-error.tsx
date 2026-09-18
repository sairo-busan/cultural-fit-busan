"use client";

import { useEffect } from "react";

/**
 * 레이아웃까지 터지면 이 문서가 통째로 대신한다. 문구 파일 · 글꼴 · 전역 스타일이 없어
 * 언어를 알 수 없으므로 한 · 영을 같이 적고 인라인 스타일만 쓴다
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#101318",
          background: "#fff",
        }}
      >
        <title>SAIRO</title>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>문제가 생겼어요</p>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7078" }}>Something went wrong</p>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7078" }}>새로고침해 주세요 · Please reload</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 14,
            minHeight: 48,
            padding: "0 24px",
            border: 0,
            borderRadius: 12,
            background: "#101318",
            color: "#fff",
            font: "inherit",
            fontWeight: 600,
          }}
        >
          새로고침 · Reload
        </button>
      </body>
    </html>
  );
}
