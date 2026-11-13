import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import "./reference-screens.css";

export const metadata: Metadata = {
  title: { default: "약MI. | 먹기 전에 잠깐.", template: "%s | 약MI." },
  description: "SISIDETAIL 약MI. 식약처 공식 의약품 정보 검색 서비스",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body><AppShell>{children}</AppShell></body></html>;
}
