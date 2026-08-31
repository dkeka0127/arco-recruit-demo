import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { HrSyncBoot } from "@/components/hr/sync-boot";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://careers.arco.example"),
  title: {
    default: "ARCO Careers — 아르코 채용",
    template: "%s · ARCO Careers",
  },
  description:
    "성장을 만드는 사람들, 아르코에듀에서 만나다. 교육의 경험을 바꾸고 더 많은 사람의 가능성을 앞당기는 동료를 찾습니다. (포트폴리오 데모 — 모든 데이터는 가상입니다)",
  robots: { index: false, follow: false },
  openGraph: {
    title: "ARCO Careers — 아르코 채용",
    description: "성장 속도가 빠른 사람들이 모이는 곳, 아르코 채용 (포트폴리오 데모)",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${fraunces.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <HrSyncBoot />
        {children}
      </body>
    </html>
  );
}
