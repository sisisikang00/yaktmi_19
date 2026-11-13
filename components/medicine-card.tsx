"use client";
import Link from "next/link";
import { useState } from "react";
import type { Medicine } from "@/lib/types/medicine";
import { toggleMedicine, useLibrary } from "@/lib/library";
import { MedicineImage } from "./medicine-image";
import { PixelIcon } from "./pixel-icon";
export function MedicineActions({ medicine, saveOnly = false }: { medicine: Medicine; saveOnly?: boolean }) {
  const { entries } = useLibrary();
  const entry = entries.find((value) => value.medicine.id === medicine.id);
  const [error, setError] = useState("");
  function toggle(field: "saved" | "favorite") { setError(toggleMedicine(medicine, field) ? "" : "브라우저 저장 공간을 사용할 수 없어요."); }
  return <><div className="card-actions"><button className="secondary-button" aria-pressed={entry?.saved ?? false} onClick={() => toggle("saved")}><PixelIcon name="bookmark" />{entry?.saved ? "저장됨" : "도감에 저장"}</button>{!saveOnly && <button className="secondary-button" aria-pressed={entry?.favorite ?? false} onClick={() => toggle("favorite")}><PixelIcon name="star" />{entry?.favorite ? "즐겨찾기됨" : "즐겨찾기"}</button>}</div>{error && <p className="feedback" role="status">{error}</p>}</>;
}
function FavoriteButton({ medicine }: { medicine: Medicine }) {
  const { entries } = useLibrary();
  const favorite = entries.some((entry) => entry.medicine.id === medicine.id && entry.favorite);
  const [failed, setFailed] = useState(false);
  return <><button className="favorite-button" aria-label={`${medicine.name} ${favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}`} aria-pressed={favorite} onClick={() => setFailed(!toggleMedicine(medicine, "favorite"))}><PixelIcon name="star" /></button>{failed && <p role="status" className="feedback">저장 공간을 사용할 수 없어요.</p>}</>;
}
export function MedicineCard({ medicine }: { medicine: Medicine }) {
  return <article className="medicine-card"><FavoriteButton medicine={medicine} /><Link className="medicine-card-link" href={`/medicines/${encodeURIComponent(medicine.id)}`}><MedicineImage src={medicine.image} name={medicine.name} /><div className="medicine-card-copy"><h2>{medicine.name}</h2><p>{medicine.manufacturer}</p>{medicine.category && <span className="medicine-tag">{medicine.category}</span>}{medicine.shape && <p>{[medicine.shape, medicine.color, medicine.imprint].filter(Boolean).join(" · ")}</p>}</div></Link><MedicineActions medicine={medicine} saveOnly /></article>;
}

