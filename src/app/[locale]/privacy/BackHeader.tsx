"use client";

import { AppHeader } from "@/components/common/AppHeader";
import { useRouter } from "@/i18n/navigation";

/** 본문은 서버에 두고 뒤로 버튼만 클라이언트로 얹는다 */
export function BackHeader() {
  const router = useRouter();

  // 스토어 방침 링크로 바로 열면 돌아갈 기록이 없다
  const back = () => (window.history.length > 1 ? router.back() : router.push("/me"));

  return <AppHeader onBack={back} />;
}
