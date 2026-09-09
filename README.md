# Telemera

출시 예정 게임을 소개하는 인터랙티브 사이트입니다. 클릭으로 병원 커튼을 열고 Telemera 첫 화면에서 입장 장치로 이동합니다. 장치의 세 퍼즐을 풀면 게임 정보와 3개 스테이지 탐험에 접근할 수 있습니다. 게임 화면에서 찾은 단서는 각 스테이지의 외부 패널에 연결됩니다.

## 실행

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m flask --app app run --port 5000
```

프런트엔드 빌드 없이 Flask와 브라우저 ES 모듈로 실행합니다. Node 의존성은 개발용 렌더 검사와 폰트 원본 관리에 사용합니다.

## 조작

- 바닥·물건을 클릭: 가구를 피해 해당 위치로 이동하거나 조사합니다.
- 방향키/WASD: 8방향 이동. E: 가까운 물건 조사. 화면의 방향 버튼도 지원합니다.
- 스테이지 이동: 단서와 패널 조건을 맞추고 영상을 끝까지 재생한 뒤 전환 장치의 슬라이더를 끝으로 옮깁니다. 영상 소스는 요청에 따라 비워 두었습니다.
- 외부 눈·밸브·조명: 방 안 기계, 조명과 음악의 음색·잔향을 바꿉니다.
- NPC: 해당 스테이지 퍼즐의 조작 원리를 확인합니다.
- 영상 플러그: 화면과 탐험을 멈췄다가 같은 자리에서 연결합니다.
- 방송: 사용자 재생 후 시작합니다. 입장 장치 페이지는 TRACK09로 고정되어 재생·정지·음량만 조절할 수 있습니다.

## 페이지와 홍보 콘텐츠

| 경로       | 역할                                            |
| ---------- | ----------------------------------------------- |
| `/`        | 클릭으로 여는 병원 커튼, Telemera, ENTER        |
| `/chamber` | 세 입장 퍼즐, 고정 음악, 게임·정보 접근 장치      |
| `/play`    | 현재 스테이지 탐험과 대응하는 외부 퍼즐 패널      |
| `/games`   | 출시 예정 게임의 공개 정보                      |
| `/records` | 기록실 경로 (제공된 콘텐츠 없음) |
| `/about`   | Telemera의 게임 홍보 공간과 탐험 방법 소개       |
| `/main`    | `/`로 리다이렉트하는 기존 주소                  |
| 그 외 주소 | 같은 세계관의 404 페이지와 복귀 링크            |

`content/games.json`에서 게임의 `title`, `description`, `status`, `release`, `store_url`, `trailer_url`을 편집합니다. 현재 실제 제목과 스토어 URL이 제공되지 않아 중립적인 공개 준비 상태로 두었습니다. URL이 `null`인 항목은 링크로 표시하지 않습니다. 추가 게임은 `games` 배열에 고유한 `id`로 추가합니다.

## 구조

```text
app.py                         Flask 라우트와 게임 카탈로그 주입
content/games.json             실제 홍보 콘텐츠
 templates/
   base.html                   공통 문서·메타데이터·폰트
   pages/                      탐험, 게임 보관함, 기록실, 소개
   partials/                   헤더·푸터·게임 화면·방송·장치·대화상자
 static/
   css/                        기본 토큰, 레이아웃, 탐험 UI, 장치, 문서, 폰트
   fonts/                      Galmuri 웹폰트 원본과 라이선스
   images/                     이전 배경 원본(미사용), UI 에셋과 파비콘
   js/
     site-devices.js            게임 밖 장치와 게임 상태 연결
     archive-page.js            기록실 확장용 모듈
     content/                  장치 동작과 조작 안내
     game/
       index.js                진입점, 상호작용 연결, 프레임 루프
       input.js                키보드·다중 터치·포커스 관리
       dialog.js               대화상자와 원래 장치로 포커스 복귀
       config.js               맵, 오브젝트, 충돌 영역, 초기 상태
       navigation.js           충돌, 근접 판정, 출입구 이동
       pathfinding.js          A* 클릭 경로, 연속 경유점 이동
       picking.js              투영 좌표에 맞는 클릭 판정
       viewport.js             화면 비율과 연속 해상도 조절
       installations.js        실제 벽면 설비와 가동 애니메이션
       renderer.js             벽·바닥·오브젝트 합성과 근접 실루엣 발광
       character.js            8방향 공통 3D 관절과 보행 블렌딩
       machines.js             특수 병동 기계 모델과 상태별 움직임
       materials.js            절제된 저해상도 표면 재질
       tracks.js               8곡의 멜로디·화성·리듬 데이터
       audio.js                오디오 클록 기반 재생·잔향·분석기
       session.js              탭 내 상태 저장과 검증
 scripts/                      실제 Canvas를 사용하는 오프라인 렌더 검사
 tests/                        이동, 경로, 오디오, 장치, 입력, 페이지 검사
 docs/art-direction.md         그래픽 방향, 배경 제작 사양, 출처
```

각 맵은 36×7 공간입니다. `config.js`의 가구 크기는 충돌과 근접 판정의 기준입니다. 렌더 모델 크기를 바꿀 때 이 값도 맞춥니다. 출입구의 `visualOffset`과 `pickWidth`는 가장자리 안쪽에 그린 문과 클릭 영역을 일치시킵니다. 배경 이미지는 로드하지 않습니다. 벽과 바닥은 Canvas 면으로, 설비는 독립 오브젝트로 렌더링합니다. 플레이어의 충돌 여유 폭은 0.38이며 의자의 측면 모니터까지 포함해 설비의 전체 폭을 막습니다. 캐릭터는 같은 관절 좌표를 8방향으로 투영하며, 실제 이동 거리로 보행을 진행합니다. 양발은 짧고 대칭적인 보폭으로 교대하며 한쪽 발만 바닥에서 들립니다. 무릎은 일정한 호를 따라 움직여 대각선에서도 다리가 교차하거나 순간적으로 꺾이지 않습니다. 캔버스 내부 비율은 표시 영역과 일치시켜 캐릭터가 눌리지 않도록 합니다.

탐험 위치·수집·장치·발견 상태와 곡·음량 설정은 현재 탭의 `sessionStorage`에 저장합니다. 서버로 전송하지 않습니다. 영상 전원 꺼짐과 음악 재생 여부는 복원하지 않습니다. 저장소가 차단되거나 데이터가 잘못되어도 기본 상태로 탐험할 수 있습니다.

## 검사

```powershell
npm ci
npm test
.venv/Scripts/python -m unittest discover -s tests
npm run render:qa
npm run render:audio
npm run check:audio-stress
```

`render:qa`는 실제 Canvas 렌더러로 8방향×8 보행 자세와 손을 뻗는 자세, 네 구역, 가로·중간·모바일 비율의 입구 화면을 생성합니다. 결과는 `artifacts/qa/`에 저장되며 Git에서 제외합니다. 오디오/입력 단위 검사는 모의 Web Audio·DOM에서 실행합니다. `render:audio`는 실제 오디오 그래프를 Node Web Audio의 OfflineAudioContext로 렌더링해 8곡의 WAV와 피크/RMS 값을 저장합니다. `check:audio-stress`는 리듬곡과 오르골 곡을 최대 음량으로 재생하면서 효과음을 연속으로 더해 클리핑 여부를 확인합니다. 이 검사는 브라우저 레이아웃이나 실제 기기 청취 검사를 대신하지 않습니다.

폰트는 [Galmuri](https://github.com/quiple/galmuri) 2.39.2이며 SIL OFL 1.1 원문을 `static/fonts/Galmuri-LICENSE.txt`에 포함했습니다. 그래픽과 레퍼런스에 대한 설명은 `docs/art-direction.md`를 참고하세요.
