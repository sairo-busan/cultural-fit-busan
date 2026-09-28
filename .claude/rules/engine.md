---
paths:
  - "src/lib/cf8Match.ts"
  - "src/lib/hardFilter.ts"
  - "src/lib/situationalScore.ts"
  - "src/lib/finalScore.ts"
  - "src/lib/tripSetupMode.ts"
  - "src/lib/recommendEngine.ts"
  - "src/lib/reasonText.ts"
---

# 추천 엔진

`/api/recommend` 가 준 후보를 클라이언트에서 필터링·채점·정렬한다. 브라우저 I/O 는 `src/hooks/useRecommendations.ts` 가 맡는다.

| 파일 | 역할 | 정본 |
|---|---|---|
| `cf8Match.ts` | CF8 3축 매칭 점수 | R031 |
| `hardFilter.ts` | 제외 판정 + soft 배지 | — |
| `situationalScore.ts` | 동행·날씨·계절·시간대 점수 | R031 |
| `finalScore.ts` | 가중평균 + UNKNOWN 재정규화 | CALC_04 · R031 |
| `tripSetupMode.ts` | QUICK / CUSTOM 활성 필터 결정 | R024 |
| `recommendEngine.ts` | 위 모듈 조립 + RANK 동점 처리 | — |
| `reasonText.ts` | 추천 근거 문장 | R060 |

- 계산 정본은 구글 시트. 코드는 그 구현이다. 정본에 없는 상수·가중치를 새로 만들지 않는다. 시트가 DRAFT 인 항목은 에린 확인 전까지 보류.
- 엔진 모듈은 순수 함수로 유지한다 — `fetch`·`localStorage` 를 부르지 않고, 시각은 `EngineContext.now` 로 주입받는다.
- 테스트 프레임워크가 없어 점수가 틀려도 `tsc`·`lint`·`build` 는 통과한다. 엔진을 고치면 `npx tsx -e` 로 값을 직접 확인한다.
