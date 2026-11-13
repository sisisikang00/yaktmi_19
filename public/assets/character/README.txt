약MI. 포션 캐릭터 에셋

animation/frame_01.png ~ frame_08.png: 메인 대기 애니메이션 프레임. 순서대로 재생하고 1→8→1 반복.
states/: 화면 상태별 개별 PNG.
reference_sprite_sheet.png: 원본 참고 시트.

모든 개별 에셋은 RGBA PNG이며 배경은 투명합니다. 픽셀 아트 선명도를 위해 CSS image-rendering: pixelated 사용을 권장합니다. 프레임은 CSS steps 또는 requestAnimationFrame 대신 간단한 프레임 전환으로 재생할 수 있습니다.
