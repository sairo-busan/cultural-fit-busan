# FE-CHORE-004: CLAUDE.md 정리 · 경로별 규칙 분리

CLAUDE.md 가 지난 스프린트 상태와 실제와 다른 토큰 값을 담고 있어 Claude Code 가 낡은 정보로
작업한다. 매 세션 필요한 사실만 남기고, 특정 경로에서만 필요한 규칙은 `.claude/rules/` 로 옮긴다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | CHORE |
| Severity | Low |
| Layer | Docs |
| Status | 진행 중 — 커밋 전 검토 |
| Related | [Claude Code 공식 문서 — memory](https://code.claude.com/docs/en/memory) |

---

## Problem

- **분량**: CLAUDE.md 178줄. 절반 가까이가 5주 스프린트 체크리스트(8/10~9/21)로, `← 현재` 가
  W1 에 남아 있다.
- **실제와 다름**: 디자인 시스템 표가 `#111213` · Noto Sans KR · Cormorant 를 적었으나
  `globals.css` 는 `#101318` · Pretendard 한 벌이다.
- **서로 충돌**: i18n EN/KO 와 "4개 언어 불일치" 경고, TourAPI 6종과 5종이 한 파일에 같이 있다.
- **안 불러와지는 규칙**: CLAUDE.md 가 있으면 Claude Code 는 기본값으로 `AGENTS.md` 를 읽지
  않는다. `AGENTS.md` 의 금지 목록(px 하드코딩 · `text-gray-500` · shadcn · 좌표 서버 전송)이
  작업에 반영되지 않는다.

---

## Scope

### 포함

| # | 작업 | 왜 |
|---|---|---|
| 1 | CLAUDE.md 에서 스프린트 · 발전계획 · 심사 기준 · Notion WBS · 디자인 시스템 표 삭제 | 지난 상태 · 실제와 다른 값 |
| 2 | CLAUDE.md 에 좌표 원칙 · 명령어 · 코드베이스 지도 · 저장 키 주의 추가 | 매 세션 필요한 사실 |
| 3 | `.claude/rules/design-system.md` (`src/**/*.tsx` · `*.css`) | UI 작업 때만 필요 |
| 4 | `.claude/rules/engine.md` (엔진 모듈 7개) | 엔진 작업 때만 필요 |
| 4-1 | `.claude/rules/api.md` (`src/app/api/**`) | 응답 계약·키 노출 규칙이 로컬 전용 `qa-api-tester` 에만 있어 작성 시점에 로드되지 않음 |
| 5 | `.gitignore` 를 `.claude/*` + `!.claude/rules/` 로 | rules 만 팀과 공유 |
| 6 | CLAUDE.md 삭제 섹션을 가리키는 문서 2곳 갱신 (Done 티켓 기록은 제외) | 끊긴 참조 |

### 제외

- 아키텍처 원칙 · 기술스택 변경 — `docs/decisions/2026-09-25_RN_전환_검토.md` 결정 후
- `.claude/` 의 agents · commands · settings · hooks — 개인 로컬 설정
- 당시 상태를 기록한 문서(`현황_스냅샷_2026-09-03.md` · `wbs_v2_qa.md` · `진단체계_CF8_전환_검토.md`)

---

## Acceptance Criteria

1. CLAUDE.md 가 200줄 이하이고 지난 일정 · 실제와 다른 값이 없다
2. `src/**/*.tsx` 파일을 읽으면 `design-system.md` 가, 엔진 모듈을 읽으면 `engine.md` 가 불러와진다 (`/memory` 로 확인)
3. `git status` 에 `.claude/rules/` 외의 `.claude/` 파일이 나오지 않는다
