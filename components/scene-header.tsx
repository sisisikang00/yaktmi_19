import Link from "next/link";
import { PotionCharacter, type PotionState } from "./potion-character";
import { PixelIcon } from "./pixel-icon";
import { OriginalArt } from "./original-art";
export function SceneHeader({title,state,back="/",children}:{title:string;state:PotionState;back?:string;children?:React.ReactNode}) {
  const detail=title==="약 상세정보";
  return <div className={`scene-header ${detail?"scene-detail":""}`}>{detail&&<OriginalArt part="logo" label="약MI." className="detail-service-logo"/>}<div className="scene-heading-row"><Link href={back} className="back-button" aria-label="이전 화면"><PixelIcon name="back"/></Link><h1>{title}</h1><PotionCharacter state={state} small/></div>{children}<OriginalArt part="cloud" className="header-cloud"/></div>;
}

