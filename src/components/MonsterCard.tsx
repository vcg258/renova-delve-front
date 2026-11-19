import type { BattleKeyword, BattleMonster } from '../api/types';
import PixelSprite from './PixelSprite';
import Px from './Px';
import HoverTip from './HoverTip';
import { monsterSprite } from '../utils/sprites';

const TYPE_LABEL = ['일반', '엘리트', '보스'];
/** 설명을 아직 받지 못했을 때(또는 받지 못했을 때) 칩에 쓰는 이름. 규칙 설명은 서버가 준다 */
const FALLBACK_LABEL: Record<string, string> = {
  BLEED: '출혈', BURN: '화상', POISON: '독', STUN: '기절', ENRAGED: '격노',
};

/** 이번 턴 행동 예고 표시 (강공 수치는 서버 계산식과 같은 1.6배) */
function intentLabel(monster: BattleMonster): { icon: string; text: string; className: string } {
  if ((monster.buffs?.STUN ?? 0) > 0) return { icon: 'star:stun', text: '기절해서 움직이지 못한다', className: 'stunned' };
  switch (monster.intent) {
    case 'HEAVY': return { icon: 'burst', text: `강공 예고 ${Math.round(monster.atk * 1.6)}`, className: 'heavy' };
    case 'GUARD': return { icon: 'crest:steel', text: '방어 태세라 타격 피해가 절반', className: 'guard' };
    default: return { icon: 'sword', text: `공격 예고 ${monster.atk}`, className: 'attack' };
  }
}

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
  /** 전투 키워드 설명 (서버 GET /api/game/keywords). 없으면 칩에 이름만 쓴다 */
  keywords?: Record<string, BattleKeyword>;
}

export default function MonsterCard({ monster, selected, onSelect, fxKind, fxId, damage, keywords = {} }: Props) {
  const label = (key: string) => keywords[key]?.label ?? FALLBACK_LABEL[key] ?? key;
  const dead = monster.currentHp <= 0;
  const hpPercent = Math.max(0, Math.min(100, (monster.currentHp / monster.maxHp) * 100));
  const typeClass = monster.monsterType === 2 ? 'boss' : monster.monsterType === 1 ? 'elite' : '';
  const intent = intentLabel(monster);

  return (
    <button
      className={`monster-card ${typeClass} ${selected ? 'selected' : ''} ${dead ? 'dead' : ''} ${fxKind ? 'being-hit' : ''}`}
      onClick={() => !dead && onSelect(monster.key)}
      disabled={dead}
      title={monster.description}
    >
      <div className={`monster-portrait ${typeClass}`}>
        <PixelSprite sprite={monsterSprite(monster.name)} size={monster.monsterType === 2 ? 80 : 64} className="monster-sprite" title={monster.name} />
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
        <span className="monster-atkdef"><Px s="sword" />{monster.atk} <Px s="crest:steel" />{monster.def}</span>
      </div>
      {!dead && <div className={`monster-intent ${intent.className}`}><Px s={intent.icon} /> {intent.text}</div>}
      <div className="monster-buffs">
        {monster.enraged && !dead && (
          <HoverTip tip={keywords.ENRAGED?.description ?? label('ENRAGED')} focusable={false}>
            <span className="buff-chip enraged">{label('ENRAGED')}</span>
          </HoverTip>
        )}
        {Object.entries(monster.buffs ?? {}).map(([buff, stack]) => (
          <HoverTip key={buff} tip={<><strong>{label(buff)} {stack}</strong><br />{keywords[buff]?.description ?? ''}</>}
            focusable={false}>
            <span className={`buff-chip ${buff.toLowerCase()}`}>{label(buff)} {stack}</span>
          </HoverTip>
        ))}
      </div>

      {/* ===== 스킬 이펙트 오버레이 ===== */}
      {fxKind && (
        <span className="fx-overlay" key={fxId}>
          {fxKind === 'slash' && (<><i className="fx-slash" /><i className="fx-slash second" /></>)}
          {fxKind === 'heavy' && (<><i className="fx-shockwave" /><i className="fx-slash heavy" /></>)}
          {fxKind === 'fire' && (<><i className="fx-fire" /><i className="fx-fire-spark" /></>)}
          {fxKind === 'poison' && (<><i className="fx-poison" /><i className="fx-poison-drip" /></>)}
          {fxKind === 'stun' && <i className="fx-stun"><Px s="star:stun" /><Px s="star:stun" /><Px s="star:stun" /></i>}
        </span>
      )}

      {/* ===== 플로팅 데미지 ===== */}
      {damage != null && damage > 0 && (
        <span className={`dmg-float ${damage >= 60 ? 'big' : ''}`} key={`d-${fxId}-${damage}`}>
          -{damage}
        </span>
      )}

      {dead && <div className="dead-mark"><Px s="grave" size={32} /></div>}
    </button>
  );
}
