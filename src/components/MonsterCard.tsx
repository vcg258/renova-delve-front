import type { BattleMonster } from '../api/types';
import { monsterIcon } from '../utils/icons';

const TYPE_LABEL = ['일반', '엘리트', '보스'];
const BUFF_LABEL: Record<string, string> = {
  BLEED: '출혈', BURN: '화상', POISON: '독', STUN: '기절',
};

export type FxKind = 'slash' | 'heavy' | 'fire' | 'poison' | 'stun';

interface Props {
  monster: BattleMonster;
  selected: boolean;
  onSelect: (key: number) => void;
  /** 이번 턴 이 몬스터에게 재생 중인 스킬 이펙트 */
  fxKind?: FxKind | null;
  fxId?: number;
  /** 이번 턴 받은 피해량 (플로팅 데미지) */
  damage?: number | null;
}

export default function MonsterCard({ monster, selected, onSelect, fxKind, fxId, damage }: Props) {
  const dead = monster.currentHp <= 0;
  const hpPercent = Math.max(0, Math.min(100, (monster.currentHp / monster.maxHp) * 100));
  const typeClass = monster.monsterType === 2 ? 'boss' : monster.monsterType === 1 ? 'elite' : '';

  return (
    <button
      className={`monster-card ${typeClass} ${selected ? 'selected' : ''} ${dead ? 'dead' : ''} ${fxKind ? 'being-hit' : ''}`}
      onClick={() => !dead && onSelect(monster.key)}
      disabled={dead}
      title={monster.description}
    >
      <div className={`monster-portrait ${typeClass}`}>
        <span className="monster-emoji">{monsterIcon(monster.name)}</span>
      </div>
      <div className="monster-head">
        <span className="monster-name">{monster.name}</span>
        <span className={`monster-type ${typeClass}`}>{TYPE_LABEL[monster.monsterType] ?? '?'}</span>
      </div>
      <div className="bar monster-hp">
        <div className="bar-fill enemy" style={{ width: `${hpPercent}%` }} />
      </div>
      <div className="monster-stats">
        <span>HP {monster.currentHp}/{monster.maxHp}</span>
        <span>⚔{monster.atk} 🛡{monster.def}</span>
      </div>
      <div className="monster-buffs">
        {Object.entries(monster.buffs ?? {}).map(([buff, stack]) => (
          <span key={buff} className={`buff-chip ${buff.toLowerCase()}`}>
            {BUFF_LABEL[buff] ?? buff} {stack}
          </span>
        ))}
      </div>

      {/* ===== 스킬 이펙트 오버레이 ===== */}
      {fxKind && (
        <span className="fx-overlay" key={fxId}>
          {fxKind === 'slash' && (<><i className="fx-slash" /><i className="fx-slash second" /></>)}
          {fxKind === 'heavy' && (<><i className="fx-shockwave" /><i className="fx-slash heavy" /></>)}
          {fxKind === 'fire' && (<><i className="fx-fire" /><i className="fx-fire-spark" /></>)}
          {fxKind === 'poison' && (<><i className="fx-poison" /><i className="fx-poison-drip" /></>)}
          {fxKind === 'stun' && <i className="fx-stun">✦ ✦ ✦</i>}
        </span>
      )}

      {/* ===== 플로팅 데미지 ===== */}
      {damage != null && damage > 0 && (
        <span className={`dmg-float ${damage >= 60 ? 'big' : ''}`} key={`d-${fxId}-${damage}`}>
          -{damage}
        </span>
      )}

      {dead && <div className="dead-mark">✝</div>}
    </button>
  );
}
