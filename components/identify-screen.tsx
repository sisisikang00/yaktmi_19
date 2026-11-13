"use client";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { IdentificationResult } from "@/lib/types/medicine";
import { useApi } from "@/lib/use-api";
import { PixelIcon } from "./pixel-icon";
import { MedicineCard } from "./medicine-card";
import { StatePanel } from "./state-panel";
import { SceneHeader } from "./scene-header";
import { SourceNote } from "./source-note";
import { PotionCharacter } from "./potion-character";
interface Criteria { name: string; shape: string; color: string; imprint: string; form: string; line: string }
export function IdentifyScreen({ photoMode }: { photoMode: boolean }) {
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [page, setPage] = useState(1);
  const [validation, setValidation] = useState("");
  const photoScene = photoMode && <div className="photo-character-scene" aria-hidden="true"><PotionCharacter state="photo" /></div>;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const url = criteria ? `/api/identification?${new URLSearchParams({ ...criteria, page: String(page) })}` : null;
  const { data, error, loading, retry } = useApi<IdentificationResult>(url);
  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)) { setFileError("JPG, PNG, WebP, GIF, AVIF 사진을 선택해주세요."); return; }
    if (file.size > 10 * 1024 * 1024) { setFileError("사진은 10MB 이하로 선택해주세요."); return; }
    setFileError(""); setPreview(URL.createObjectURL(file));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value: Criteria = { name: String(form.get("name") ?? "").trim(), shape: String(form.get("shape") ?? ""), color: String(form.get("color") ?? ""), imprint: String(form.get("imprint") ?? "").trim(), form: String(form.get("form") ?? "").trim(), line: String(form.get("line") ?? "") };
    if (!Object.values(value).some(Boolean)) { setValidation("이름, 모양, 색상, 제형, 분할선, 각인 중 하나 이상 입력해주세요."); return; }
    setValidation(""); setCriteria(value); setPage(1);
  }
  return <section className="page-content"><SceneHeader title={photoMode ? "사진으로 찾기" : "모양으로 찾기"} state={photoMode ? "photo" : "thinking"} /><div className="page-body">{!photoMode && <p className="page-intro">약의 색상·모양·제형·분할선·각인을 입력해주세요.</p>}{photoMode && <><div className="upload-area"><div className="photo-preview">{preview ? <Image unoptimized width={600} height={400} src={preview} alt="사용자가 선택한 약 사진 미리보기" /> : <span className="upload-placeholder"><PixelIcon name="camera" /><strong>약 사진을 등록하세요</strong><small>갤러리에서 선택하거나<br />직접 촬영할 수 있어요.</small></span>}</div><div className="upload-controls"><label className="file-picker"><PixelIcon name="camera" />갤러리에서 선택<input aria-label="사진 파일 선택" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={selectPhoto} /></label><label className="file-picker"><PixelIcon name="camera" />사진 촬영<input aria-label="카메라로 사진 촬영" type="file" capture="environment" accept="image/*" onChange={selectPhoto} /></label>{preview && <button className="secondary-button" onClick={() => setPreview("")}>사진 지우기</button>}{fileError && <p role="alert" className="feedback">{fileError}</p>}</div></div><div className="notice">사진을 자동 판별하지 않습니다. 모양·색상·각인을 직접 입력해 검색해주세요. 사진은 이 브라우저에서만 표시됩니다.</div></>}{photoScene}<details className="identification-details" open={photoMode ? (preview ? true : undefined) : true}><summary>식별 정보 입력</summary><form className="identify-form" onSubmit={submit}><div className="form-grid"><label className="field">약 이름 (선택)<input name="name" maxLength={100} placeholder="이름을 알고 있다면 입력" /></label><label className="field">낱알 모양<select name="shape" defaultValue=""><option value="">전체 모양</option>{["원형", "타원형", "장방형", "반원형", "삼각형", "사각형", "마름모형", "오각형", "육각형", "팔각형", "기타"].map((s) => <option key={s}>{s}</option>)}</select></label><label className="field">낱알 색상<select name="color" defaultValue=""><option value="">전체 색상</option>{["하양", "노랑", "주황", "분홍", "빨강", "갈색", "연두", "초록", "청록", "파랑", "남색", "자주", "보라", "회색", "검정", "투명"].map((c) => <option key={c}>{c}</option>)}</select></label><label className="field">각인 (앞·뒤 중 일부)<input name="imprint" maxLength={40} placeholder="약에 새겨진 문자나 숫자" /></label><label className="field">제형 키워드<input name="form" maxLength={30} placeholder="공식 제형명 일부 입력" /></label><label className="field">분할선<select name="line" defaultValue=""><option value="">전체 분할선</option><option value="-">-</option><option value="+">+</option></select></label></div><button className="primary-button">식별정보 검색<PixelIcon name="arrow" /></button>{validation && <p className="feedback" role="alert">{validation}</p>}</form></details><p className="source-note">공식 API에서 모양·색상·각인 직접 검색을 지원하지 않아, 이름으로 조회한 공식 목록을 100건씩 확인하고 조건에 맞는 후보를 표시합니다. 한 번의 조회는 전체 의약품을 검색한 결과가 아닙니다.</p>{loading ? <StatePanel state="loading">공식 낱알식별 목록에서 조건을 확인하고 있어요.</StatePanel> : error ? <StatePanel state="confused" retry={retry}>{error}</StatePanel> : data ? <><p className="page-intro">공식 목록 {((page - 1) * 100 + (data.scanned ? 1 : 0)).toLocaleString()}–{((page - 1) * 100 + data.scanned).toLocaleString()}번째 항목 확인 · 조건에 맞는 후보 {data.items.length}건</p>{data.items.length ? <div className="medicine-grid">{data.items.map((item) => <MedicineCard key={item.id} medicine={item} />)}</div> : <StatePanel>{data.nextPage ? "이번 조회 범위에는 맞는 후보가 없어요. 다음 범위도 확인해보세요." : page > 1 ? "이 조회 범위에는 맞는 후보가 없어요. 이전 범위의 결과도 확인해주세요." : "입력한 조건에 맞는 후보를 찾지 못했어요."}</StatePanel>}<div className="pagination"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>이전 범위</button><span>{page}</span><button disabled={!data.nextPage} onClick={() => setPage(data.nextPage!)}>다음 범위</button></div></> : null}<SourceNote /></div></section>;
}






