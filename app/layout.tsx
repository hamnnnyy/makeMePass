import type { Metadata } from "next";
import { Do_Hyeon, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 한글 글꼴은 용량이 커서 미리 불러오지 않는다
const body = Noto_Sans_KR({ variable: "--font-body", weight: ["400", "500", "700"], subsets: ["latin"], preload: false });
const display = Do_Hyeon({ variable: "--font-do-hyeon", weight: "400", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "합사카 — 합격은 사심입니까?",
  description: "공기업 모의면접. 면접관 1명·3명, AI 지원자와 함께하는 다대다·토론·토의, 영어 면접까지. 답변 내용과 시선·표정·시간을 평가합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-night">{children}</body>
    </html>
  );
}
