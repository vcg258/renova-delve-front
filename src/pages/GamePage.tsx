import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buyItem, chooseEncounter, getCurrentGame, getShop, leaveShop,
  nextNode, selectReward, useConsumable, useSkill,
} from '../api/game';
import { errorMessage } from '../api/client';
import type {
  BattleMonster, EncounterInfo, ItemType, NodeType, Phase, RewardView, ShopItem, SkillDTO, StatusDTO, TurnResult,
} from '../api/types';
import StatusBar from '../components/StatusBar';
import MonsterCard, { type FxKind } from '../components/MonsterCard';
import TypewriterText from '../components/TypewriterText';
import GuideChat from '../components/GuideChat';
import { consumableIcon, relicIcon, shopIcon, skillIcon } from '../utils/icons';

const NODE_LABEL: Record<NodeType, string> = {
  BATTLE: '⚔ 전투', ELITE: '💀 강적', BOSS: '👑 보스', ENCOUNTER: '❔ 조우',
};

const ADVANCE_MESSAGES = [
  '운명의 실이 엮이는 중...',
  '어둠이 다음 장을 쓰고 있다...',
  '복도 끝에서 무언가 꿈틀거린다...',
  '촛불이 흔들린다...',
];

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
  const [story, setStory] = useState('황폐한 왕궁의 입구. 썩은 공기가 목을 조여온다.');
  const [nodeType, setNodeType] = useState<NodeType>('BATTLE');
  const [monsters, setMonsters] = useState<BattleMonster[]>([]);
  const [encounter, setEncounter] = useState<EncounterInfo | null>(null);
  const [reward, setReward] = useState<RewardView | null>(null);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
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
    } else {
      setMonsters([]);
      setEncounter(null);
    }
    setReward(view.reward);
    setShop(view.shop ?? []);
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

  const advance = () => guard(async () => {
    setAdvancing(true);
    setAdvanceMsg(ADVANCE_MESSAGES[Math.floor(Math.random() * ADVANCE_MESSAGES.length)]);
    setBattleLog([]);
    setSelectedTarget(null);
    setFx(null);
    setDamageMap({});
    const node = await nextNode();
    setStory(node.story ?? '');
    setNodeType(node.nodeType);
    if (node.nodeType === 'ENCOUNTER') {
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
    if (result.result === 'WIN') {
      if (result.cleared) {
        setTimeout(() => navigate('/result'), 1900);
        return;
      }
      // 이펙트 여운 후 보상 화면 전환
      setTimeout(() => {
        setReward(result.reward);
        setPhase('REWARD');
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

  const takeReward = (itemType: ItemType, itemId: number | null) => guard(async () => {
    const newStatus = await selectReward(itemType, itemId);
    setStatus(newStatus);
    setReward(null);
    setShop(await getShop());
    setPhase('SHOP');
  });

  const purchase = (item: ShopItem) => guard(async () => {
    const newStatus = await buyItem(item.itemType, item.itemId);
    setStatus(newStatus);
    setShop((prev) => prev.map((s) =>
      s.itemType === item.itemType && s.itemId === item.itemId ? { ...s, sold: true } : s));
  });

  const exitShop = () => guard(async () => {
    const view = await leaveShop();
    setStatus(view.status);
    setShop([]);
    setBattleLog([]);
    setPhase('EXPLORE');
  });

  if (!status) {
    return (
      <div className="page-center dim">
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <button className="primary" onClick={() => resync().catch(() => navigate('/'))}>다시 시도</button>
          </>
        ) : '왕궁의 어둠 속으로 들어가는 중...'}
      </div>
    );
  }

  const usableConsumables = status.consumableInventoryDTO ?? [];
  const isBossNode = nodeType === 'BOSS';

  return (
    <div className={`page game-page ${isBossNode && phase === 'BATTLE' ? 'boss-mode' : ''}`}>
      {/* 플레이어 피격 섬광 */}
      {playerHitTick > 0 && <div className="player-hit-flash" key={`hit-${playerHitTick}`} />}

      <StatusBar status={status} />

      <div className="node-banner animate-in">
        <span className={`node-label ${isBossNode && phase === 'BATTLE' ? 'boss-label' : ''}`}>
          {phase === 'EXPLORE' ? '🧭 탐험' : phase === 'SHOP' ? '🏪 상점' : phase === 'REWARD' ? '🎁 전리품' : NODE_LABEL[nodeType]}
        </span>
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
                  {consumableIcon(c.consumable.effectType)} {c.consumable.name}
                </button>
              ))}
            </div>
          )}
          <button className="primary big glow" onClick={advance} disabled={busy}>
            더 깊이 전진한다 →
          </button>
          <button className="ghost" onClick={() => navigate('/')}>메뉴로 (진행 저장됨)</button>
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
              ? <span className="dim">대상을 고르고 스킬을 사용하세요. (전체 공격은 대상 선택 불필요)</span>
              : battleLog.map((line, i) => <div key={i} className="log-line">{line}</div>)}
          </div>

          <div className="skill-bar">
            {(status.skillSlotDTO ?? []).map((slot) => (
              <button key={slot.slotId}
                className={`skill-btn ${slot.coolTime > 0 ? 'cooling' : ''}`}
                disabled={busy || slot.coolTime > 0}
                title={slot.skill.description}
                onClick={() => castSkill(slot.slotId)}>
                <span className="skill-icon">{skillIcon(slot.skill)}</span>
                <span className="skill-name">{slot.skill.name}</span>
                <span className="skill-meta">
                  {slot.coolTime > 0 ? `쿨 ${slot.coolTime}턴` : slot.skill.target === 'EnemyAll' ? '전체' : '단일'}
                </span>
              </button>
            ))}
            {usableConsumables.map((c) => (
              <button key={`c-${c.slotId}`} className="skill-btn consumable" disabled={busy}
                title={`${c.consumable.description} (턴 소모)`}
                onClick={() => drinkConsumable(c.slotId)}>
                <span className="skill-icon">{consumableIcon(c.consumable.effectType)}</span>
                <span className="skill-name">{c.consumable.name}</span>
                <span className="skill-meta">아이템</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 인카운터 ===== */}
      {phase === 'ENCOUNTER' && encounter && (
        <div className="encounter-panel animate-in">
          <p className="encounter-text">{encounter.text}</p>
          <div className="choice-list">
            {encounter.choices.map((choice, i) => (
              <button key={i} className="choice-btn" disabled={busy} onClick={() => pickEncounter(i)}>
                <span className="choice-num">{['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][i] ?? i + 1}</span>
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 보상 ===== */}
      {phase === 'REWARD' && (reward ? (
        <div className="reward-panel animate-in">
          <h3>전리품 — 하나만 선택할 수 있다</h3>
          <p className="dim">경험치 +{reward.exp} · 골드 +{reward.gold} 는 이미 획득했다.</p>
          <div className="reward-grid">
            {reward.skills.map((s) => (
              <button key={`s-${s.skillId}`} className="reward-card" disabled={busy}
                title={s.description}
                onClick={() => takeReward('SKILL', s.skillId)}>
                <span className="card-icon">{skillIcon(s)}</span>
                <span className="reward-kind">스킬</span>
                <span className="reward-name">{s.name}</span>
                <span className="reward-desc">{s.description}</span>
              </button>
            ))}
            {reward.relics.map((r) => (
              <button key={`r-${r.relicId}`} className={`reward-card rarity-${r.rarity.toLowerCase()}`} disabled={busy}
                onClick={() => takeReward('RELIC', r.relicId)}>
                <span className="card-icon">{relicIcon(r.name)}</span>
                <span className="reward-kind">유물 · {r.rarity}</span>
                <span className="reward-name">{r.name}</span>
                <span className="reward-desc">{r.effectDesc}</span>
              </button>
            ))}
            {reward.consumables.map((c) => (
              <button key={`c-${c.consumableId}`} className="reward-card" disabled={busy}
                onClick={() => takeReward('CONSUMABLE', c.consumableId)}>
                <span className="card-icon">{consumableIcon(c.effectType)}</span>
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
          <h3>🏪 떠돌이 상인 <span className="dim small">— 보유 골드 {status.stateDTO.gold}</span></h3>
          {shop.length === 0 ? (
            <p className="dim">상인이 짐을 푸는 중...</p>
          ) : (
            <div className="shop-grid">
              {shop.map((item) => (
                <div key={`${item.itemType}-${item.itemId}`} className={`shop-card ${item.sold ? 'sold' : ''}`}>
                  <span className="card-icon">{shopIcon(item.itemType, item.name)}</span>
                  <span className="reward-kind">{shopTypeLabel(item.itemType)}</span>
                  <span className="reward-name">{item.name}</span>
                  <span className="reward-desc">{item.description}</span>
                  <button className="buy-btn"
                    disabled={busy || item.sold || status.stateDTO.gold < item.price}
                    onClick={() => purchase(item)}>
                    {item.sold ? '판매 완료' : `🪙 ${item.price}`}
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="primary" disabled={busy} onClick={exitShop}>상점을 떠나 전진한다 →</button>
        </div>
      )}

      <GuideChat />
    </div>
  );
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
