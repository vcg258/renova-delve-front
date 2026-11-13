import type { StatusDTO } from '../api/types';
import Px from './Px';
import { relicSprite } from '../utils/sprites';

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
  const alignment = status.alignment;

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
            <span className="relic-tray" title={relics.map((r) => `${r.relic.name}: ${r.relic.effectDesc}`).join('\n')}>
              {relics.slice(0, 5).map((r) => (
                <span key={r.slotId} className="relic-dot"><Px s={relicSprite(r.relic.name)} /></span>
              ))}
              {relics.length > 5 && <span className="dim small">+{relics.length - 5}</span>}
            </span>
          )}
          <span className="stat gold"><Px s="coin" /> {s.gold}</span>
          <span className="stat score"><Px s="star" /> {s.score}</span>
        </div>
      </div>

      {/* 성향: 조우에서 어느 세력의 방식을 택해 왔는가 */}
      {alignment && (
        <div className="alignment-row"
          title="조우에서 택한 방식이 쌓입니다. 한 세력이 3 이상이고 단독 1위가 되면 그 세력의 가호가 붙습니다.">
          <span className={`alignment-pip heaven ${alignment.dominant === 'HEAVEN' ? 'dominant' : ''}`}>
            <Px s="wings" /> 천상 {alignment.heaven}
          </span>
          <span className={`alignment-pip human ${alignment.dominant === 'HUMAN' ? 'dominant' : ''}`}>
            <Px s="sword" /> 인간 {alignment.human}
          </span>
          <span className={`alignment-pip abyss ${alignment.dominant === 'ABYSS' ? 'dominant' : ''}`}>
            <Px s="flame" /> 마계 {alignment.abyss}
          </span>
          {alignment.blessing && (
            <span className={`blessing-chip ${alignment.dominant?.toLowerCase() ?? ''}`}>{alignment.blessing}</span>
          )}
        </div>
      )}

      {/* 이번 원정에 건 서약 */}
      {(status.pacts ?? []).length > 0 && (
        <div className="pact-row" title="스스로 건 제약입니다. 제약마다 점수 보너스가 붙습니다.">
          {(status.pacts ?? []).map((pact) => <span key={pact} className="pact-chip">{pact}</span>)}
        </div>
      )}

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
