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
#   src/app/[locale]/place
#                   `/place/[id]` 가 `generateStaticParams()` 없는 동적 라우트다.
#                   S20 은 아직 목업 값이라 이번 빌드에서는 화면 자체를 넣지 않는다.
#                   실데이터가 붙으면(FE-FEAT-010) 이 줄을 지운다.
#
# 빌드 순서가 페이지 → API 라서 둘을 한꺼번에 빼지 않으면 에러가 하나씩만 보인다.
set -euo pipefail

cd "$(dirname "$0")/.."

EXCLUDE=(src/app/api "src/app/[locale]/place")
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

# 경로가 없으면 멈춘다. 조용히 넘기면 라우트가 그대로 남은 채 빌드가
# 엉뚱한 곳에서 깨진다 — 라우트를 옮기면 이 목록도 같이 고쳐야 한다.
for path in "${EXCLUDE[@]}"; do
  if [ ! -d "$path" ]; then
    echo "제외 대상이 없습니다: $path" >&2
    exit 1
  fi
  mv "$path" "$PARK/$(basename "$path")"
done

rm -rf .next out
# 상세 라우트를 뺐으니 목록 행도 링크를 그리지 않는다
BUILD_TARGET=app NEXT_PUBLIC_DETAIL_ENABLED=false npx next build

# ── 루트 진입점 ─────────────────────────────────────────────────
#
# 앱에는 미들웨어가 없다. 웹에서는 `proxy.ts` 가 `/` 를 받아 기기 언어에 맞는
# 로케일로 보내주는데, 정적 빌드에는 그 층이 통째로 없어 `/` 가 404 가 된다.
#
# Next 라우트(`src/app/page.tsx`)로 만들지 않은 이유 — 루트 레이아웃이 없어서
# 새로 만들어야 하고, 그러면 웹에서도 `/` 라우트가 생겨 `proxy.ts` 와 경합한다.
# 앱 산출물에만 파일 하나를 얹는 쪽이 웹을 건드리지 않는다.
#
# 기본은 `ko` 다. 영어 기기만 `en` 으로 보낸다.
#
# Capacitor 는 확장자 없는 경로(`/en/`, `/en/feed/`)를 받으면 **항상 이 루트 파일**을
# 돌려준다(WebViewLocalServer html5mode). 그래서 `/` 가 아니면 언어를 다시 고르지 않고
# 실제 파일(`…/index.html`)로 보낸다. 그러지 않으면 `/en/` → 루트 → `/en/en/` 로 돈다.
cat > out/index.html <<'HTML'
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAIRO</title>
</head>
<body>
<script>
  var path = location.pathname;
  if (path === "/") {
    var lang = (navigator.language || "ko").toLowerCase().indexOf("en") === 0 ? "en" : "ko";
    location.replace("/" + lang + "/index.html");
  } else {
    location.replace(path.replace(/\/?$/, "/") + "index.html" + location.search + location.hash);
  }
</script>
<noscript><a href="/ko/index.html">계속</a></noscript>
</body>
</html>
HTML

# 위에서 `…/index.html` 로 열린 페이지가 주소에서 `index.html` 을 뗀다. Next 가 뜨기 전에
# 돌아야 라우터가 `/en/` 으로 읽는다 — `<head>` 맨 앞에 넣는다.
STRIP='<script>if(location.pathname.slice(-11)==="/index.html")history.replaceState(null,"",location.pathname.slice(0,-10)+location.search+location.hash)</script>'
find out -mindepth 2 -name index.html -print0 | xargs -0 perl -0777 -pi -e "s#<head>#<head>${STRIP}#"

echo
echo "정적 파일: out/  (API 기준 주소: $NEXT_PUBLIC_API_BASE)"
echo "루트 진입점: out/index.html — navigator.language 로 en · ko 판정"
