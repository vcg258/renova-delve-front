import { useState } from 'react';
import type { Alignment, Faction, FactionInfo, StatusDTO } from '../api/types';
import Px from './Px';
import HoverTip from './HoverTip';
import { relicSprite } from '../utils/sprites';
import { buildTraits, foldTraits, traitKindLabel } from '../utils/traits';

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '쉬움', NORMAL: '보통', HARD: '어려움', HELL: '지옥',
};

const FACTION_VIEW: { code: Faction; label: string; icon: string; className: string }[] = [
  { code: 'HEAVEN', label: '천상', icon: 'wings', className: 'heaven' },
  { code: 'HUMAN', label: '인간', icon: 'sword', className: 'human' },
  { code: 'ABYSS', label: '마계', icon: 'flame', className: 'abyss' },
];

/** 칩이 이보다 많으면 접는다 */
const TRAIT_LIMIT = 6;

function scoreOf(alignment: Alignment, faction: Faction): number {
  return faction === 'HEAVEN' ? alignment.heaven : faction === 'ABYSS' ? alignment.abyss : alignment.human;
}

/** 세력 말풍선: 조우에서의 경향과 단계별 가호. 수치는 서버가 내려준 것을 그대로 쓴다 */
function FactionTip({ info, score, activeTier }: { info: FactionInfo | undefined; score: number; activeTier: number }) {
  if (!info) return <span className="tip-text">조우에서 이 세력의 방식을 택하면 점수가 쌓인다.</span>;
  return (
    <>
      <strong className="tip-title">{info.label} · 현재 {score}</strong>
      <span className="tip-text">{info.tendency}</span>
      <span className="tip-list">
        {info.tiers.map((t) => (
          <span key={t.tier} className={`tip-tier ${activeTier === t.tier ? 'active' : ''} ${score >= t.requiredScore ? 'reached' : ''}`}>
            <b>{t.requiredScore}</b> {t.description}
          </span>
        ))}
      </span>
      <span className="tip-note">가호는 한 세력이 단독 1위일 때만 붙는다. 동률이면 어느 가호도 없다.</span>
    </>
  );
}

/**
 * 게임 상단 상태 바: HP / 레벨 / 골드 / 점수 / 진행도 + 성향 + 서약·조합 시너지
 */
export default function StatusBar({ status }: { status: StatusDTO }) {
  const [expanded, setExpanded] = useState(false);
  const c = status.characterDTO;
  const s = status.stateDTO;
  const hpPercent = c ? Math.max(0, Math.min(100, (c.currentHp / c.maxHp) * 100)) : 0;
  const expNeed = c ? c.level * 100 : 100;
  const expPercent = c ? Math.max(0, Math.min(100, (c.currentExp / expNeed) * 100)) : 0;
  const relics = status.relicInventoryDTO ?? [];
  const alignment = status.alignment;
  const traits = buildTraits(status.pacts, status.relicSynergies, status.skillSynergies);
  const { visible, hidden } = foldTraits(traits, TRAIT_LIMIT, expanded);
  const blessingName = alignment?.blessing?.split(' — ')[0];
  const blessingDetail = alignment?.blessing?.split(' — ').slice(1).join(' — ');

  return (
    <>
      <div className="status-bar">
        <div className="status-left">
          <span className="badge">{DIFFICULTY_LABEL[s.difficulty] ?? s.difficulty}</span>
          <span className="stage-info">스테이지 {s.currentStage}</span>
          {/* 이번 스테이지의 진행도: 지나온 노드 / 현재 / 남은 노드, 마지막 칸은 보스 */}
          <span className="node-track" title={`노드 ${s.currentNodeId ?? 0} / 10 (10번째는 보스)`}>
            {Array.from({ length: 10 }, (_, i) => {
              const node = s.currentNodeId ?? 0;
              const state = i + 1 < node ? 'done' : i + 1 === node ? 'now' : '';
              return <i key={i} className={`pip ${state} ${i === 9 ? 'boss' : ''}`} />;
            })}
          </span>
          {s.hasPhoenix && <span className="badge phoenix" title="사망 시 1회 부활"><Px s="feather" /> 부활</span>}
        </div>

        {c && (
          <div className="status-mid">
            <div className="hp-wrap">
              <div className="bar-label">HP {c.currentHp}/{c.maxHp}</div>
              <div className="bar"><div className="bar-fill hp" style={{ width: `${hpPercent}%` }} /></div>
              <div className="bar exp-bar"><div className="bar-fill exp" style={{ width: `${expPercent}%` }} /></div>
            </div>
            <span className="stat">Lv.{c.level}</span>
            <span className="stat"><Px s="sword" /> {c.attack}</span>
            <span className="stat"><Px s="crest:steel" /> {c.defense}</span>
          </div>
        )}

        <div className="status-right">
          {relics.length > 0 && (
            <HoverTip align="right" className="relic-tray" tip={
              <>
                <strong className="tip-title">보유 유물 {relics.length}</strong>
                <span className="tip-list">
                  {relics.map((r) => (
                    <span key={r.slotId} className="tip-relic">
                      <Px s={relicSprite(r.relic.name)} /> <b>{r.relic.name}</b> {r.relic.effectDesc}
                    </span>
                  ))}
                </span>
              </>
            }>
              {relics.slice(0, 5).map((r) => (
                <span key={r.slotId} className="relic-dot"><Px s={relicSprite(r.relic.name)} /></span>
              ))}
              {relics.length > 5 && <span className="dim small">+{relics.length - 5}</span>}
            </HoverTip>
          )}
          <span className="stat gold"><Px s="coin" /> {s.gold}</span>
          <span className="stat score"><Px s="star" /> {s.score}</span>
        </div>
      </div>

      {/* 성향, 서약, 조합 시너지를 한 판에 모은다. 줄마다 따로 여백을 잡으면 칩이 늘 때 서로 겹친다 */}
      {(alignment || traits.length > 0 || status.contract) && (
        <div className="trait-panel">
          {/* 성향: 조우에서 어느 세력의 방식을 택해 왔는가. 마우스를 올리면 세력 설명이 펼쳐진다 */}
          {alignment && (
            <div className="trait-row">
              {FACTION_VIEW.map((f) => (
                <HoverTip key={f.code}
                  className={`alignment-pip ${f.className} ${alignment.dominant === f.code ? 'dominant' : ''}`}
                  tip={<FactionTip info={alignment.factions?.find((i) => i.code === f.code)}
                    score={scoreOf(alignment, f.code)}
                    activeTier={alignment.dominant === f.code ? alignment.tier ?? 0 : 0} />}>
                  <Px s={f.icon} /> {f.label} {scoreOf(alignment, f.code)}
                </HoverTip>
              ))}
              {alignment.blessing && (
                <HoverTip className={`blessing-chip ${alignment.dominant?.toLowerCase() ?? ''}`} tip={
                  <>
                    <strong className="tip-title">{blessingName}</strong>
                    <span className="tip-text">{blessingDetail}</span>
                    <span className="tip-note">
                      {alignment.nextTierAt != null
                        ? `성향 ${alignment.nextTierAt}에 닿으면 다음 단계로 오른다.`
                        : '가장 높은 단계다.'}
                    </span>
                  </>
                }>
                  {blessingName}
                </HoverTip>
              )}
            </div>
          )}

          {/* 악마의 계약: 조항은 모르고 작은 글씨만 안다 */}
          {status.contract && (
            <div className="trait-row">
              <HoverTip className="trait-chip contract" tip={
                <>
                  <strong className="tip-title">악마의 계약 — {status.contract.boon}</strong>
                  <span className="tip-text">작은 글씨: "{status.contract.hint}"</span>
                  <span className="tip-note">
                    {status.contract.breakable
                      ? `탐험 중에 골드 ${status.contract.breakCost}을 바쳐 파기할 수 있다.`
                      : `천상 성향 3 이상이면 골드 ${status.contract.breakCost}을 바쳐 파기할 수 있다.`}
                  </span>
                </>
              }>
                <Px s="scroll" /> 계약: {status.contract.boon}
              </HoverTip>
            </div>
          )}

          {/* 서약 / 유물 조합 / 스킬 조합: 이름만 칩으로, 설명은 말풍선으로. 많으면 접는다 */}
          {traits.length > 0 && (
            <div className="trait-row">
              {visible.map((t) => (
                <HoverTip key={`${t.kind}-${t.name}`} className={`trait-chip ${t.kind}`} tip={
                  <>
                    <strong className="tip-title">{t.name}</strong>
                    <span className="tip-kind">{traitKindLabel(t.kind)}</span>
                    <span className="tip-text">{t.detail}</span>
                  </>
                }>
                  {t.name}
                </HoverTip>
              ))}
              {(hidden > 0 || expanded) && (
                <button className="trait-more" onClick={() => setExpanded((v) => !v)}>
                  {expanded ? '접기' : `+${hidden} 더 보기`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
