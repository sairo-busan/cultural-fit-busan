---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# 디자인 시스템 (DS v1)

- 토큰 정본은 `src/app/globals.css`. 색·서체 값을 옮겨 적지 말고 토큰 클래스(`bg-primary`, `text-ink` 등)를 쓴다.
- 브랜드색을 따로 두지 않고 잉크 농도로 위계를 만든다.
- 간격은 Tailwind 스케일로 — `gap-[12px]` 대신 `gap-3`.
- UI 프리미티브는 Radix 만 쓴다. shadcn 도입 금지 (DS v1 토큰 체계와 충돌).
- CF8 코드(`CLD`~`EFV`)·점수는 화면에 노출하지 않는다. 유형명과 3축 요약만 표시.
