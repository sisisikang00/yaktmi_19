"use client";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { OriginalArt } from "./original-art";
import { PixelIcon, type IconName } from "./pixel-icon";
const tabs: { label: string; href: string; icon: IconName }[] = [ { label: "홈", href: "/", icon: "home" }, { label: "검색", href: "/search", icon: "search" }, { label: "약 도감", href: "/library", icon: "book" }, { label: "보관함", href: "/saved", icon: "bookmark" } ];
function NavigationLinks({ pathname }: { pathname?: string }) {
  return <nav className="bottom-nav" aria-label="하단 메뉴">{tabs.map((tab) => { const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href) || (tab.href === "/search" && (pathname?.startsWith("/identify") || pathname?.startsWith("/medicines"))); return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}><PixelIcon name={tab.icon} /><span>{tab.label}</span></Link>; })}</nav>;
}
function Navigation() { return <NavigationLinks pathname={usePathname()} />; }
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="side-scenery scenery-left" aria-hidden="true">
        <OriginalArt part="cloud" />
        <OriginalArt part="landscape" />
      </div>
      <div className="side-scenery scenery-right" aria-hidden="true">
        <OriginalArt part="cloud" />
        <OriginalArt part="landscape" />
      </div>
      <div className="site-shell">
        <a className="skip-link" href="#main">본문으로 이동</a>
        <header className="site-masthead">
          <OriginalArt part="cloud" className="reference-brand-cloud" />
          <Link className="site-wordmark" href="/" aria-label="약MI. 홈">
            <span className="site-wordmark-text" aria-hidden="true">약MI.</span>
            <svg className="site-wordmark-pixel" viewBox="21 9 221 89" aria-hidden="true" width="0" height="0">
              <image href="/brand/characters-original.png" width="1152" height="768" />
            </svg>
          </Link>
          <span className="site-signature">SISIDETAIL.</span>
        </header>
        <main id="main" className="main-content">{children}</main>
        <div className="world-landscape" aria-hidden="true">
          <OriginalArt part="landscape" />
          <OriginalArt part="landscape" className="landscape-continuation" />
        </div>
        <footer className="site-footer">
          <span className="site-footer-brand">
            <span className="site-wordmark-text">약MI.</span>
            <svg className="site-wordmark-pixel" viewBox="21 9 221 89" role="img" aria-label="약MI." width="0" height="0">
              <image href="/brand/characters-original.png" width="1152" height="768" />
            </svg>
            <span className="site-footer-studio">/ SISIDETAIL.</span>
            <span className="reference-footer-year">2026.</span>
          </span>
          <p>의약품 정보 제공 · 식품의약품안전처</p>
        </footer>
        <Suspense fallback={<NavigationLinks />}><Navigation /></Suspense>
      </div>
    </>
  );
}
