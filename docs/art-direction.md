# Telemera의 그래픽 방향

목적은 게임처럼 탐험할 수 있는 인디 게임 홍보 공간이다. 홍보 정보는 상단 게임 메뉴와 하단 보관함에서 바로 읽을 수 있다. 탐험은 입장 조건이 아닌 브랜드 경험이다.

## 화면 규칙

- 검정, 어두운 청록, 바랜 금속색을 기본으로 사용한다. 밝은 배경을 만들지 않는다.
- 넓은 전경은 PS1 시기의 사전 렌더 배경처럼, 캐릭터와 조작 장치는 낮은 해상도의 명확한 실루엣으로 만든다.
- 모니터, 병상, 눈, 배양관, 테이프가 서로의 역할을 바꾸는 세계다. 무작위 노이즈나 일반적인 폐병원 소품만으로 분위기를 만들지 않는다.
- 작은 캐릭터는 머리와 몸이 모두 기계다. CRT 얼굴, 둥근 손, 짧은 보행과 어깨 관절을 사용한다. 대각선에서도 같은 3D 구조를 투영한다.
- 근접 강조는 실루엣 가장자리에 약하게 나타난다. 배경 전체의 디더링과 반복 스캔라인은 사용하지 않는다.
- 모션 감소 설정에서는 보행·기계 반복 동작·로고 글리치·장치 전환을 정지시킨다.

## 참고한 작품

- [Endacopia](https://andyl4nd.itch.io/endacopiademo): 2D 캐릭터와 공간감 있는 배경, 물건을 눌러 발견하는 이야기.
- [Undertale](https://undertale.com/about/): 작은 실루엣과 간결한 표정, 짧고 독특한 대사.
- [ENA: Dream BBQ](https://store.steampowered.com/app/2134320/ENA_Dream_BBQ/): 낯선 디지털 건축과 어긋난 사물의 조합.
- [Mesmalie](https://orbitaldot.com/mesmalie/): 기이한 공간과 탐험의 분위기.
- [The Many Pieces of Mr. Coo](https://www.nintendo.com/us/store/products/the-many-pieces-of-mr-coo-switch/): 화면 자체의 물건을 작동시키는 포인트 앤 클릭 발상.

레퍼런스의 캐릭터, 음악, 그래픽 파일은 복제하지 않았다. 캐릭터·전경 소품·장치는 이 프로젝트의 Canvas/CSS 코드이며, 배경은 내장 Image Generation으로 새로 제작했다. 음악은 프로젝트의 음표·화성·리듬 데이터로 합성한다.

## 배경 파일

| 파일                                            | 공간                 | 원본 생성 파일                                  |
| ----------------------------------------------- | -------------------- | ----------------------------------------------- |
| `static/images/telemera-ward-panorama.png`      | 눈을 빌려주는 대기실 | `exec-31490309-6194-4140-9b5e-ad23f5baabd6.png` |
| `static/images/telemera-dream-panorama.png`     | 인공 꿈 처치실       | `exec-69b4503e-b73b-4766-8d43-86cffa6ca59b.png` |
| `static/images/telemera-archive-panorama.png`   | 미발매 기록실        | `exec-aa98ef99-0506-4b64-a302-05660b9178b1.png` |
| `static/images/telemera-reception-panorama.png` | 수신인 없는 접수실   | `exec-c13a7640-de8d-4e19-80f9-82abfe657bb9.png` |

원본 크기는 각각 2172×724이다. 생성 원본은 Codex generated_images 디렉터리에 보존하고 사용본만 프로젝트에 복사했다. 파일은 원본 PNG이며 배경을 다시 제작할 때 아래 사양을 유지한다.

## 재생성용 공통 프롬프트

> A wide 3:1 side-scrolling adventure game backdrop for Telemera. An uncanny digital hospital fused with obsolete computers. Straight-on theatrical frontal view, subtle low-poly PS1 prerendered 3D depth, smooth broad shading, gently low-resolution textures without crunchy noise or excessive dithering. Dark, restrained palette; no bright background, no white surfaces. Top 62% detailed imposing wall; bottom 38% clear continuous flat walkable dark tiled floor. No readable text, no characters, no logos, no foreground furniture. Interactive props will be drawn separately by game code. Handmade eerie indie-adventure atmosphere.

대기실: dark jade, huge circular wall machinery, recessed CRT terminals, pipes, dark green light. 처치실: dark burgundy, clinical dream theatre, four opalescent lenses, purple glass tubes, brass gauges. 기록실: dark petrol-blue, indigo and tarnished brass, magnetic tape reels, sealed medical-data drawers, an immense cassette-shaped machine.

접수실: dark tobacco-brown, muted teal, tarnished copper, pneumatic message tubes, brass mail slots, a huge obsolete CRT built into an organ-like pipe machine, hanging telephone cables and ducts shaped subtly like folded envelopes. 동일한 62% 바닥 경계와 빈 전경을 유지한다. 접수원과 움직이는 우편 캡슐은 Canvas 코드로 별도 제작했다.

## 기록실 제작에 사용한 최종 프롬프트

> Create a NEW wide 3:1 side-scrolling adventure game background for Telemera. Use the reference only for rendering style and composition proportions, not same room. This new room is the archive of games that have not yet been born: an uncanny digital hospital fused with an obsolete tape library. Dark petrol-blue, desaturated indigo, tarnished brass, tiny muted amber indicator lights. Large strange magnetic tape reels built into wall, tall blank sealed medical-data drawers, cable loops, heavy square computer terminals recessed into architecture, an immense mysterious cassette-shaped machine in center. No readable text, no characters, no logos, no foreground furniture, no floating icons. Straight-on theatrical frontal view with subtle low-poly PS1 prerendered 3D depth, smooth broad shading, gently low resolution textures without crunchy noise or excessive dithering. Do not use bright background or white surfaces. Top 62% is the imposing detailed wall, bottom 38% a clear continuous flat walkable dark tiled floor, horizon at 62% image height. Whole image panoramic 3:1. Rich eerie handmade indie adventure atmosphere, dignified surreal objects, soft pools of cool light, much more than a generic abandoned hospital. All foreground interactive props will be drawn separately by game code.

스타일 참고 이미지로 프로젝트의 대기실 배경을 첨부했다.
