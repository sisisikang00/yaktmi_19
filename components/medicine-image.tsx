"use client";
import { useState } from "react";
export function MedicineImage({ src, name }: { src?: string; name: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  let safe: string | undefined;
  try { if (src) { const url = new URL(src); if (url.protocol === "https:" && !url.username && !url.password) safe = url.href; } } catch { /* Missing or invalid images have a text placeholder. */ }
  return <div className="medicine-image">{safe && failedSrc !== safe ? /* eslint-disable-next-line @next/next/no-img-element -- Preserve original official image without pixel filters or proxy caching. */
    <img src={safe} alt={`${name} · 식약처 제공 의약품 사진`} onError={() => setFailedSrc(safe)} loading="lazy" referrerPolicy="no-referrer" /> : <span>의약품 이미지 미제공</span>}</div>;
}
