"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PixelIcon } from "./pixel-icon";
import { OriginalArt } from "./original-art";
import { PotionCharacter } from "./potion-character";
export function HomeScreen() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  function search(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!query.trim()) { setError("약 이름을 입력해주세요."); return; } router.push(`/search?q=${encodeURIComponent(query.trim())}`); }
  return <section className="original-home" aria-labelledby="hero-title"><h1 id="hero-title" className="sr-only">먹기 전에 잠깐.</h1><div className="original-home-visual"><OriginalArt part="homeTitle" label="약MI." className="home-service-logo" /><p className="home-tagline">약에 대한 TMI.</p><OriginalArt part="slogan" label="먹기 전에 잠깐." className="home-slogan" /><div className="home-potion-stage"><span className="home-star star-left" aria-hidden="true">✦</span><span className="home-star star-right" aria-hidden="true">✦</span><PotionCharacter animated /><div className="pixel-meadow" aria-hidden="true"><OriginalArt part="meadowLeft"/><OriginalArt part="meadowRight"/></div></div></div><div className="original-home-controls"><form className="original-home-form" onSubmit={search}><label className="search-input"><PixelIcon name="search" /><span className="sr-only">약 이름</span><input required maxLength={100} placeholder="약 이름을 입력하세요" value={query} onChange={(e) => { setQuery(e.target.value); setError(""); }} /></label><button className="art-button" type="submit"><OriginalArt part="search" /><span className="sr-only">검색하기</span></button></form>{error && <p className="search-status" role="status">{error}</p>}<div className="original-quick-actions"><Link className="art-button" href="/identify?mode=photo"><OriginalArt part="photo" /><span className="sr-only">사진으로 찾기</span></Link><Link className="art-button" href="/identify"><OriginalArt part="shape" /><span className="sr-only">모양으로 찾기</span></Link></div></div></section>;
}


