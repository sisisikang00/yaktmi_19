"use client";

import { useEffect, useState } from "react";
import type { MedicineDetail } from "@/lib/types/medicine";
import { useApi } from "@/lib/use-api";
import { recordViewed } from "@/lib/library";
import { StatePanel } from "./state-panel";
import { MedicineImage } from "./medicine-image";
import { MedicineActions } from "./medicine-card";
import { SourceNote } from "./source-note";
import { SceneHeader } from "./scene-header";
import { PixelIcon, type IconName } from "./pixel-icon";
const sections: { field: keyof MedicineDetail; title: string; icon: IconName; tone: string }[] = [ { field: "efficacy", title: "효능·효과", icon: "heart", tone: "coral" }, { field: "dosage", title: "용법·용량", icon: "pill", tone: "blue" }, { field: "warnings", title: "주의사항 경고", icon: "warning", tone: "warning" }, { field: "precautions", title: "사용상 주의사항", icon: "warning", tone: "warning" }, { field: "ingredients", title: "성분", icon: "flask", tone: "lavender" }, { field: "interactions", title: "상호작용", icon: "pill", tone: "blue" }, { field: "sideEffects", title: "부작용", icon: "warning", tone: "warning" }, { field: "storage", title: "보관방법", icon: "bookmark", tone: "lavender" } ];
export function MedicineSections({ data, compact = false, fields }: { data: MedicineDetail; compact?: boolean; fields?: (keyof MedicineDetail)[] }) {
  return <>{sections.filter((section) => (!fields || fields.includes(section.field)) && (section.field !== "warnings" || data.warnings) && (!compact || ["efficacy", "dosage", "precautions"].includes(section.field))).map(({ field, title, icon, tone }) => <section className={`detail-section tone-${tone}`} key={field}><h2><PixelIcon name={icon} />{title}</h2><p>{typeof data[field] === "string" ? data[field] as string : "공식 API에서 제공된 정보가 없습니다."}</p></section>)}</>;
}
export function DetailScreen({ id }: { id: string }) {
  const [tab, setTab] = useState(0);
  const tabs = ["기본정보", "주의사항", "성분", "보관"];
  const fields: (keyof MedicineDetail)[][] = [["efficacy", "dosage", "precautions"], ["warnings", "precautions", "interactions", "sideEffects"], ["ingredients"], ["storage"]];
  const { data, error, loading, retry } = useApi<MedicineDetail>(`/api/medicines/${encodeURIComponent(id)}`);
  useEffect(() => { if (data) recordViewed(data); }, [data]);
  return <section className="page-content"><SceneHeader title="약 상세정보" state="detail" back="/search" /><div className="page-body">{loading ? <StatePanel state="loading">의약품 상세정보를 확인하고 있어요.</StatePanel> : error ? <StatePanel state="confused" retry={retry}>{error}</StatePanel> : data ? <>{data.sourceErrors.length > 0 && <div className="notice" role="status">일부 정보({data.sourceErrors.join(", ")})를 불러오지 못했어요. 미표시 항목은 조회 실패로 인한 것일 수 있어요. <button className="text-link" onClick={retry}>다시 조회</button></div>}<div className="detail-layout"><aside className="detail-summary pixel-panel"><MedicineImage src={data.image} name={data.name} /><h2 className="medicine-name">{data.name}</h2><div className="medicine-tags">{data.category && <span className="medicine-tag"><PixelIcon name="pill" />{data.category}</span>}{data.form && <span className="medicine-tag">{data.form}</span>}</div><dl className="summary-facts"><dt>제조사</dt><dd>{data.manufacturer}</dd><dt>품목기준코드</dt><dd>{data.id}</dd>{data.barcode && <><dt>표준코드</dt><dd>{data.barcode}</dd></>}</dl><MedicineActions medicine={data} /></aside><div className="detail-information"><div className="detail-tabs" role="tablist" aria-label="약 상세정보"><>{tabs.map((label, index) => <button type="button" key={label} role="tab" id={"medicine-tab-" + index} aria-controls="medicine-tabpanel" aria-selected={tab === index} tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={(event) => { const next = event.key === "ArrowRight" ? (index + 1) % 4 : event.key === "ArrowLeft" ? (index + 3) % 4 : event.key === "Home" ? 0 : event.key === "End" ? 3 : null; if (next !== null) { event.preventDefault(); setTab(next); document.getElementById("medicine-tab-" + next)?.focus(); } }}>{label}</button>)}</></div><div role="tabpanel" id="medicine-tabpanel" aria-labelledby={"medicine-tab-" + tab} tabIndex={0}><MedicineSections data={data} fields={fields[tab]} />{tab === 0 && <section className="detail-section tone-lavender"><h2><PixelIcon name="book" />허가 정보</h2><dl className="detail-facts">{[["허가일자", data.permitDate], ["허가구분", data.permitKind], ["취소·상태", data.cancelStatus], ["정보 변경일", data.updatedAt]].map(([label, value]) => <div className="contents" key={label}><dt>{label}</dt><dd>{value ?? "미제공"}</dd></div>)}</dl></section>}</div></div></div></> : null}<SourceNote /></div></section>;
}


