/**
 * linkClues.ts 확인.
 *
 * 실행: node --import tsx scripts/check-link-clues.ts
 */
import assert from "node:assert/strict";
import {
  detectProvider,
  googlePlaceName,
  isAllowedHost,
  ogTitle,
  titleClues,
  youtubeClues,
  youtubeVideoId,
} from "../src/lib/linkClues";

const u = (s: string) => new URL(s);

assert.equal(detectProvider(u("https://youtu.be/k3Lp9xQ2aBc")), "youtube");
assert.equal(detectProvider(u("https://place.map.kakao.com/8146553")), "kakaomap");
assert.equal(detectProvider(u("https://map.naver.com/p/entry/place/11491438")), "navermap");
assert.equal(detectProvider(u("https://www.google.com/maps/place/Haedong")), "googlemap");
assert.equal(detectProvider(u("https://www.google.com/search?q=x")), "other");
assert.equal(detectProvider(u("https://kko.to/abc")), "other");

assert.equal(isAllowedHost("naver.me"), true);
assert.equal(isAllowedHost("169.254.169.254"), false);
assert.equal(isAllowedHost("evil.com"), false);

assert.equal(youtubeVideoId(u("https://youtu.be/k3Lp9xQ2aBc?si=Xw81")), "k3Lp9xQ2aBc");
assert.equal(youtubeVideoId(u("https://www.youtube.com/watch?v=k3Lp9xQ2aBc&t=3")), "k3Lp9xQ2aBc");
assert.equal(youtubeVideoId(u("https://www.youtube.com/shorts/k3Lp9xQ2aBc")), "k3Lp9xQ2aBc");
assert.equal(youtubeVideoId(u("https://www.youtube.com/@channel")), null);

const desc = [
  "부산 기장 바다 절 다녀왔어요",
  "📍해동용궁사 – 기장해안로 86",
  "00:00 인트로",
  "03:12 청사포 다릿돌",
  "1:02:10 해운대 블루라인파크",
  "#해운대 #부산여행 #해동용궁사",
].join("\n");

assert.deepEqual(
  youtubeClues(desc).map((c) => c.name),
  ["해동용궁사", "청사포 다릿돌", "해운대 블루라인파크", "해운대"],
);
assert.equal(youtubeClues(desc)[0].evidence, "설명 “📍해동용궁사 – 기장해안로 86”");
assert.deepEqual(youtubeClues("그냥 브이로그"), []);
// 일반어 해시태그
assert.deepEqual(youtubeClues("#부산맛집 #부산여행 #해동용궁사").map((c) => c.name), ["해동용궁사"]);

// 📍 머리줄 아래 목록
assert.deepEqual(
  youtubeClues("📍 이 영상에 나오는 곳\n- 송정해수욕장\n- 해동용궁사\n\n\n- 목록 밖").map((c) => c.name),
  ["송정해수욕장", "해동용궁사"],
);

// 📍 머리줄이 장소가 아닐 때 · ㄴ 글머리 · 링크 떼기
assert.deepEqual(
  youtubeClues(
    "📍 스킨케어\n넘버즈인 5번 마스크팩\n\n📍 장소\n사상역\nㄴ합천일류돼지국밥 https://place.map.kakao.com/10928210\n\n-기장\nㄴ해동용궁사 https://place.map.kakao.com/8606230",
  ).map((c) => c.name),
  ["합천일류돼지국밥", "해동용궁사"],
);

assert.equal(
  googlePlaceName(u("https://www.google.com/maps/place/%ED%95%B4%EB%8F%99%EC%9A%A9%EA%B6%81%EC%82%AC/@35.18,129.22,17z")),
  "해동용궁사",
);
assert.equal(googlePlaceName(u("https://www.google.com/maps/@35.18,129.22,17z")), null);

assert.equal(ogTitle('<meta property="og:title" content="해동용궁사 : 네이버">'), "해동용궁사");
assert.equal(ogTitle('<meta content="흰여울문화마을 | 카카오맵" property="og:title"/>'), "흰여울문화마을");
assert.equal(ogTitle("<title>x</title>"), null);

// 번호 줄 + 📍 주소, 가격 목록은 장소가 아니다
assert.deepEqual(
  youtubeClues("1. 호돌이초장집\n📍부산 기장군 일광읍 이천길 33 호돌이초장\n⏱평일 11:00~19:00\n-(현금)장어가격 1kg 30,000원").map((c) => c.name),
  ["호돌이초장집"],
);
// 이름 뒤 타임스탬프 · "설명 | 이름" · 인스타 계정
assert.deepEqual(
  youtubeClues("📍바우하우스 00:42\n📍앙시앙 04:43\n📍부산역 점심 | 영동밀면\n⏰ 13:04 ~ 14:00\n📍짐 두고 오션뷰카페 | 까사부사노 테라스 @casabusano\n⏰16:00").map((c) => c.name),
  ["바우하우스", "앙시앙", "영동밀면", "까사부사노 테라스"],
);
// 원 숫자 목록 · 별표 설명 · 쉼표로 여러 곳
assert.deepEqual(
  youtubeClues("[ 레드라인 코스 ]\n① 부산역(출발)\n②. UN기념공원 *기간한정 무정차\n⑥. 마린시티(수영만 요트경기장)\n⑩. 시립미술관, 벡스코").map((c) => c.name),
  ["부산역", "UN기념공원", "수영만 요트경기장", "시립미술관", "벡스코"],
);
// "시작" 은 챕터
assert.deepEqual(youtubeClues("00:00 시작\n03:45 부산타워").map((c) => c.name), ["부산타워"]);
// 제목 목록
assert.deepEqual(
  titleClues("1박2일 부산여행🌊현지인맛집 뿌시고(이재모•신발원만두•아구수육)").map((c) => c.name),
  ["이재모", "신발원만두", "아구수육"],
);
assert.deepEqual(
  titleClues("1박 2일 부산 먹부림 여행 🇰🇷 | 해목, 비비비당, 신발원").map((c) => c.name),
  ["해목", "비비비당", "신발원"],
);
assert.deepEqual(titleClues("부산 힐링 여행 🌊ㅣ돼지국밥, 연화리해녀촌").map((c) => c.name), ["돼지국밥", "연화리해녀촌"]);
assert.deepEqual(titleClues("부산 여행 브이로그"), []);

console.log("ok");
