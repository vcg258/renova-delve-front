import type { KingdomInfo } from '../api/types';
import Px from './Px';

const BARS: { key: 'heaven' | 'abyss' | 'human'; label: string; icon: string; className: string }[] = [
  { key: 'heaven', label: '천상', icon: 'wings', className: 'heaven' },
  { key: 'abyss', label: '마계', icon: 'flame', className: 'abyss' },
  { key: 'human', label: '인간', icon: 'sword', className: 'human' },
];

/**
 * 왕국의 저울: 지난 7일 동안 모든 원정자가 택한 방식의 비율과, 그 결과인 왕국의 정세.
 * compact면 원정 준비 화면용으로 정세와 효과만 보여 준다.
 */
export default function KingdomScale({ kingdom, compact = false }: { kingdom: KingdomInfo; compact?: boolean }) {
  const effects = kingdom.effects.length > 0 ? kingdom.effects.join(', ') : '효과 없음';
  return (
    <section className={`kingdom-scale state-${kingdom.state.toLowerCase()} ${compact ? 'compact' : ''}`}>
      <h3><Px s="crest" /> 왕국의 저울</h3>
      <p className="kingdom-state">{kingdom.title}</p>
      {!compact && (
        <div className="kingdom-bars" aria-label="지난 7일 동안 원정자들이 택한 방식">
          {BARS.map((bar) => (
            <div key={bar.key} className={`kingdom-bar ${bar.className}`}>
              <span className="kingdom-bar-label"><Px s={bar.icon} /> {bar.label}</span>
              <span className="kingdom-bar-track"><span className="kingdom-bar-fill" style={{ width: `${kingdom[bar.key]}%` }} /></span>
              <span className="kingdom-bar-value">{kingdom[bar.key]}%</span>
            </div>
          ))}
        </div>
      )}
      <p className="kingdom-desc">{kingdom.description}</p>
      <p className="dim small">
        {compact ? '이번 원정에 걸리는 정세' : `지난 7일, 원정자 ${kingdom.players}명의 선택 (한 사람이 한 표). 새 원정은 이 정세로 시작한다`}
        : {effects}
      </p>
    </section>
  );
}
