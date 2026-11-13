"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/types/medicine";
import { recordSearch } from "@/lib/library";
import { useApi } from "@/lib/use-api";
import { PixelIcon } from "./pixel-icon";
import { MedicineCard } from "./medicine-card";

import { StatePanel } from "./state-panel";
import { SourceNote } from "./source-note";
import { SceneHeader } from "./scene-header";
export function SearchScreen({ query, source, page }: { query: string; source: "easy" | "permit"; page: number }) {
  const [input, setInput] = useState(query);

  const router = useRouter();
  const url = query ? `/api/medicines?${new URLSearchParams({ q: query, source, page: String(page) })}` : null;
  const { data, error, loading, retry } = useApi<SearchResult>(url);

  useEffect(() => { if (data && query) recordSearch(query); }, [data, query]);
  function navigate(nextPage: number, nextSource = source, nextQuery = query) { router.push(`/search?${new URLSearchParams({ q: nextQuery, source: nextSource, page: String(nextPage) })}`); }
  function submit(event: FormEvent) { event.preventDefault(); if (input.trim()) navigate(1, source, input.trim()); }
  return <section className="page-content search-page"><SceneHeader title={query ? "검색 결과" : "의약품 검색"} state={loading ? "searching" : data?.items.length ? "happy" : "searching"} /><div className="page-body"><form className="search-form" onSubmit={submit}><label className="search-input"><PixelIcon name="search" /><span className="sr-only">약 이름</span><input required value={input} maxLength={100} onChange={(e) => setInput(e.target.value)} placeholder="약 이름을 입력해주세요" /></label><button className="primary-button">검색하기<span className="reference-chevron" aria-hidden="true" /></button></form><div className="toolbar filter-tabs" aria-label="검색 범위"><button aria-pressed={source === "permit"} onClick={() => navigate(1, "permit")}>전체 허가 의약품</button><button aria-pressed={source === "easy"} onClick={() => navigate(1, "easy")}>e약은요</button><Link className="text-link identify-link" href="/identify"><PixelIcon name="pill" /><span>모양으로 찾기</span></Link></div>{loading ? <StatePanel state="loading">식약처 의약품 정보를 불러오고 있어요.</StatePanel> : error ? <StatePanel state="confused" retry={retry}>{error}</StatePanel> : !query ? <StatePanel state="thinking">찾고 싶은 약 이름을 입력해주세요.</StatePanel> : data ? <><p className="result-count">“{query}” 검색 결과 <strong>{data.total.toLocaleString()}건</strong></p>{data.items.length ? <div className="search-workspace"><div className="search-list"><div className="medicine-grid result-list">{data.items.map((item) => <MedicineCard key={item.id} medicine={item} />)}</div>{data.total > data.pageSize && <div className="pagination"><button disabled={page <= 1} onClick={() => navigate(page - 1)}>이전</button><span>{page} / {Math.ceil(data.total / data.pageSize)}</span><button disabled={page * data.pageSize >= data.total} onClick={() => navigate(page + 1)}>다음</button></div>}</div></div> : <StatePanel state="empty">검색 결과가 없어요. 약 이름이나 검색 범위를 바꿔보세요.</StatePanel>}</> : null}<SourceNote /></div></section>;
}


