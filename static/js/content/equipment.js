import { EQUIPMENT } from "./archive.js";

/** Authored responses stay separate from input and animation code. */
export function inspectEquipment(id, state) {
  if (!Object.hasOwn(EQUIPMENT, id)) return null;
  if (!state.discovered.includes(id)) state.discovered.push(id);
  const result = {
    title: EQUIPMENT[id],
    text: "",
    gamesLink: false,
    track: null,
  };
  switch (id) {
    case "mail-tube":
      state.letterSent = !state.letterSent;
      result.text = state.letterSent
        ? "빈 봉투가 관을 타고 올라갔다.\n주소를 쓰지 않았는데 기계는 길을 알고 있다.\n\n“다음 게임이 완성되면 여기로 답장을 주세요.”"
        : "봉투가 돌아왔다. 아직 봉해져 있지 않다.\n우편 기계가 조금 더 기다려 달라는 소리를 낸다.";
      break;
    case "postmaster":
      result.track = "postmarked";
      result.text = state.letterSent
        ? "“편지는 받았어요. 아직 도착하지 않은 게임에게 전해 둘게요.”\n\n모니터가 빈 보관함을 가리킨다.\n“제목과 출시일, 새 영상이 정해지면 여기에 적어 둘 거예요.”"
        : "“게임을 찾으시나요? 아직 길을 건너오는 중이에요.”\n\n“이곳은 Telemera의 작은 대기실이에요.\n우리가 만드는 게임의 공개 소식은 보관함에서 볼 수 있어요.”";
      result.gamesLink = true;
      break;
    case "observer":
      result.text = state.eyeAwake
        ? "눈이 당신을 알아본다.\n“밖에 있는 내 눈도 깨워 줬구나.”"
        : "장치는 자고 있다.\n화면 바깥쪽에도 비슷한 눈이 하나 있다.";
      break;
    case "organ":
      result.text =
        state.pressure === 3
          ? "관 세 개가 같은 리듬으로 움직인다.\n“성공적으로 잊었습니다.”\n기계는 무엇을 잊었는지 알려 주지 않는다."
          : "관 속의 기억은 아직 너무 묽다.\n어딘가에 압력을 조절하는 밸브가 있을 것이다.";
      break;
    case "chair":
      state.chairOccupied = !state.chairOccupied;
      result.text = state.chairOccupied
        ? "빈자리에 인사를 건넸다.\n방석이 조금 내려앉고 심박수가 나타났다.\n\n“안녕. 자리는 하나면 충분해.”"
        : "조심스럽게 작별 인사를 했다.\n방석이 다시 부풀었다.\n모니터에는 “휴가 중”이라고 적혀 있다.";
      break;
    case "dream-spool":
      result.text =
        "이 기계는 아직 만들어지지 않은 게임의 꿈을 기록한다.\n지금은 테이프가 비어 있다. 새 소식은 게임 보관함에 도착한다.";
      result.track = "paper";
      result.gamesLink = true;
      break;
    case "sleep-terminal":
      state.monitorAwake = !state.monitorAwake;
      result.text = state.monitorAwake
        ? "베개 대신 놓인 모니터가 깨어났다.\n화면 속 작은 기계가 당신을 따라 움직인다.\n\n“밤 근무 조명은 보라색이었는데.\n여기에도 스위치가 남아 있을까?”"
        : "단말기가 다시 잠들었다.\n팬이 작게 코를 곤다.";
      break;
  }
  return result;
}

export const ROOM_MEMOS = [
  "눈을 빌려주는 대기실\n\n우리 관찰자는 혼자 눈을 뜨지 못합니다.\n바깥쪽의 짝을 찾아 주세요.\n\nCLICK: 다가가기 / WASD: 이동 / E: 조사\n좌우 출입구로 다른 방에 갈 수 있습니다.",
  "인공 꿈 처치실\n\n압력이 세 번째 눈금에 도달하면\n기억은 자기 이름을 잊기 시작합니다.\n\n빈자리에 손님이 앉아 있다고 우기면\n그냥 인사하고 지나가세요.",
  "미발매 기록실\n\n아직 태어나지 않은 게임들도 자리가 필요합니다.\n그 소식은 보관함에 모아 둡니다.\n\n주워 온 종이는 단말기에서 읽을 수 있습니다.",
  "수신인 없는 접수실\n\n도착하지 않은 편지도 접수합니다.\n공기 우편의 봉투는 재사용할 수 있습니다.\n\n접수원에게 다음 게임의 소식을 물어보세요.",
];
