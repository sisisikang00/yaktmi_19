"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="page-content"><h1 className="page-title">화면을 불러오지 못했어요.</h1><button className="primary-button" onClick={reset}>다시 시도</button></section>; }
