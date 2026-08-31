"use client";

import { useEffect } from "react";
import { initHrSync } from "@/lib/hr/store";

/** 앱 부트 시 Supabase 동기화 시작 (미설정이면 no-op). 렌더링 없음. */
export function HrSyncBoot() {
  useEffect(() => {
    initHrSync();
  }, []);
  return null;
}
