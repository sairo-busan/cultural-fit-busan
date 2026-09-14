#!/usr/bin/env bash
#
# 앱(Capacitor)용 정적 빌드.
#
# 정적 export 에 들어갈 수 없는 라우트를 잠시 옮겨 두고 빌드한 뒤 되돌린다.
# 빌드가 죽어도 `trap` 이 원위치시킨다 — 작업 트리에 남으면 그다음 웹 빌드가 깨진다.
#
#   src/app/api     `/api/tour` 부터 걸린다. 요청 파라미터를 읽는 Route Handler 는
#                   정적 export 가 지원하지 않는다. API 는 Vercel 에 그대로 남고
#                   앱은 절대 주소로 부른다(`src/lib/apiBase.ts`).
#
#   src/app/place   `/place/[id]` 가 `generateStaticParams()` 없는 동적 라우트다.
#                   S20 은 아직 목업 값이라 이번 빌드에서는 화면 자체를 넣지 않는다.
#                   실데이터가 붙으면(FE-FEAT-010) 이 줄을 지운다.
#
# 빌드 순서가 페이지 → API 라서 둘을 한꺼번에 빼지 않으면 에러가 하나씩만 보인다.
set -euo pipefail

cd "$(dirname "$0")/.."

EXCLUDE=(src/app/api src/app/place)
PARK="$(mktemp -d)"

restore() {
  for path in "${EXCLUDE[@]}"; do
    name="$(basename "$path")"
    [ -d "$PARK/$name" ] && mv "$PARK/$name" "$path"
  done
  rmdir "$PARK" 2>/dev/null || true
}
trap restore EXIT

if [ -z "${NEXT_PUBLIC_API_BASE:-}" ]; then
  echo "NEXT_PUBLIC_API_BASE 가 비어 있습니다." >&2
  echo "앱은 API 를 절대 주소로 불러야 합니다 — 비우면 기기 안에서 /api 를 찾다가 실패합니다." >&2
  exit 1
fi

for path in "${EXCLUDE[@]}"; do
  [ -d "$path" ] && mv "$path" "$PARK/$(basename "$path")"
done

rm -rf .next out
BUILD_TARGET=app npx next build

echo
echo "정적 파일: out/  (API 기준 주소: $NEXT_PUBLIC_API_BASE)"
