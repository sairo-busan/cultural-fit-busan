export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <main className="flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-accent">
            SAIRO
          </h1>
          <p className="text-lg text-foreground">
            Cultural Fit Busan
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <p className="text-sm text-muted">부산에 도착하셨나요?</p>
            <p className="text-sm text-muted">지금부터 안내를 시작합니다</p>
          </div>
        </div>

        {/* 언어 선택 */}
        <div className="flex w-full max-w-xs overflow-hidden border-b border-border">
          <button
            type="button"
            className="flex-1 border-b-2 border-accent py-3 text-sm font-normal text-accent"
          >
            KO 한국어
          </button>
          <button
            type="button"
            className="flex-1 py-3 text-sm font-normal text-muted"
          >
            EN English
          </button>
        </div>

        {/* CTA */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            className="w-full bg-accent py-4 text-base font-normal text-white transition-colors hover:bg-accent-hover"
          >
            내 여행 스타일 찾기
          </button>
          <button
            type="button"
            className="w-full border-b border-border py-4 text-base font-normal text-foreground transition-colors hover:text-accent"
          >
            둘러보기
          </button>
        </div>

        <p className="text-xs text-muted">회원가입 없이 이용</p>
      </main>
    </div>
  );
}

export { LandingPage as default };
