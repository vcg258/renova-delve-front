import { useMemo } from 'react';
import { useScene } from '../utils/scene';

/**
 * 배경: 도트로 그린 세 겹의 세계.
 *
 *   위    천상   — 광륜과 내려오는 빛기둥, 떨어지는 깃털
 *   가운데 인간  — 지평선 위의 레노바 왕궁
 *   아래   마계  — 땅 밑에 거꾸로 비친 붉은 왕궁과 마계의 문, 솟아오르는 불씨
 *
 * 160x100 격자에 사각형만 찍어 그린 뒤 화면 전체로 늘린다(crispEdges라 확대해도 도트가 유지된다).
 * 이미지 파일을 쓰지 않으므로 색과 구도를 코드에서 바로 바꿀 수 있다.
 *
 * 장면은 원정 진행에 따라 달라진다 (utils/scene.ts).
 *   - 스테이지가 깊어질수록: 하늘이 붉게 가라앉고, 광륜이 가려지고(식), 왕궁의 창불이 꺼지고,
 *     땅이 갈라지며 마계의 문이 커진다
 *   - 가호가 붙은 세력: 천상이면 빛기둥과 깃털이, 마계면 문과 불씨가, 인간이면 창불과 횃불이 늘어난다
 *   - 보스전에는 마계의 문이 맥동하고, 모닥불에서는 성문 앞에 불이 켜진다
 */

const W = 160;
const H = 100;
const HORIZON = 58;

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 지평선 위의 왕궁 (실루엣). 좌우 대칭이라 왼쪽 절반만 정의하고 반사한다 */
const CASTLE_LEFT: Block[] = [
  { x: 72, y: 40, w: 8, h: 18 },   // 본성
  { x: 74, y: 37, w: 6, h: 3 },    // 본성 지붕 1단
  { x: 76, y: 34, w: 4, h: 3 },    // 2단
  { x: 78, y: 30, w: 2, h: 4 },    // 첨탑
  { x: 61, y: 45, w: 7, h: 13 },   // 측탑
  { x: 62, y: 42, w: 5, h: 3 },
  { x: 64, y: 39, w: 1, h: 3 },
  { x: 48, y: 52, w: 32, h: 6 },   // 성벽
  { x: 48, y: 50, w: 2, h: 2 }, { x: 52, y: 50, w: 2, h: 2 }, { x: 56, y: 50, w: 2, h: 2 },  // 총안
  { x: 68, y: 50, w: 2, h: 2 },
  { x: 40, y: 54, w: 8, h: 4 },    // 바깥 성벽
  { x: 40, y: 52, w: 2, h: 2 }, { x: 44, y: 52, w: 2, h: 2 },
];

const WINDOWS_LEFT: Block[] = [
  { x: 75, y: 44, w: 1, h: 2 }, { x: 78, y: 44, w: 1, h: 2 },
  { x: 75, y: 49, w: 1, h: 2 }, { x: 64, y: 48, w: 1, h: 2 },
];

/** 한 스테이지의 배경 설정. 스테이지를 늘리거나 줄일 때는 STAGES에 항목 하나만 넣고 빼면 된다 */
interface StageLook {
  /** 하늘 색 (아래 -> 위 4단) */
  sky: [string, string, string, string];
  /** 빛기둥과 후광의 세기 (1 = 온전함) */
  light: number;
  /** 불이 켜진 왕궁 창의 수 (최대 8) */
  litWindows: number;
  /** 마계의 문이 커지는 정도 (격자 칸) */
  gateGrowth: number;
  /** 광륜을 가리는 그림자의 x 오프셋. null이면 식이 없고, 0이면 완전히 가려 붉은 테두리만 남는다 */
  eclipse: number | null;
  /** 지평선에서 올라오는 균열: 0 없음 / 1 왕궁 발치 / 2 왕궁 전체 */
  fissures: 0 | 1 | 2;
  feathers: number;
  embers: number;
}

/** 0은 메뉴 화면, 1~5는 원정 중인 스테이지. 깊어질수록 천상이 멀어지고 마계가 가까워진다 */
const STAGES: StageLook[] = [
  { sky: ['#12101f', '#161327', '#1b1730', '#221d3a'], light: 1, litWindows: 8, gateGrowth: 0, eclipse: null, fissures: 0, feathers: 14, embers: 18 },
  { sky: ['#12101f', '#161327', '#1b1730', '#221d3a'], light: 1, litWindows: 8, gateGrowth: 0, eclipse: null, fissures: 0, feathers: 14, embers: 18 },
  { sky: ['#0e1020', '#11152a', '#141a34', '#19203f'], light: 0.8, litWindows: 6, gateGrowth: 1, eclipse: null, fissures: 0, feathers: 11, embers: 22 },
  { sky: ['#120e1e', '#171126', '#1e142e', '#281938'], light: 0.55, litWindows: 4, gateGrowth: 3, eclipse: 12, fissures: 1, feathers: 8, embers: 26 },
  { sky: ['#170c18', '#1e0e1e', '#281124', '#33142a'], light: 0.35, litWindows: 2, gateGrowth: 4, eclipse: 6, fissures: 2, feathers: 5, embers: 30 },
  { sky: ['#140810', '#1c0a14', '#260c18', '#320f1c'], light: 0.15, litWindows: 0, gateGrowth: 6, eclipse: 0, fissures: 2, feathers: 3, embers: 34 },
];

/** 창불이 좌우로 번갈아 꺼지도록 한 순서 */
const WINDOW_ORDER = [0, 4, 1, 5, 2, 6, 3, 7];

/** 땅의 균열: 3스테이지부터 지평선에서 왕궁으로 붉은 금이 올라온다 */
const FISSURES: Block[] = [
  { x: 58, y: 51, w: 1, h: 7 }, { x: 59, y: 48, w: 1, h: 4 },
  { x: 101, y: 52, w: 1, h: 6 }, { x: 100, y: 49, w: 1, h: 4 },
];
const DEEP_FISSURES: Block[] = [
  { x: 30, y: 54, w: 1, h: 4 }, { x: 31, y: 52, w: 1, h: 3 },
  { x: 128, y: 53, w: 1, h: 5 }, { x: 127, y: 51, w: 1, h: 3 },
  { x: 71, y: 44, w: 1, h: 14 }, { x: 88, y: 46, w: 1, h: 12 },
];

/** 인간의 가호: 성벽과 측탑 위의 횃불 */
const TORCHES: Block[] = [
  { x: 50, y: 48, w: 1, h: 2 }, { x: 109, y: 48, w: 1, h: 2 },
  { x: 42, y: 50, w: 1, h: 2 }, { x: 117, y: 50, w: 1, h: 2 },
  { x: 64, y: 37, w: 1, h: 2 }, { x: 95, y: 37, w: 1, h: 2 },
];

function mirrorX(blocks: Block[]): Block[] {
  return blocks.concat(blocks.map((b) => ({ ...b, x: W - b.x - b.w })));
}

/** 지평선을 축으로 위아래를 뒤집는다 (마계에 비친 왕궁) */
function flipY(blocks: Block[]): Block[] {
  return blocks.map((b) => ({ ...b, y: 2 * (HORIZON + 1) - b.y - b.h }));
}

/** 도트 원: 줄마다 폭이 다른 가로 막대를 쌓아 만든다 */
function disc(cx: number, cy: number, r: number): Block[] {
  const rows: Block[] = [];
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    if (half > 0) rows.push({ x: cx - half, y: cy + dy, w: half * 2, h: 1 });
  }
  return rows;
}

function Blocks({ blocks, fill, opacity }: { blocks: Block[]; fill: string; opacity?: number }) {
  return (
    <g fill={fill} opacity={opacity}>
      {blocks.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} />)}
    </g>
  );
}

export default function AtmosphereFX() {
  const scene = useScene();
  const look = STAGES[Math.max(0, Math.min(STAGES.length - 1, scene.stage))];
  const heaven = scene.faction === 'HEAVEN';
  const abyss = scene.faction === 'ABYSS';
  const human = scene.faction === 'HUMAN';

  const castle = useMemo(() => mirrorX(CASTLE_LEFT), []);
  const allWindows = useMemo(() => mirrorX(WINDOWS_LEFT), []);
  const litCount = human ? allWindows.length : look.litWindows;
  const windows = useMemo(
    () => WINDOW_ORDER.slice(0, litCount).map((i) => allWindows[i]),
    [allWindows, litCount],
  );

  const sky = look.sky;
  const light = look.light * (heaven ? 1.8 : 1);
  const grow = look.gateGrowth + (abyss ? 2 : 0);
  const eclipse = heaven ? null : look.eclipse;
  const featherCount = Math.min(20, look.feathers + (heaven ? 6 : 0));
  const emberCount = Math.min(40, look.embers + (abyss ? 6 : 0));

  // 천상에서 떨어지는 깃털 / 마계에서 솟는 불씨 (위치만 무작위, 움직임은 CSS steps)
  const feathers = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({
      id: i, left: 4 + Math.random() * 92, duration: 16 + Math.random() * 16, delay: -Math.random() * 30,
      size: Math.random() < 0.3 ? 4 : 2,
    })),
    [],
  );
  const embers = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      id: i, left: 6 + Math.random() * 88, duration: 9 + Math.random() * 12, delay: -Math.random() * 20,
      size: Math.random() < 0.35 ? 4 : 2,
    })),
    [],
  );

  return (
    <div className="atmosphere" aria-hidden="true">
      <svg className="world" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
        {/* ---------- 천상: 위로 갈수록 밝아지는 계단식 하늘 ---------- */}
        <rect x="0" y="0" width={W} height={HORIZON} fill={sky[0]} />
        <rect x="0" y="0" width={W} height="40" fill={sky[1]} />
        <rect x="0" y="0" width={W} height="26" fill={sky[2]} />
        <rect x="0" y="0" width={W} height="13" fill={sky[3]} />

        {/* 광륜의 후광 (계단식으로 번지는 빛) */}
        <g opacity={Math.min(1, 0.35 + light * 0.65)}>
          <Blocks blocks={disc(80, 4, 34)} fill="#262042" />
          <Blocks blocks={disc(80, 4, 25)} fill="#322a4e" />
          <Blocks blocks={disc(80, 4, 17)} fill="#473c5e" />
        </g>
        {/* 광륜: 금빛 고리 */}
        <Blocks blocks={disc(80, 4, 11)} fill="#f2e6c2" />
        <Blocks blocks={disc(80, 4, 9)} fill="#473c5e" />
        <Blocks blocks={disc(80, 4, 4)} fill="#fff6dc" />
        {/* 식: 깊이 내려갈수록 그림자가 광륜을 덮는다. 마지막 스테이지에는 붉은 테두리만 남는다 */}
        {eclipse != null && (
          <>
            {eclipse === 0 && <Blocks blocks={disc(80, 4, 12)} fill="#e0483c" />}
            <Blocks blocks={disc(80 + eclipse, 4, eclipse === 0 ? 11 : 10)} fill="#0a0812" />
          </>
        )}

        {/* 왕궁으로 내려오는 빛기둥 */}
        <g fill="#f2e6c2" opacity={Math.min(1, light)}>
          <rect x="79" y="15" width="2" height="15" opacity="0.5" />
          <rect x="66" y="13" width="1" height="30" opacity="0.14" />
          <rect x="93" y="13" width="1" height="30" opacity="0.14" />
          <rect x="52" y="10" width="1" height="42" opacity="0.08" />
          <rect x="107" y="10" width="1" height="42" opacity="0.08" />
          <rect x="36" y="6" width="1" height="50" opacity="0.05" />
          <rect x="123" y="6" width="1" height="50" opacity="0.05" />
          {heaven && (
            <>
              <rect x="59" y="12" width="2" height="36" opacity="0.22" />
              <rect x="99" y="12" width="2" height="36" opacity="0.22" />
              <rect x="20" y="4" width="1" height="52" opacity="0.1" />
              <rect x="139" y="4" width="1" height="52" opacity="0.1" />
            </>
          )}
        </g>

        {/* 별 */}
        <g fill="#cfc6e6" className="world-stars">
          <rect x="14" y="9" width="1" height="1" /><rect x="29" y="21" width="1" height="1" />
          <rect x="41" y="5" width="1" height="1" /><rect x="120" y="8" width="1" height="1" />
          <rect x="136" y="19" width="1" height="1" /><rect x="149" y="6" width="1" height="1" />
          <rect x="8" y="31" width="1" height="1" /><rect x="152" y="33" width="1" height="1" />
          <rect x="22" y="40" width="1" height="1" /><rect x="131" y="42" width="1" height="1" />
        </g>

        {/* ---------- 인간: 지평선 위의 왕궁 ---------- */}
        <Blocks blocks={castle} fill="#0a0812" />
        <Blocks blocks={windows} fill="#e8c860" opacity={0.85} />
        <rect x="79" y="53" width="2" height="5" fill="#2a2440" />
        {human && <Blocks blocks={TORCHES} fill="#ffb347" />}
        {look.fissures >= 1 && <Blocks blocks={FISSURES} fill="#e0483c" opacity={0.8} />}
        {look.fissures >= 2 && <Blocks blocks={DEEP_FISSURES} fill="#e0483c" opacity={0.7} />}
        {scene.rest && (
          <g className="campfire">
            <rect x="78" y="56" width="4" height="2" fill="#ff7a4a" />
            <rect x="79" y="54" width="2" height="2" fill="#ffb347" />
            <rect x="79" y="53" width="1" height="1" fill="#fff6dc" />
          </g>
        )}

        {/* ---------- 마계: 땅 밑, 거꾸로 비친 붉은 왕궁 ---------- */}
        <rect x="0" y={HORIZON} width={W} height={H - HORIZON} fill="#160a10" />
        <rect x="0" y="72" width={W} height="28" fill="#1e0b10" />
        <rect x="0" y="86" width={W} height="14" fill="#290d0f" />

        <Blocks blocks={disc(80, 100, 36 + grow * 2)} fill="#2e0e10" />
        <Blocks blocks={disc(80, 100, 26 + grow * 2)} fill="#451311" />
        <Blocks blocks={disc(80, 100, 16 + grow * 2)} fill="#6a1b14" />

        <Blocks blocks={flipY(castle)} fill="#4a1216" />
        <Blocks blocks={flipY(allWindows)} fill="#ff7a4a" opacity={0.9} />

        {/* 마계의 문: 붉은 고리 */}
        <g className={scene.boss ? 'gate-pulse' : undefined}>
          <Blocks blocks={disc(80, 97, 8 + grow)} fill="#e0483c" />
          <Blocks blocks={disc(80, 97, 6 + grow)} fill="#1a0608" />
          <Blocks blocks={disc(80, 97, 2 + Math.floor(grow / 2))} fill="#ff9a3c" />
        </g>

        {/* 지면: 두 세계를 가르는 얇은 선 */}
        <rect x="0" y={HORIZON} width={W} height="2" fill="#07060c" />
        <rect x="0" y={HORIZON + 2} width={W} height="1" fill={look.fissures >= 2 || abyss ? '#8a2018' : '#3a1014'} />
      </svg>

      {feathers.slice(0, featherCount).map((f) => (
        <span key={`f-${f.id}`} className="pixel-fall"
          style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }} />
      ))}
      {embers.slice(0, emberCount).map((e) => (
        <span key={`e-${e.id}`} className="pixel-rise"
          style={{ left: `${e.left}%`, width: e.size, height: e.size, animationDuration: `${e.duration}s`, animationDelay: `${e.delay}s` }} />
      ))}

      {/* 본문 가독성을 위한 어둠막 */}
      <div className="world-shade" />
    </div>
  );
}
