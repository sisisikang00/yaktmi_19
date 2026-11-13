import { PotionCharacter, type PotionState } from "./potion-character";
export function StatePanel({ state = "empty", children, retry }: { state?: PotionState; children: React.ReactNode; retry?: () => void }) {
  return <div className="state-panel" role="status"><PotionCharacter state={state} small /><p>{children}</p>{state === "loading" && <div className="loading-bar" />}{retry && <button className="secondary-button" onClick={retry}>다시 시도</button>}</div>;
}
