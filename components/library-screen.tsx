"use client";
import Link from "next/link";
import { useState } from "react";
import { clearRecent, removeMedicine, useLibrary } from "@/lib/library";
import { MedicineCard } from "./medicine-card";
import { StatePanel } from "./state-panel";
import { SceneHeader } from "./scene-header";
import { PixelIcon } from "./pixel-icon";
import { PotionCharacter } from "./potion-character";
type Tab = "all" | "favorites" | "recent" | "viewed";
const storageCategories = [
  { id: "favorites", name: "즐겨찾기 약", icon: "star", decoration: "✧", empty: "즐겨찾기한 약이 없어요." },
  { id: "viewed", name: "최근 본 약", icon: "clock", decoration: "☁", empty: "최근 본 약이 없어요." },
  { id: "all", name: "내가 모은 약", icon: "book", decoration: "✚", empty: "아직 모은 약이 없어요." },
] as const;

function ArchiveCategories({ tab, counts, select }: {
  tab: Tab;
  counts: Record<(typeof storageCategories)[number]["id"], number>;
  select: (tab: Tab) => void;
}) {
  return (
    <div className="storage-menu" role="group" aria-label="보관함 분류">
      {storageCategories.map(({ id, name, icon, decoration }) => (
        <button key={id} className={`archive-${id}`} aria-pressed={tab === id} onClick={() => select(id)}>
          <PixelIcon name={icon} />
          <span>{name}</span>
          <span className="archive-card-art" aria-hidden="true">{decoration}</span>
          <strong>{counts[id]}개</strong>
          <span className="archive-chevron" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function ArchiveEmpty({ tab }: { tab: Tab }) {
  const category = storageCategories.find(({ id }) => id === tab) ?? storageCategories[0];
  return (
    <div className="archive-empty">
      <p className="archive-bubble" role="status">{category.empty}</p>
      <Link href="/search" className="archive-search-link">
        의약품 검색하기 <span className="archive-chevron" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ArchiveSleepScene() {
  return (
    <div className="archive-sleep-scene">
      <span className="archive-spark archive-spark-left" aria-hidden="true">✦</span>
      <PotionCharacter state="loading" />
      <span className="archive-spark archive-spark-right" aria-hidden="true">✦</span>
    </div>
  );
}
export function LibraryScreen({ storageMode = false }: { storageMode?: boolean }) {
  const { entries, recent, viewed } = useLibrary();
  const [tab, setTab] = useState<Tab>(storageMode ? "favorites" : "all");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [error, setError] = useState("");
  function select(value: Tab) { setTab(value); setPage(1); }
  const favorites = entries.filter((entry) => entry.favorite);
  const items = tab === "viewed" ? viewed : (tab === "favorites" ? favorites : entries).map((entry) => entry.medicine);
  const pages = Math.max(1, Math.ceil(items.length / 6));
  const currentPage = Math.min(page, pages);
  const visible = items.slice((currentPage - 1) * 6, currentPage * 6);
  return <section className={`page-content ${storageMode ? "storage-page" : "library-page"}`}><SceneHeader title={storageMode ? "보관함" : "약 도감"} state={storageMode ? "storage" : "book"} /><div className="page-body">{storageMode ? <ArchiveCategories tab={tab} counts={{ favorites: favorites.length, viewed: viewed.length, all: entries.length }} select={select} /> : <div className="toolbar filter-tabs" aria-label="도감 보기"><button aria-pressed={tab === "all"} onClick={() => select("all")}>전체</button><button aria-pressed={tab === "favorites"} onClick={() => select("favorites")}><PixelIcon name="star" />즐겨찾기</button><button aria-pressed={tab === "recent"} onClick={() => select("recent")}><PixelIcon name="clock" />최근 검색</button></div>}{error && <p className="feedback" role="status">{error}</p>}{tab === "recent" ? recent.length ? <><div className="toolbar recent-searches">{recent.map((query) => <Link className="secondary-button" key={query} href={`/search?q=${encodeURIComponent(query)}`}><PixelIcon name="search" />{query}</Link>)}</div><button className="secondary-button" onClick={() => setError(clearRecent() ? "" : "저장 공간을 사용할 수 없어요.")}>최근 검색 지우기</button></> : <StatePanel>아직 최근 검색이 없어요.</StatePanel> : <><div className="collection-toolbar"><p>총 <strong>{items.length}개</strong></p><div className="view-switch" aria-label="목록 표시 방식"><button aria-label={storageMode ? "격자 보기" : "그리드 보기"} aria-pressed={view === "grid"} onClick={() => setView("grid")}><PixelIcon name="grid" /></button><button aria-label="목록 보기" aria-pressed={view === "list"} onClick={() => setView("list")}><PixelIcon name="list" /></button></div></div>{visible.length ? <div className={`medicine-grid library-grid ${view === "list" ? "list-view" : ""}`}>{visible.map((medicine) => <div className="library-entry" key={medicine.id}><MedicineCard medicine={medicine} />{storageMode && tab !== "viewed" && <button className="text-link remove-button" onClick={() => setError(removeMedicine(medicine.id) ? "" : "저장 공간을 사용할 수 없어요.")}>보관함에서 삭제</button>}</div>)}</div> : storageMode ? <ArchiveEmpty tab={tab} /> : <StatePanel state="book">{tab === "favorites" ? "즐겨찾기한 약이 없어요." : tab === "viewed" ? "아직 최근 본 약이 없어요." : "아직 모은 약이 없어요. 검색 결과에서 약을 저장해보세요."}<br /><Link href="/search" className="text-link">의약품 검색하기</Link></StatePanel>}{pages > 1 && <div className="pagination"><button aria-label="이전 페이지" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span>{currentPage} / {pages}</span><button aria-label="다음 페이지" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>›</button></div>}</>}{!storageMode && <p className="source-note">도감과 즐겨찾기는 현재 브라우저에 보관됩니다.</p>}</div>{storageMode && <ArchiveSleepScene />}</section>;
}

