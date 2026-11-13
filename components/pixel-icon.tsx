export type IconName = "home" | "search" | "book" | "bookmark" | "camera" | "pill" | "arrow" | "heart" | "star" | "clock" | "warning" | "flask" | "back" | "grid" | "list";
// Bounds end in the transparent gap before the sprite-sheet captions.
const sprites: Partial<Record<IconName, [number, number, number, number]>> = {
  home: [414, 463, 43, 38], search: [486, 462, 44, 39], book: [560, 463, 43, 36],
  bookmark: [637, 462, 44, 38], camera: [710, 463, 47, 36], pill: [785, 462, 44, 38],
  star: [862, 462, 43, 37], clock: [941, 463, 42, 37],
};

export function PixelIcon({ name, className = "" }: { name: IconName; className?: string }) {
  if (name === "back") return <svg className={`pixel-icon ${className}`} width="24" height="24" viewBox="45 84 35 31" aria-hidden="true"><image href="/brand/detail-original.png" width="768" height="1365" /></svg>;
  const sprite = sprites[name];
  if (sprite) return <svg className={`pixel-icon ${className}`} width="24" height="24" viewBox={sprite.join(" ")} aria-hidden="true" preserveAspectRatio="xMidYMid meet"><image href="/brand/characters-original.png" width="1152" height="768" /></svg>;
  if (name === "heart" || name === "warning" || name === "flask") {
    const box = name === "heart" ? "40 643 63 65" : name === "warning" ? "40 894 64 65" : "40 1080 64 64";
    return <svg className={`pixel-icon ${className}`} width="24" height="24" viewBox={box} aria-hidden="true"><image href="/brand/detail-original.png" width="768" height="1365" /></svg>;
  }
  const path = name === "grid" ? "M2 2h6v6H2Zm10 0h6v6h-6ZM2 12h6v6H2Zm10 0h6v6h-6Z" : name === "list" ? "M2 3h3v3H2Zm5 0h11v3H7ZM2 9h3v3H2Zm5 0h11v3H7ZM2 15h3v3H2Zm5 0h11v3H7Z" : "M6 3h3v3h3v3h3v2h-3v3H9v3H6v-3h3v-3h3V9H9V6H6Z";
  return <svg className={`pixel-icon ${className}`} width="24" height="24" viewBox="0 0 20 20" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true"><path d={path} /></svg>;
}



