import Image from "next/image";
export type PotionState = "default" | "greeting" | "searching" | "happy" | "thinking" | "confused" | "empty" | "loading" | "book" | "storage" | "photo" | "detail" | "warning";
const labels: Record<PotionState,string> = {default:"기본 대기",greeting:"인사",searching:"검색 중",happy:"성공",thinking:"궁금함",confused:"주의",empty:"검색 결과 없음",loading:"휴식 및 로딩",book:"약 도감",storage:"즐겨찾기",photo:"사진 촬영",detail:"상세정보 확인",warning:"확인 및 주의"};
const states: Record<PotionState,string> = {default:"idle",greeting:"idle",searching:"searching",happy:"success",thinking:"curious",confused:"warning",empty:"no_result",loading:"sleeping",book:"medicine_book",storage:"favorite",photo:"camera",detail:"searching",warning:"warning"};
// Original canvas width/height and the last safe crop boundary before detached sprite rows.
const baselineCrops = {
  idle: [210, 237, 209],
  curious: [251, 278, 251],
  no_result: [253, 273, 246],
  success: [259, 256, 229],
  warning: [244, 268, 241],
} as const;

function PotionPose({ pose, small }: { pose: string; small: boolean }) {
  const crop = baselineCrops[pose as keyof typeof baselineCrops];
  const src = `/assets/character/states/${pose}.png`;
  if (!crop) {
    return <Image className="potion-image" src={src} fill unoptimized sizes={small ? "96px" : "180px"} alt="" draggable={false} />;
  }
  const [width, height, visibleHeight] = crop;
  return (
    <svg className="potion-image potion-pose-crop" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <svg width={width} height={visibleHeight} overflow="hidden">
        <image href={src} width={width} height={height} />
      </svg>
    </svg>
  );
}

export function PotionCharacter({state="default",small=false,animated=false}:{state?:PotionState;small?:boolean;animated?:boolean}) {
  // The idle source has an unrelated baseline at y=218..220, below the bottle ending at y=207.
  // Display masking hides only this extra area; source pixels and the bottle remain unchanged.
  // Several supplied pose frames contain neighboring pieces or an already-cropped bottle.
  // Keep the intact original idle PNG and animate its position, never redraw missing pixels.
  return <span className={`potion-character ${small?"small":""} ${animated?"animated":""} state-${state}`} role="img" aria-label={`포션병 마스코트 · ${labels[state]}`}><span className="potion-motion">{animated?<span className="potion-frame"><Image className="potion-image idle-potion" src="/assets/character/states/idle.png" width={210} height={237} style={{width:`${210/340*100}%`,height:"auto",left:`${65/340*100}%`,top:`${40/320*100}%`}} unoptimized loading="eager" alt="" draggable={false}/></span>:<PotionPose pose={states[state]} small={small} />}</span></span>;
}

