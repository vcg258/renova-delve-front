import { useCallback, useEffect, useRef, useState } from 'react';
import { resetScene, setScene } from '../utils/scene';
import { useNavigate } from 'react-router-dom';
import {
  abandonGame, breakContract, buyItem, chooseEncounter, chooseRest, discardSkill, fleeBattle, getCurrentGame, getShop, guardTurn,
  leaveShop, nextNode, passTurn, rerollShop, selectReward, useConsumable, useSkill,
} from '../api/game';
import { errorMessage } from '../api/client';
import type {
  BattleMonster, EncounterInfo, ItemType, NodeType, PathChoice, Phase, RestChoice, RewardView, ShopItem, SkillDTO, StatusDTO,
  TurnResult,
} from '../api/types';
import StatusBar from '../components/StatusBar';
import MonsterCard, { type FxKind } from '../components/MonsterCard';
import TypewriterText from '../components/TypewriterText';
import GuideChat from '../components/GuideChat';
import PixelSprite from '../components/PixelSprite';
import Px from '../components/Px';
import HoverTip from '../components/HoverTip';
import { consumableSprite, relicSprite, shopSprite, skillSprite } from '../utils/sprites';
import { allSkillsCooling, dropBlockReason } from '../utils/skills';

const NODE_LABEL: Record<NodeType, { icon: string; label: string }> = {
  BATTLE: { icon: 'sword', label: '전투' }, ELITE: { icon: 'skull', label: '강적' },
  BOSS: { icon: 'crown', label: '보스' }, ENCOUNTER: { icon: 'question', label: '조우' },
  WRAITH: { icon: 'wraith:past', label: '전생의 망령' },
  CONTRACT: { icon: 'scroll', label: '악마의 계약서' },
};

const ADVANCE_MESSAGES = [
  '당신의 선택이 다음 장을 쓰고 있다...',
  '머리 위에서 희미한 종소리가 울린다...',
  '발밑에서 낮은 속삭임이 따라온다...',
  '빛과 그림자가 당신을 지켜본다...',
];

/** 갈림길 선택지 (수치는 서버 PathChoice와 동일. 실제 적용은 서버가 한다) */
const PATHS: { value: PathChoice; icon: string; title: string; desc: string; className: string }[] = [
  { value: 'SAFE', icon: 'door', title: '정면으로 나아간다', desc: '위험도 보상도 그대로', className: '' },
  { value: 'DANGER', icon: 'drop', title: '피 냄새가 짙은 길', desc: '적 HP·공격 +25% · 점수·골드 +50% · 유물 후보 +1', className: 'danger' },
  { value: 'AMBUSH', icon: 'moon', title: '그림자 속 샛길', desc: '기습: 적이 첫 턴에 움직이지 못한다 · 점수·골드 -30%', className: 'ambush' },
];

/** 조우 선택지의 세력별 표시. 결과는 서버만 알고 있으며, 여기서는 세력의 경향만 알려준다 */
const FACTION_STYLE: Record<string, { label: string; icon: string; className: string; hint: string }> = {
  HEAVEN: { label: '천상의 방식', icon: 'wings', className: 'faction-heaven', hint: '질서와 자비. 대체로 안전하지만 무언가를 내려놓아야 할 수 있다.' },
  ABYSS: { label: '마계의 방식', icon: 'flame', className: 'faction-abyss', hint: '욕망과 거래. 크게 얻거나 크게 잃는다.' },
  HUMAN: { label: '인간의 방식', icon: 'sword', className: 'faction-human', hint: '의지와 실리. 누구의 힘도 빌리지 않는다.' },
};

const REST_RESULT: Record<RestChoice, string> = {
  HEAL: '모닥불 곁에서 눈을 붙였다. 상처가 조금 아물었다.',
  TRAIN: '쉬지 않고 검을 갈았다. 손에 쥔 무게가 달라졌다.',
  HEAVEN: '불빛 너머의 흰 빛에 무릎을 꿇었다.',
  ABYSS: '불씨 속의 속삭임에 이름을 내주었다.',
  HUMAN: '누구에게도 빌지 않고 스스로에게 맹세했다.',
};

/** 스킬 슬롯이 가득 찼을 때 고르는 중인 새 스킬 (전리품 또는 상점) */
interface PendingSkill {
  source: 'REWARD' | 'SHOP';
  skillId: number;
  name: string;
  description: string;
  shopItem?: ShopItem;
}

const DEFAULT_SKILL_SLOTS = 8;

/** 스킬 정보 -> 이펙트 종류 결정 */
function resolveFxKind(skill: SkillDTO): FxKind {
  switch (skill.statusEffect) {
    case 1: return 'slash';   // 출혈 계열
    case 2: return 'fire';    // 화상 계열
    case 3: return 'poison';  // 독 계열
    case 4: return 'stun';    // 기절 계열
  }
  if (skill.coefficient >= 1.5) return 'heavy'; // 강타/처형급 한 방
  return 'slash';
}

interface ActiveFx {
  kind: FxKind;
  targets: number[];
  id: number;
}

export default function GamePage() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('EXPLORE');
  const [status, setStatus] = useState<StatusDTO | null>(null);
  const [story, setStory] = useState('레노바 왕궁의 무너진 정문. 하늘에는 정화를 기다리는 흰 빛이, 발밑에는 마계의 숨결이 흐른다.');
  const [nodeType, setNodeType] = useState<NodeType>('BATTLE');
  const [monsters, setMonsters] = useState<BattleMonster[]>([]);
  const [encounter, setEncounter] = useState<EncounterInfo | null>(null);
  const [reward, setReward] = useState<RewardView | null>(null);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [rerollCost, setRerollCost] = useState<number | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  // 이번 노드에 적용된 갈림길 안내 (서버가 내려준다. 새로고침해도 복원된다)
  const [pathNote, setPathNote] = useState<{ path: PathChoice | null; text: string } | null>(null);
  const [contractNote, setContractNote] = useState<string | null>(null);
  // 스킬 슬롯이 가득 찼을 때: 버릴 스킬을 고르는 중인 새 스킬
  const [pendingSkill, setPendingSkill] = useState<PendingSkill | null>(null);
  const [discardSlotId, setDiscardSlotId] = useState<number | null>(null);
  // 스킬 정리 창 / 되돌릴 수 없는 행동(도망, 원정 포기, 스킬 버리기)의 확인 창
  const [managingSkills, setManagingSkills] = useState(false);
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null);

  // 배경 장면: 스테이지 깊이 / 가호 세력 / 보스전 / 모닥불에 따라 달라진다
  useEffect(() => {
    if (!status) return;
    setScene({
      stage: status.stateDTO.currentStage,
      faction: status.alignment?.dominant ?? null,
      boss: nodeType === 'BOSS' && phase === 'BATTLE',
      rest: phase === 'REST',
    });
  }, [status, nodeType, phase]);
  useEffect(() => resetScene, []);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advanceMsg, setAdvanceMsg] = useState(ADVANCE_MESSAGES[0]);

  // ===== 전투 이펙트 상태 =====
  const [fx, setFx] = useState<ActiveFx | null>(null);
  const [damageMap, setDamageMap] = useState<Record<number, number>>({});
  const [playerHitTick, setPlayerHitTick] = useState(0);
  const fxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = useCallback((lines: string[]) => {
    setBattleLog((prev) => [...prev, ...lines]);
    setTimeout(() => logRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
  }, []);

  /** 이펙트 재생 (일정 시간 뒤 자동 소멸) */
  const playFx = useCallback((kind: FxKind, targets: number[]) => {
    if (fxTimerRef.current) clearTimeout(fxTimerRef.current);
    setFx({ kind, targets, id: Date.now() });
    fxTimerRef.current = setTimeout(() => {
      setFx(null);
      setDamageMap({});
    }, 1100);
  }, []);

  /** 몬스터 HP 변화량 -> 플로팅 데미지 */
  const showDamage = useCallback((before: BattleMonster[], after: BattleMonster[]) => {
    const prevHp = new Map(before.map((m) => [m.key, m.currentHp]));
    const map: Record<number, number> = {};
    for (const m of after) {
      const prev = prevHp.get(m.key);
      if (prev != null && prev > m.currentHp) map[m.key] = prev - m.currentHp;
    }
    setDamageMap(map);
  }, []);

  /**
   * 서버 상태와 화면을 강제 동기화. 어떤 오류가 나도 화면을 서버의 진실로 되돌린다.
   */
  const resync = useCallback(async () => {
    const view = await getCurrentGame();
    if (view.phase === 'NONE') { navigate('/'); return; }
    if (view.phase === 'GAMEOVER' || view.phase === 'CLEAR') { navigate('/result'); return; }
    setPhase(view.phase);
    setStatus(view.status);
    if (view.node) {
      setStory(view.node.story ?? '');
      setNodeType(view.node.nodeType);
      setMonsters(view.node.monsters ?? []);
      setEncounter(view.node.encounter);
      setPathNote(view.node.pathNote ? { path: view.node.path ?? null, text: view.node.pathNote } : null);
      setContractNote(view.node.contractNote ?? null);
    } else {
      setMonsters([]);
      setEncounter(null);
      setPathNote(null);
      setContractNote(null);
    }
    setReward(view.reward);
    setShop(view.shop ?? []);
    setRerollCost(view.shopRerollCost);
  }, [navigate]);

  useEffect(() => {
    resync().catch((err) => setError(errorMessage(err)));
  }, [resync]);

  // 안전망: 단계와 데이터가 어긋나면 자동 재동기화 (멈춤 방지)
  useEffect(() => {
    if (phase === 'REWARD' && !reward) resync().catch(() => {});
    if (phase === 'SHOP' && shop.length === 0) {
      getShop().then(setShop).catch(() => resync().catch(() => {}));
    }
  }, [phase, reward, shop.length, resync]);

  const guard = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
      await resync().catch(() => {});
    } finally {
      setBusy(false);
      setAdvancing(false);
    }
  };

  /* ===== 행동들 ===== */

  const advance = (path: PathChoice) => guard(async () => {
    setAdvancing(true);
    setAdvanceMsg(ADVANCE_MESSAGES[Math.floor(Math.random() * ADVANCE_MESSAGES.length)]);
    setBattleLog([]);
    setSelectedTarget(null);
    setFx(null);
    setDamageMap({});
    const node = await nextNode(path);
    setStory(node.story ?? '');
    setNodeType(node.nodeType);
    setPathNote(node.pathNote ? { path: node.path ?? null, text: node.pathNote } : null);
    setContractNote(node.contractNote ?? null);
    if (node.nodeType === 'ENCOUNTER' || node.nodeType === 'CONTRACT') {
      setEncounter(node.encounter);
      setMonsters([]);
      setPhase('ENCOUNTER');
    } else {
      setMonsters(node.monsters ?? []);
      setEncounter(null);
      setPhase('BATTLE');
    }
    const view = await getCurrentGame();
    setStatus(view.status);
  });

  const handleTurnResult = (result: TurnResult, before: BattleMonster[], prevPlayerHp: number) => {
    appendLog(result.log);
    showDamage(before, result.monsters);
    setMonsters(result.monsters);
    setStatus(result.status);

    // 플레이어가 피해를 입었다면 화면 붉은 섬광
    const newHp = result.status.characterDTO?.currentHp ?? prevPlayerHp;
    if (newHp < prevPlayerHp) setPlayerHitTick((t) => t + 1);

    if (result.result === 'LOSE') {
      setTimeout(() => navigate('/result'), 1900);
      return;
    }
    if (result.result === 'FLED') {
      // 달아났다: 보상 없이 갈림길로 돌아간다
      setTimeout(() => {
        setStory(result.log[result.log.length - 1] ?? '');
        setMonsters([]);
        setPathNote(null);
        setSelectedTarget(null);
        setPhase('EXPLORE');
      }, 900);
      return;
    }
    if (result.result === 'WIN') {
      if (result.cleared) {
        setTimeout(() => navigate('/result'), 1900);
        return;
      }
      // 이펙트 여운 후 보상 화면 전환
      // 계약 조항 '전리품은 그의 몫'이면 서버가 보상 없이 바로 상점으로 보낸다
      setTimeout(() => {
        setReward(result.reward);
        setPhase(result.phase === 'SHOP' ? 'SHOP' : 'REWARD');
      }, 700);
    }
  };

  const castSkill = (slotId: number) => guard(async () => {
    const slot = status?.skillSlotDTO.find((s) => s.slotId === slotId);
    const before = monsters;
    const prevHp = status?.characterDTO?.currentHp ?? 0;

    // 이펙트를 즉시 재생 (서버 응답과 무관하게 타격감 우선)
    if (slot) {
      const kind = resolveFxKind(slot.skill);
      const aliveKeys = monsters.filter((m) => m.currentHp > 0).map((m) => m.key);
      const targets = slot.skill.target === 'EnemyAll'
        ? aliveKeys
        : [selectedTarget != null && aliveKeys.includes(selectedTarget) ? selectedTarget : aliveKeys[0]];
      playFx(kind, targets.filter((t): t is number => t != null));
    }

    const targetsParam = selectedTarget != null ? [selectedTarget] : [];
    handleTurnResult(await useSkill(slotId, targetsParam), before, prevHp);
  });

  const takeGuard = () => guard(async () => {
    const before = monsters;
    const prevHp = status?.characterDTO?.currentHp ?? 0;
    handleTurnResult(await guardTurn(), before, prevHp);
  });

  const takeBreath = () => guard(async () => {
    const before = monsters;
    const prevHp = status?.characterDTO?.currentHp ?? 0;
    handleTurnResult(await passTurn(), before, prevHp);
  });

  const runAway = () => guard(async () => {
    const before = monsters;
    const prevHp = status?.characterDTO?.currentHp ?? 0;
    handleTurnResult(await fleeBattle(), before, prevHp);
  });

  const dropSkill = (slotId: number) => guard(async () => {
    setStatus(await discardSkill(slotId));
  });

  const tearContract = () => guard(async () => {
    await breakContract();
    setContractNote(null);
    await resync();
  });

  const giveUpRun = () => guard(async () => {
    await abandonGame();
    navigate('/');
  });

  const drinkConsumable = (inventorySlotId: number) => guard(async () => {
    const inv = status?.consumableInventoryDTO.find((c) => c.slotId === inventorySlotId);
    const before = monsters;
    const prevHp = status?.characterDTO?.currentHp ?? 0;

    // 화염 폭탄류는 전체 화염 이펙트
    if (phase === 'BATTLE' && inv?.consumable.effectType === 'DAMAGE') {
      playFx('fire', monsters.filter((m) => m.currentHp > 0).map((m) => m.key));
    }

    const result = await useConsumable(inventorySlotId);
    if (phase === 'BATTLE') {
      handleTurnResult(result, before, prevHp);
    } else {
      setStatus(result.status);
      setStory(result.log.join(' '));
    }
  });

  const pickEncounter = (index: number) => guard(async () => {
    const outcome = await chooseEncounter(index);
    setStatus(outcome.status);
    setStory(outcome.text);
    setEncounter(null);
    if (outcome.phase === 'GAMEOVER') {
      setTimeout(() => navigate('/result'), 1900);
      return;
    }
    setPhase('EXPLORE');
  });

  const takeReward = (itemType: ItemType, itemId: number | null, replaceSlotId: number | null = null) => guard(async () => {
    const newStatus = await selectReward(itemType, itemId, replaceSlotId);
    setStatus(newStatus);
    setReward(null);
    setPathNote(null);
    // 재고와 재입고 비용을 서버 뷰에서 함께 받는다
    const view = await getCurrentGame();
    setShop(view.shop ?? await getShop());
    setRerollCost(view.shopRerollCost);
    setPhase('SHOP');
  });

  const reroll = () => guard(async () => {
    const view = await rerollShop();
    if (view.status) setStatus(view.status);
    setShop(view.shop ?? []);
    setRerollCost(view.shopRerollCost);
  });

  const purchase = (item: ShopItem, replaceSlotId: number | null = null) => guard(async () => {
    const newStatus = await buyItem(item.itemType, item.itemId, replaceSlotId);
    setStatus(newStatus);
    setShop((prev) => prev.map((s) =>
      s.itemType === item.itemType && s.itemId === item.itemId ? { ...s, sold: true } : s));
  });

  const slotsFull = (status?.skillSlotDTO?.length ?? 0) >= (status?.maxSkillSlots ?? DEFAULT_SKILL_SLOTS);

  /** 스킬을 얻으려 할 때: 빈 슬롯이 있으면 바로, 가득 찼으면 버릴 스킬을 고르는 창을 연다 */
  const acquireSkill = (pending: PendingSkill) => {
    if (slotsFull) {
      setDiscardSlotId(null);
      setPendingSkill(pending);
      return;
    }
    if (pending.source === 'REWARD') takeReward('SKILL', pending.skillId);
    else if (pending.shopItem) purchase(pending.shopItem);
  };

  const confirmSwap = () => {
    if (!pendingSkill || discardSlotId == null) return;
    const pending = pendingSkill;
    setPendingSkill(null);
    if (pending.source === 'REWARD') takeReward('SKILL', pending.skillId, discardSlotId);
    else if (pending.shopItem) purchase(pending.shopItem, discardSlotId);
  };

  const exitShop = () => guard(async () => {
    const view = await leaveShop();
    setStatus(view.status);
    setShop([]);
    setBattleLog([]);
    // 보스를 쓰러뜨린 직후라면 서버가 모닥불(REST) 단계로 보낸다
    setPhase(view.phase);
    if (view.phase === 'REST') {
      setStory('쓰러진 보스 곁에 모닥불을 피웠다. 더 깊은 곳으로 내려가기 전, 단 한 가지만 할 수 있다.');
    }
  });

  const rest = (choice: RestChoice) => guard(async () => {
    const view = await chooseRest(choice);
    if (view.status) setStatus(view.status);
    setStory(REST_RESULT[choice]);
    setPhase(view.phase);
  });

  if (!status) {
    return (
      <div className="page-center dim">
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <button className="primary" onClick={() => resync().catch(() => navigate('/'))}>다시 시도</button>
          </>
        ) : '천상과 마계 사이, 왕궁의 어둠 속으로 들어가는 중...'}
      </div>
    );
  }

  const usableConsumables = status.consumableInventoryDTO ?? [];
  const skillSlots = status.skillSlotDTO ?? [];
  const maxSkillSlots = status.maxSkillSlots ?? DEFAULT_SKILL_SLOTS;
  const isBossNode = nodeType === 'BOSS';
  const banner = phase === 'EXPLORE' ? { icon: 'door', label: '탐험' }
    : phase === 'SHOP' ? { icon: 'pouch', label: '상점' }
    : phase === 'REWARD' ? { icon: 'chest', label: '전리품' }
    : phase === 'REST' ? { icon: 'candle', label: '모닥불' }
    : NODE_LABEL[nodeType];

  return (
    <div className={`page game-page ${isBossNode && phase === 'BATTLE' ? 'boss-mode' : ''}`}>
      {/* 플레이어 피격 섬광 */}
      {playerHitTick > 0 && <div className="player-hit-flash" key={`hit-${playerHitTick}`} />}

      <StatusBar status={status} />

      <div className="node-banner animate-in">
        <span className={`node-label ${isBossNode && phase === 'BATTLE' ? 'boss-label' : ''}`}>
          <Px s={banner.icon} /> {banner.label}
        </span>
        {/* 고른 갈림길이 이번 노드에서 무엇을 바꿨는지 (전투 내내 떠 있다) */}
        {/* 이번 노드에서 계약 조항이 발동했다 */}
        {contractNote && (phase === 'BATTLE' || phase === 'ENCOUNTER' || phase === 'EXPLORE') && (
          <span className="path-note contract"><Px s="scroll" /> {contractNote}</span>
        )}
        {pathNote && (phase === 'BATTLE' || phase === 'ENCOUNTER') && (
          <span className={`path-note ${pathNote.path ? pathNote.path.toLowerCase() : 'ignored'}`}>
            <Px s={pathNote.path === 'DANGER' ? 'drop' : pathNote.path === 'AMBUSH' ? 'moon' : 'question'} /> {pathNote.text}
          </span>
        )}
      </div>

      <div className="story-panel ornate animate-in">
        <div className="corner tl" /><div className="corner tr" /><div className="corner bl" /><div className="corner br" />
        <TypewriterText text={story} />
      </div>

      {error && <p className="error-text">{error}</p>}

      {/* ===== 전진 중 오버레이 ===== */}
      {advancing && (
        <div className="advancing-overlay">
          <div className="rune-spinner" />
          <p>{advanceMsg}</p>
        </div>
      )}

      {/* ===== 탐험 ===== */}
      {phase === 'EXPLORE' && !advancing && (
        <div className="action-panel animate-in">
          {usableConsumables.length > 0 && (
            <div className="consumable-row">
              {usableConsumables.map((c) => (
                <button key={c.slotId} className="chip" disabled={busy}
                  title={c.consumable.description}
                  onClick={() => drinkConsumable(c.slotId)}>
                  <Px s={consumableSprite(c.consumable.effectType, c.consumable.name)} /> {c.consumable.name}
                </button>
              ))}
            </div>
          )}
          <p className="path-heading">갈림길 — 어느 길로 나아갈 것인가</p>
          <div className="path-row">
            {PATHS.map((p) => (
              <button key={p.value} className={`path-card ${p.className}`} disabled={busy}
                onClick={() => advance(p.value)}>
                <span className="path-icon"><Px s={p.icon} size={32} /></span>
                <span className="path-title">{p.title}</span>
                <span className="path-desc">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 전투 ===== */}
      {phase === 'BATTLE' && (
        <div className="battle-panel animate-in">
          <div className="monster-row">
            {monsters.map((m) => (
              <MonsterCard key={m.key} monster={m}
                selected={selectedTarget === m.key}
                onSelect={(key) => setSelectedTarget(key)}
                fxKind={fx && fx.targets.includes(m.key) ? fx.kind : null}
                fxId={fx?.id}
                damage={damageMap[m.key] ?? null} />
            ))}
          </div>

          <div className="battle-log" ref={logRef}>
            {battleLog.length === 0
              ? <span className="dim">적 카드의 예고 행동을 보고 대응하세요. 강공이 예고되면 방어, 방어 태세인 적은 다른 대상을 노리는 것이 유리합니다.</span>
              : battleLog.map((line, i) => <div key={i} className="log-line">{line}</div>)}
          </div>

          <div className="skill-bar">
            {(status.skillSlotDTO ?? []).map((slot) => (
              <button key={slot.slotId}
                className={`skill-btn ${slot.coolTime > 0 ? 'cooling' : ''}`}
                disabled={busy || slot.coolTime > 0}
                title={slot.skill.description}
                onClick={() => castSkill(slot.slotId)}>
                <span className="skill-icon"><PixelSprite sprite={skillSprite(slot.skill)} size={32} /></span>
                <span className="skill-name">{slot.skill.name}</span>
                <span className="skill-meta">
                  {slot.coolTime > 0 ? `쿨 ${slot.coolTime}턴` : slot.skill.target === 'EnemyAll' ? '전체' : '단일'}
                </span>
              </button>
            ))}
            <button className="skill-btn guard" disabled={busy}
              title="공격하지 않는 대신 이번 턴 받는 피해가 60% 감소하고, 모든 스킬 쿨타임이 1턴 줄어듭니다."
              onClick={takeGuard}>
              <span className="skill-icon"><Px s="crest:steel" size={32} /></span>
              <span className="skill-name">방어 태세</span>
              <span className="skill-meta">피해 -60%</span>
            </button>
            {/* 숨 고르기: 쓸 수 있는 스킬이 하나도 없는 턴에만 나타난다 */}
            {allSkillsCooling(skillSlots) && (
              <button className="skill-btn breath" disabled={busy}
                title="쓸 수 있는 스킬이 없을 때만 고를 수 있습니다. 피해는 그대로 받는 대신 모든 스킬 쿨타임이 2턴 줄어듭니다."
                onClick={takeBreath}>
                <span className="skill-icon"><Px s="candle" size={32} /></span>
                <span className="skill-name">숨 고르기</span>
                <span className="skill-meta">쿨 -2턴</span>
              </button>
            )}
            {usableConsumables.map((c) => (
              <button key={`c-${c.slotId}`} className="skill-btn consumable" disabled={busy}
                title={`${c.consumable.description} (턴 소모)`}
                onClick={() => drinkConsumable(c.slotId)}>
                <span className="skill-icon"><Px s={consumableSprite(c.consumable.effectType, c.consumable.name)} size={32} /></span>
                <span className="skill-name">{c.consumable.name}</span>
                <span className="skill-meta">아이템</span>
              </button>
            ))}
          </div>

          <div className="battle-escape">
            {isBossNode ? (
              <span className="dim small">이 구역의 지배자에게서는 달아날 수 없다.</span>
            ) : (
              <button className="ghost" disabled={busy}
                onClick={() => setConfirming({
                  title: '달아날까?',
                  body: '등을 보이는 순간 적이 한 번 공격한다. 전리품은 얻지 못하고 다음 갈림길로 나아간다.',
                  confirmLabel: '달아난다',
                  run: runAway,
                })}>
                <Px s="door" /> 도망치기
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== 인카운터 ===== */}
      {phase === 'ENCOUNTER' && encounter && (
        <div className="encounter-panel animate-in">
          <p className="encounter-text">{encounter.text}</p>
          <div className="choice-list">
            {encounter.choices.map((choice, i) => {
              const faction = FACTION_STYLE[encounter.factions?.[i] ?? ''];
              const button = (
                <button key={i} className={`choice-btn ${faction?.className ?? ''}`} disabled={busy}
                  onClick={() => pickEncounter(i)}>
                  <span className="choice-num">{faction ? <Px s={faction.icon} size={32} /> : i + 1}</span>
                  <span className="choice-body">
                    {faction && <span className="choice-faction">{faction.label}</span>}
                    {choice}
                  </span>
                </button>
              );
              if (!faction) return button;
              // 마우스를 올리면 세력 설명이 말풍선으로 펼쳐진다
              return (
                <HoverTip key={i} className="choice-tip" side="top" focusable={false} tip={
                  <>
                    <strong className="tip-title">{faction.label}</strong>
                    <span className="tip-text">{faction.hint}</span>
                    <span className="tip-note">고르면 이 세력의 성향이 1 오른다.</span>
                  </>
                }>
                  {button}
                </HoverTip>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 보상 ===== */}
      {phase === 'REWARD' && (reward ? (
        <div className="reward-panel animate-in">
          <h3>전리품 — 하나만 선택할 수 있다</h3>
          <p className="dim">경험치 +{reward.exp} · 골드 +{reward.gold} 는 이미 획득했다.</p>
          {slotsFull && reward.skills.length > 0 && (
            <p className="slot-full-note">스킬 슬롯이 가득 찼다 ({skillSlots.length}/{maxSkillSlots}). 스킬을 고르면 버릴 스킬을 정한다.</p>
          )}
          <div className="reward-grid">
            {reward.skills.map((s) => (
              <button key={`s-${s.skillId}`} className="reward-card" disabled={busy}
                title={s.description}
                onClick={() => acquireSkill({ source: 'REWARD', skillId: s.skillId, name: s.name, description: s.description })}>
                <span className="card-icon"><PixelSprite sprite={skillSprite(s)} size={48} /></span>
                <span className="reward-kind">스킬</span>
                <span className="reward-name">{s.name}</span>
                <span className="reward-desc">{s.description}</span>
              </button>
            ))}
            {reward.relics.map((r) => (
              <button key={`r-${r.relicId}`} className={`reward-card rarity-${r.rarity.toLowerCase()}`} disabled={busy}
                onClick={() => takeReward('RELIC', r.relicId)}>
                <span className="card-icon"><Px s={relicSprite(r.name)} size={48} /></span>
                <span className="reward-kind">유물 · {r.rarity}</span>
                <span className="reward-name">{r.name}</span>
                <span className="reward-desc">{r.effectDesc}</span>
              </button>
            ))}
            {reward.consumables.map((c) => (
              <button key={`c-${c.consumableId}`} className="reward-card" disabled={busy}
                onClick={() => takeReward('CONSUMABLE', c.consumableId)}>
                <span className="card-icon"><Px s={consumableSprite(c.effectType, c.name)} size={48} /></span>
                <span className="reward-kind">소모품</span>
                <span className="reward-name">{c.name}</span>
                <span className="reward-desc">{c.description}</span>
              </button>
            ))}
          </div>
          <button className="ghost" disabled={busy} onClick={() => takeReward('SKIP', null)}>
            아무것도 가져가지 않는다
          </button>
        </div>
      ) : (
        <div className="page-center dim">전리품을 헤아리는 중...</div>
      ))}

      {/* ===== 상점 ===== */}
      {phase === 'SHOP' && (
        <div className="shop-panel animate-in">
          <h3><Px s="pouch" /> 떠돌이 상인 <span className="dim small">— 보유 골드 {status.stateDTO.gold}</span></h3>
          {shop.length === 0 ? (
            <p className="dim">상인이 짐을 푸는 중...</p>
          ) : (
            <div className="shop-grid">
              {shop.map((item) => (
                <div key={`${item.itemType}-${item.itemId}`} className={`shop-card ${item.sold ? 'sold' : ''}`}>
                  <span className="card-icon"><Px s={shopSprite(item.itemType, item.name)} size={48} /></span>
                  <span className="reward-kind">{shopTypeLabel(item.itemType)}</span>
                  <span className="reward-name">{item.name}</span>
                  <span className="reward-desc">{item.description}</span>
                  <button className="buy-btn"
                    disabled={busy || item.sold || status.stateDTO.gold < item.price}
                    onClick={() => item.itemType === 'SKILL'
                      ? acquireSkill({ source: 'SHOP', skillId: item.itemId, name: item.name, description: item.description, shopItem: item })
                      : purchase(item)}>
                    {item.sold ? '판매 완료' : <><Px s="coin" /> {item.price}</>}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="shop-actions">
            {rerollCost != null && (
              <button className="ghost" disabled={busy || status.stateDTO.gold < rerollCost} onClick={reroll}
                title="진열품을 새로 뽑습니다. 같은 상점에서 재입고할수록 비용이 오릅니다.">
                <Px s="spin" /> 진열품 교체 <Px s="coin" /> {rerollCost}
              </button>
            )}
            <button className="primary" disabled={busy} onClick={exitShop}>상점을 떠나 전진한다 →</button>
          </div>
        </div>
      )}

      {/* ===== 모닥불 (보스 처치 후) ===== */}
      {phase === 'REST' && (
        <div className="rest-panel animate-in">
          <p className="path-heading">모닥불 — 하나만 고를 수 있다</p>
          <div className="path-row">
            <button className="path-card" disabled={busy} onClick={() => rest('HEAL')}>
              <span className="path-icon"><Px s="heart" size={32} /></span>
              <span className="path-title">눈을 붙인다</span>
              <span className="path-desc">최대 HP의 35% 회복</span>
            </button>
            <button className="path-card" disabled={busy} onClick={() => rest('TRAIN')}>
              <span className="path-icon"><Px s="sword" size={32} /></span>
              <span className="path-title">검을 간다</span>
              <span className="path-desc">공격력 +3 · 방어력 +1 (영구)</span>
            </button>
            <div className="path-card vow-card">
              <span className="path-icon"><Px s="candle" size={32} /></span>
              <span className="path-title">서원한다</span>
              <span className="path-desc">한 세력의 성향 +1</span>
              <span className="vow-row">
                <button className="mini faction-heaven" disabled={busy} onClick={() => rest('HEAVEN')}><Px s="wings" /> 천상</button>
                <button className="mini faction-human" disabled={busy} onClick={() => rest('HUMAN')}><Px s="sword" /> 인간</button>
                <button className="mini faction-abyss" disabled={busy} onClick={() => rest('ABYSS')}><Px s="flame" /> 마계</button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===== 어느 단계에서나 쓰는 원정 메뉴 ===== */}
      {!advancing && (
        <div className="run-menu">
          <button className="ghost" onClick={() => navigate('/')}>메뉴로 (진행 저장됨)</button>
          <button className="ghost" disabled={busy || phase === 'BATTLE' || phase === 'ENCOUNTER'}
            title={phase === 'BATTLE' || phase === 'ENCOUNTER' ? '전투나 조우 중에는 스킬을 정리할 수 없다' : undefined}
            onClick={() => setManagingSkills(true)}>
            <Px s="scroll" /> 스킬 정리
          </button>
          {status?.contract && phase === 'EXPLORE' && (
            <button className="ghost" disabled={busy || !status.contract.breakable}
              title={status.contract.breakable ? undefined
                : `천상 성향 3 이상, 골드 ${status.contract.breakCost}이 있어야 파기할 수 있다`}
              onClick={() => setConfirming({
                title: '계약을 불사를까?',
                body: `천상의 빛에 골드 ${status.contract!.breakCost}을 바치고 계약서를 태운다. 받은 혜택은 그대로 남고, 숨겨진 조항은 사라진다.`,
                confirmLabel: '계약을 불사른다',
                run: tearContract,
              })}>
              <Px s="candle" /> 계약 파기
            </button>
          )}
          <button className="ghost danger" disabled={busy}
            onClick={() => setConfirming({
              title: '원정을 포기할까?',
              body: '이번 원정은 여기서 끝난다. 지금까지 얻은 점수는 랭킹에 오르지 않고, 되돌릴 수 없다.',
              confirmLabel: '원정을 포기한다',
              run: giveUpRun,
            })}>
            <Px s="skull" /> 원정 포기
          </button>
        </div>
      )}

      {/* ===== 스킬 정리: 원하는 스킬을 버린다 ===== */}
      {managingSkills && (
        <div className="swap-overlay" role="dialog" aria-modal="true" aria-label="스킬 정리">
          <div className="swap-panel">
            <h3>스킬 정리 ({skillSlots.length}/{maxSkillSlots})</h3>
            <p className="path-heading">버린 스킬은 돌아오지 않는다</p>
            <div className="swap-grid">
              {skillSlots.map((slot) => {
                const blocked = dropBlockReason(skillSlots, slot, false);
                return (
                  <div key={slot.slotId} className={`swap-card static ${blocked ? 'blocked' : ''}`}>
                    <span className="skill-icon"><PixelSprite sprite={skillSprite(slot.skill)} size={32} /></span>
                    <span className="reward-name">{slot.skill.name}</span>
                    <span className="reward-desc">{slot.skill.description}</span>
                    <span className="skill-meta">
                      {slot.skill.target === 'EnemyAll' ? '전체' : '단일'} · 쿨 {slot.skill.cooldown}턴
                    </span>
                    {blocked
                      ? <span className="swap-blocked">{blocked}</span>
                      : (
                        <button className="mini danger" disabled={busy}
                          onClick={() => setConfirming({
                            title: `「${slot.skill.name}」을(를) 버릴까?`,
                            body: '버린 스킬은 돌아오지 않는다.',
                            confirmLabel: '버린다',
                            run: () => dropSkill(slot.slotId),
                          })}>
                          버리기
                        </button>
                      )}
                  </div>
                );
              })}
            </div>
            <div className="shop-actions">
              <button className="primary" onClick={() => setManagingSkills(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 스킬 교체: 슬롯이 가득 찼을 때 버릴 스킬 고르기 ===== */}
      {pendingSkill && (
        <div className="swap-overlay" role="dialog" aria-modal="true" aria-label="스킬 교체">
          <div className="swap-panel">
            <h3>스킬 슬롯이 가득 찼다 ({skillSlots.length}/{maxSkillSlots})</h3>
            <div className="swap-new">
              <span className="reward-kind">새로 배울 스킬{pendingSkill.shopItem ? ` · 골드 ${pendingSkill.shopItem.price}` : ''}</span>
              <span className="reward-name">{pendingSkill.name}</span>
              <span className="reward-desc">{pendingSkill.description}</span>
            </div>
            <p className="path-heading">버릴 스킬을 고른다 — 버린 스킬은 돌아오지 않는다</p>
            <div className="swap-grid">
              {skillSlots.map((slot) => (
                <button key={slot.slotId}
                  className={`swap-card ${discardSlotId === slot.slotId ? 'selected' : ''}`}
                  aria-pressed={discardSlotId === slot.slotId}
                  disabled={dropBlockReason(skillSlots, slot, true) != null}
                  title={dropBlockReason(skillSlots, slot, true) ?? undefined}
                  onClick={() => setDiscardSlotId(slot.slotId)}>
                  <span className="skill-icon"><PixelSprite sprite={skillSprite(slot.skill)} size={32} /></span>
                  <span className="reward-name">{slot.skill.name}</span>
                  <span className="reward-desc">{slot.skill.description}</span>
                  <span className="skill-meta">
                    {slot.skill.target === 'EnemyAll' ? '전체' : '단일'} · 쿨 {slot.skill.cooldown}턴
                  </span>
                </button>
              ))}
            </div>
            <div className="shop-actions">
              <button className="ghost" onClick={() => setPendingSkill(null)}>그만둔다</button>
              <button className="primary" disabled={busy || discardSlotId == null} onClick={confirmSwap}>
                {discardSlotId == null ? '버릴 스킬을 고르세요' : '이 스킬을 버리고 배운다'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 되돌릴 수 없는 행동의 확인 창 (스킬 정리 창 위에 뜬다) ===== */}
      {confirming && (
        <div className="swap-overlay confirm" role="alertdialog" aria-modal="true" aria-label={confirming.title}>
          <div className="swap-panel narrow">
            <h3>{confirming.title}</h3>
            <p className="confirm-body">{confirming.body}</p>
            <div className="shop-actions">
              <button className="ghost" autoFocus onClick={() => setConfirming(null)}>그만둔다</button>
              <button className="primary danger" disabled={busy}
                onClick={() => { const run = confirming.run; setConfirming(null); run(); }}>
                {confirming.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <GuideChat phase={phase} />
    </div>
  );
}

/** 확인 창에 띄울 내용과, 확인했을 때 실행할 행동 */
interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  run: () => void;
}

function shopTypeLabel(type: string): string {
  switch (type) {
    case 'WEAPON': return '무기';
    case 'ARMOR': return '갑옷';
    case 'HELMET': return '투구';
    case 'SKILL': return '스킬';
    case 'RELIC': return '유물';
    case 'CONSUMABLE': return '소모품';
    default: return type;
  }
}
