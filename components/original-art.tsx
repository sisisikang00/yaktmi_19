// Display-only source rectangles: artwork, lettering and the pink period are unchanged.
const slices = {
  logo: [200,100,382,161], slogan:[0,270,768,137],
  homeTitle:[0,55,768,215], cloud:[407,669,58,34],
  search:[30,818,708,122], photo:[29,961,351,223], shape:[388,961,351,223],
  meadowLeft:[0,580,279,78], meadowRight:[510,580,258,78], landscape:[0,1205,768,160],
  detailHeading:[65,150,420,126],
} as const;
export function OriginalArt({ part, label, className = "" }: { part: keyof typeof slices; label?: string; className?: string }) {
  const source = part === "cloud"
    ? { href: "/brand/characters-original.png", width: 1152, height: 768 }
    : { href: part === "detailHeading" ? "/brand/detail-original.png" : "/brand/home-original.png", width: 768, height: 1365 };
  return <svg className={`original-art original-${part} ${className}`} viewBox={slices[part].join(" ")} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} preserveAspectRatio="xMidYMid meet"><image {...source} /></svg>;
}
