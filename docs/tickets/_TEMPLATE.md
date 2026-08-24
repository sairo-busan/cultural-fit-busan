# {티켓 제목}

작업에 대한 짧은 설명.

예: `BUG-001 구독 갱신 시 이전 active 구독 expired 미처리`

---

# Metadata

```
Type: BUG | TASK | FEAT
Severity: minor | major | critical
Layer: route | controller | service | repository | middleware | validation | db | infra
Milestone: MS-XX
```

---

# Problem

문제를 명확히 기술.

- 현재 동작:
- 기대 동작:
- 영향(impact):

---

# Context

AI가 관련 코드를 찾도록 기술적 컨텍스트 제공.

- 관련 모듈/파일:
  - `{route 레이어 경로}`
  - `{controller 경로}`
  - `{service 경로}`
  - `{repository 경로}`
- 관련 설정/env:
- 아키텍처 규칙: `Route → Controller → Service → Repository → DB` (프로젝트 규칙에 맞게)

---

# Scope

이 티켓이 바꿔도 되는 범위.

**허용**:
- 특정 로직 변경
- 설정 업데이트

**금지**:
- DB 스키마 변경(이 티켓에 명시 안 된 경우)
- 인프라/배포(CI·Docker·클라우드) 변경
- 무관한 리팩토링
- 대규모 아키텍처 변경

---

# Strategy

구현 힌트.

- 예: `route → controller → service → repository` 흐름으로 파라미터 전달
- 예: service에서 트랜잭션 처리
- 예: 입력 검증은 스키마 검증(zod 등) 또는 검증기 클래스

---

# Acceptance Criteria

완료 판정 기준.

1. 기대 동작이 정상 작동
2. API 응답에 올바른 값 포함
3. 기존 기능 미변경(회귀 없음)

---

# Testing Rules

- 변경한 검증/정합성/상태/유틸 로직에 대해 (테스트 프레임워크 도입 후) 테스트 추가/갱신.
- **테스트 도입 후, 아래 Verification 시나리오 표를 테스트 케이스로 인코딩**한다(표 = 테스트 청사진).
  미도입 시점엔 시나리오 표 수동 검증으로 대체하고 스킵 사유 기록.
- 단위 테스트에서 실제 외부 서비스(DB·결제·클라우드·메신저) 호출 금지 — 모킹/픽스처 사용.
- **타입체크 통과 후 핸드오프.** 결과/스킵을 `docs/_internal/analysis/` 리포트에 기록.
- `../TEST_STRATEGY.md` 우선순위 준수.

---

# Verification

⚠️ 쓰기 검증은 **로컬/테스트 DB에서만.** 운영 DB 쓰기 금지 = 상용 오염. 검증 전 `DATABASE_URL` 확인.

수동 검증 단계.

1. 로컬 서버 기동(또는 API 문서 UI)
2. 해당 시나리오 트리거
3. 응답/네트워크/DB 상태 확인
4. 기대 동작 확인
5. (스키마 변경 시) 마이그레이션 적용 확인

**검증 시나리오** — 케이스별로 작성(최소 **정상 / 에러·검증실패 / 회귀(부수효과 없음)**, 해당 시 멱등·경계·인증도 추가). 작은 티켓은 2~3행이면 충분.

| # | 시나리오 | 입력/요청 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 | ... | ... |
| 2 | 에러/검증 실패 | ... | ... |
| 3 | 회귀(부수효과 없음) | ... | 기존 동작 불변 |

---

# 산출물 네이밍 규칙

티켓에서 파생된 모든 파일은 **티켓 전체 파일명(확장자 제외)을 상속**한다.

```
{전체티켓파일명}_{purpose}.{ext}
```

예 — 티켓 `BUG-008_subscription_renewal_fix.md`:
- 리포트: `BUG-008_subscription_renewal_fix_report.md`
- (테스트 도입 후) 테스트: `BUG-008_subscription_renewal_fix.test.ts`
- 검증 노트: `BUG-008_subscription_renewal_fix_verification.md`

🚫 금지: `BUG-008_report.md` 같은 축약(같은 ID 재시도·분할 시 덮어쓰기 위험, 추적성 손상).

권장 suffix: `_report` `_test` `_verification` `_qa` `_analysis` `_migration`.

---

# Implementation Report Rule

완료 후 `docs/_internal/analysis/{전체티켓파일명}_report.md` 생성. 구조는 [../QA_AND_DONE.md](../QA_AND_DONE.md) §3.

포함: 티켓 파일명 · 변경 요약 · 변경 파일 · 근본원인 · 검증 결과 · 스킵된 검증 · 남은 리스크/후속 티켓.

---

# Ticket Size Rule

티켓은 **작고 집중**되게. 보통 **1~3 파일 / 단일 논리 변경**. 큰 작업은 여러 티켓으로 분할.

---

# 개발 원칙

- SSOT · Architecture-first · Ticket-driven · AI-assisted
- 1 티켓 = 1 브랜치 = 1 PR
