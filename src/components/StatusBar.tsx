import type { StatusDTO } from '../api/types';
import { relicIcon } from '../utils/icons';

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: '쉬움', NORMAL: '보통', HARD: '어려움', HELL: '지옥',
};

/**
 * 게임 상단 상태 바: HP / 레벨 / 골드 / 점수 / 진행도 + 유물 시너지
 */
export default function StatusBar({ status }: { status: StatusDTO }) {
  const c = status.characterDTO;
  const s = status.stateDTO;
  const hpPercent = c ? Math.max(0, Math.min(100, (c.currentHp / c.maxHp) * 100)) : 0;
  const expNeed = c ? c.level * 100 : 100;
  const expPercent = c ? Math.max(0, Math.min(100, (c.currentExp / expNeed) * 100)) : 0;
  const synergies = status.relicSynergies ?? [];
  const relics = status.relicInventoryDTO ?? [];

  return (
    <>
      <div className="status-bar">
        <div className="status-left">
          <span className="badge">{DIFFICULTY_LABEL[s.difficulty] ?? s.difficulty}</span>
          <span className="stage-info">스테이지 {s.currentStage} · 노드 {s.currentNodeId ?? 0}/10</span>
          {s.hasPhoenix && <span className="badge phoenix" title="사망 시 1회 부활">🪶 부활</span>}
        </div>

        {c && (
          <div className="status-mid">
            <div className="hp-wrap">
              <div className="bar-label">HP {c.currentHp}/{c.maxHp}</div>
              <div className="bar"><div className="bar-fill hp" style={{ width: `${hpPercent}%` }} /></div>
              <div className="bar exp-bar"><div className="bar-fill exp" style={{ width: `${expPercent}%` }} /></div>
            </div>
            <span className="stat">Lv.{c.level}</span>
            <span className="stat">⚔ {c.attack}</span>
            <span className="stat">🛡 {c.defense}</span>
          </div>
        )}

        <div className="status-right">
          {relics.length > 0 && (
            <span className="relic-tray" title={relics.map((r) => `${r.relic.name}: ${r.relic.effectDesc}`).join('\n')}>
              {relics.slice(0, 5).map((r) => (
                <span key={r.slotId} className="relic-dot">{relicIcon(r.relic.name)}</span>
              ))}
              {relics.length > 5 && <span className="dim small">+{relics.length - 5}</span>}
            </span>
          )}
          <span className="stat gold">🪙 {s.gold}</span>
          <span className="stat score">✦ {s.score}</span>
        </div>
      </div>

      {/* 발동 중인 유물 조합 시너지 */}
      {synergies.length > 0 && (
        <div className="synergy-row">
          {synergies.map((text, i) => (
            <span key={i} className="synergy-chip" title={text}>{text}</span>
          ))}
        </div>
      )}
    </>
  );
}
