import { setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

/**
 * 개인정보처리방침. 스토어 등록에 공개 URL 이 필요해 화면 하나로 둔다
 * (Play 는 필수 입력 항목이다).
 *
 * 문구를 `messages/` 에 넣지 않은 이유 — 문단이 길고 이 화면에서만 쓴다.
 * 번역 키로 쪼개면 문장 사이 맥락이 끊겨 법적 문구를 고치기 어려워진다.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const CONTACT = "yonashin11@gmail.com";
const OFFICER_KO = "신윤아";
const OFFICER_EN = "Yoonah Shin";
const UPDATED = "2026-09-16";

const KO = {
  title: "개인정보처리방침",
  updated: `최종 수정일 ${UPDATED}`,
  sections: [
    {
      h: "수집하는 정보",
      p: [
        "SAIRO 는 회원가입이 없고, 이용자를 식별할 수 있는 정보를 수집하지 않습니다.",
        "이름 · 연락처 · 이메일 · 계정 · 기기 식별자 · 위치를 요구하지 않으며, 서버에 저장하지도 않습니다.",
      ],
    },
    {
      h: "기기에 저장되는 것",
      p: [
        "취향 진단 결과, 여행 조건, 저장한 장소는 이용자의 기기 안(브라우저 저장소)에만 남습니다. 서버로 보내지 않습니다.",
        "앱을 삭제하거나 브라우저 저장소를 비우면 함께 사라집니다.",
      ],
    },
    {
      h: "네트워크 통신",
      p: [
        "장소 목록 · 장소 상세 · 날씨를 받기 위해 SAIRO 서버에 요청을 보냅니다. 이 요청에는 이용자를 식별하는 값이 들어가지 않습니다.",
        "SAIRO 서버는 한국관광공사 TourAPI 와 기상청 단기예보 조회서비스에서 공개 정보를 받아 전달합니다.",
      ],
    },
    {
      h: "제3자 제공과 광고",
      p: [
        "수집하는 개인정보가 없으므로 제3자에게 제공하는 정보도 없습니다.",
        "광고를 싣지 않으며, 광고 식별자나 분석 도구를 사용하지 않습니다.",
      ],
    },
    {
      h: "권한",
      p: [
        "앱은 인터넷 연결 권한만 사용합니다. 위치 · 카메라 · 연락처 · 저장소 권한을 요구하지 않습니다.",
      ],
    },
    {
      h: "아동의 개인정보",
      p: ["수집하는 개인정보가 없어 연령과 무관하게 동일하게 동작합니다."],
    },
    {
      h: "개인정보 보호책임자와 문의",
      p: [
        `개인정보 보호책임자: ${OFFICER_KO}`,
        `개인정보 처리에 관한 문의는 ${CONTACT} 로 보내주세요.`,
      ],
    },
  ],
};

const EN = {
  title: "Privacy Policy",
  updated: `Last updated ${UPDATED}`,
  sections: [
    {
      h: "Information we collect",
      p: [
        "SAIRO has no sign-up and collects no information that identifies you.",
        "We do not ask for your name, contact details, email, account, device identifier, or location, and we store none of them on our servers.",
      ],
    },
    {
      h: "What stays on your device",
      p: [
        "Your travel type, trip conditions, and saved places are kept only in your device's browser storage. They are never sent to our servers.",
        "Deleting the app or clearing browser storage removes them.",
      ],
    },
    {
      h: "Network requests",
      p: [
        "The app calls the SAIRO server to load places, place details, and weather. These requests carry no value that identifies you.",
        "The SAIRO server relays public data from the Korea Tourism Organization (TourAPI) and the Korea Meteorological Administration short-term forecast service.",
      ],
    },
    {
      h: "Third parties and advertising",
      p: [
        "Because we collect no personal data, we share none with third parties.",
        "The app carries no advertising and uses no advertising identifiers or analytics tools.",
      ],
    },
    {
      h: "Permissions",
      p: [
        "The app uses only the internet permission. It does not request location, camera, contacts, or storage permissions.",
      ],
    },
    {
      h: "Children's privacy",
      p: ["Since no personal data is collected, the app behaves the same regardless of age."],
    },
    {
      h: "Privacy officer and contact",
      p: [
        `Privacy officer: ${OFFICER_EN}`,
        `For questions about this policy, email ${CONTACT}.`,
      ],
    },
  ],
};

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = (locale as Locale) === "en" ? EN : KO;

  return (
    <div className="screen mx-auto w-full max-w-screen-sm py-10">
      <h1 className="ds-title-1">{t.title}</h1>
      <p className="ds-caption mt-2 text-sub">{t.updated}</p>

      {t.sections.map((section) => (
        <section key={section.h} className="mt-8">
          <h2 className="ds-title-2">{section.h}</h2>
          {section.p.map((line) => (
            <p key={line} className="ds-body-1 mt-3 text-sub">
              {line}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
