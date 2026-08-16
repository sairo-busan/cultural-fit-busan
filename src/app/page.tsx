export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* 메인 영역 — 세로 중앙 정렬, 좌우 36px */}
      <div className="flex flex-1 flex-col items-center justify-center px-9">
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          {/* 타이틀 — 40px, weight 400, lineHeight 1.18 */}
          <h1
            className="font-serif text-[40px] font-normal text-foreground"
            style={{ lineHeight: 1.18, letterSpacing: "-0.01em" }}
          >
            Cultural Fit
            <br />
            Busan
          </h1>

          {/* 구분선 — 40px 너비, 상하 28px */}
          <div className="my-7 h-px w-10 bg-border" />

          {/* 설명 — 14px, weight 300, lineHeight 2.0 */}
          <p
            className="typo-body mb-[52px] text-sub-text"
            style={{ lineHeight: 2.0 }}
          >
            부산에 도착하셨나요?
            <br />
            지금부터 안내를 시작합니다
          </p>

          {/* 언어 선택 — 필 버튼, 하단 44px 간격 */}
          <div className="mb-11 flex w-full gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg bg-foreground py-3.5 text-[13px] font-normal text-white"
            >
              KO 한국어
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-border py-3.5 text-[13px] font-normal text-muted"
            >
              EN English
            </button>
          </div>

          {/* CTA — 높이 56px, letter-spacing 0.08em */}
          <div className="flex w-full flex-col gap-0">
            <button
              type="button"
              className="h-14 w-full rounded-lg bg-foreground text-[14px] font-light text-white transition-colors"
              style={{ letterSpacing: "0.08em" }}
            >
              내 여행 스타일 찾기
            </button>
            <button
              type="button"
              className="mt-0 h-14 w-full rounded-lg border border-border text-[14px] font-light text-sub-text transition-colors hover:text-accent"
              style={{ letterSpacing: "0.08em" }}
            >
              둘러보기
            </button>
          </div>
        </div>
      </div>

      {/* 하단 — 상 18px, 하 40px */}
      <div className="shrink-0 pb-10 pt-[18px] text-center">
        <p
          className="text-xs font-light text-muted"
          style={{ letterSpacing: "0.06em" }}
        >
          4문항 30초 · 회원가입 없이 이용
        </p>
      </div>
    </div>
  );
}

export { LandingPage as default };
