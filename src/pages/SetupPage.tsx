import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKingdom, getSetupOptions, getWraith, newGame } from '../api/game';
import { errorMessage } from '../api/client';
import type { Difficulty, KingdomInfo, SetupOptions, WraithInfo } from '../api/types';
import KingdomScale from '../components/KingdomScale';
import PixelSprite from '../components/PixelSprite';
import Px from '../components/Px';
import { armorSprite, helmetSprite, relicSprite, skillSprite, weaponSprite } from '../utils/sprites';
import { isBasicSkill } from '../utils/skills';
import { rarityClass } from '../utils/rarity';

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'EASY', label: '쉬움', desc: '보상 0.7배, 랭킹에 오르지 않음' },
  { value: 'NORMAL', label: '보통', desc: '표준 난이도' },
  { value: 'HARD', label: '어려움', desc: '적이 강해지고 보상 1.3배' },
  { value: 'HELL', label: '지옥', desc: '적이 크게 강해지고 보상 2배' },
];

/** 고를 수 없는 카드에 이유를 적는다. 비활성 버튼은 흐려질 뿐 왜 안 눌리는지 알려주지 않는다 */
function Blocked({ reason }: { reason: string | null }) {
  return reason ? <span className="option-blocked">{reason}</span> : null;
}

/**
 * 원정 준비의 카드 하나. 막힌 이유를 한 번만 계산해 버튼 잠금과 이유 문구에 같이 쓴다.
 */
function OptionCard({ block, selected, className = '', title, onClick, children }: {
  block: string | null;
  selected: boolean;
  className?: string;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button className={`option-card ${className} ${selected ? 'selected' : ''}`}
      disabled={block != null} onClick={onClick} title={title}>
      {children}
      <Blocked reason={block} />
    </button>
  );
}

/** 지난 원정에서 쓰러진 자리에 남은 망령 안내. 나타날 노드는 알려 주지 않는다 */
export function WraithNotice({ wraith }: { wraith: WraithInfo }) {
  const how = wraith.killerName ? `${wraith.killerName}에게 쓰러졌다` : '조우에서 내린 선택의 대가로 쓰러졌다';
  return (
    <section className="setup-section wraith-notice">
      <h3><Px s="wraith:past" /> 전생의 망령이 기다린다</h3>
      <p>지난 원정의 당신이 스테이지 {wraith.stage} 어딘가에 남아 있다. Lv.{wraith.level}, {how}.</p>
      {wraith.skills.length > 0 && <p className="dim">쓰던 기술: {wraith.skills.join(', ')}</p>}
      <p className="dim">
        쓰러뜨리면 그때 가졌던 유물 하나를 되찾는다. {wraith.escapesLeft}번 더 달아나면 흩어진다.
      </p>
    </section>
  );
}

/**
 * 새 게임 세팅: 스타팅 포인트 예산 안에서 장비/스킬/유물 선택.
 * 예산 검증은 서버가 다시 하지만, UI에서도 실시간으로 보여준다.
 */
export default function SetupPage() {
  const navigate = useNavigate();
  const [options, setOptions] = useState<SetupOptions | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [weaponId, setWeaponId] = useState<number | null>(null);
  const [armorId, setArmorId] = useState<number | null>(null);
  const [helmetId, setHelmetId] = useState<number | null>(null);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [relicIds, setRelicIds] = useState<number[]>([]);
  const [pacts, setPacts] = useState<string[]>([]);
  const [wraith, setWraith] = useState<WraithInfo | null>(null);
  const [kingdom, setKingdom] = useState<KingdomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSetupOptions()
      .then((opts) => {
        setOptions(opts);
        // 기본(0포인트) 장비 자동 선택
        setWeaponId(opts.weapons.reduce((a, b) => (a.scoreCost <= b.scoreCost ? a : b), opts.weapons[0])?.weaponId ?? null);
        setArmorId(opts.armors.reduce((a, b) => (a.scoreCost <= b.scoreCost ? a : b), opts.armors[0])?.armorId ?? null);
        setHelmetId(opts.helmets.reduce((a, b) => (a.scoreCost <= b.scoreCost ? a : b), opts.helmets[0])?.helmetId ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
    // 망령 안내는 부가 정보라 실패해도 원정 준비는 그대로 진행한다
    getWraith().then(setWraith).catch(() => setWraith(null));
    getKingdom().then(setKingdom).catch(() => setKingdom(null));
  }, []);

  const usedPoints = useMemo(() => {
    if (!options) return 0;
    const weapon = options.weapons.find((w) => w.weaponId === weaponId)?.scoreCost ?? 0;
    const armor = options.armors.find((a) => a.armorId === armorId)?.scoreCost ?? 0;
    const helmet = options.helmets.find((h) => h.helmetId === helmetId)?.scoreCost ?? 0;
    const skills = options.skills.filter((s) => skillIds.includes(s.skillId)).reduce((sum, s) => sum + s.cost, 0);
    const relics = options.relics.filter((r) => relicIds.includes(r.relicId)).reduce((sum, r) => sum + r.scoreCost, 0);
    return weapon + armor + helmet + skills + relics;
  }, [options, weaponId, armorId, helmetId, skillIds, relicIds]);

  const overBudget = options != null && usedPoints > options.budget;

  // 남은 포인트로 고를 수 없는 항목은 버튼 자체를 막는다 (서버 검증은 그대로 최종 방어선)
  const remaining = options ? options.budget - usedPoints : 0;
  const weaponCost = options?.weapons.find((w) => w.weaponId === weaponId)?.scoreCost ?? 0;
  const armorCost = options?.armors.find((a) => a.armorId === armorId)?.scoreCost ?? 0;
  const helmetCost = options?.helmets.find((h) => h.helmetId === helmetId)?.scoreCost ?? 0;
  // 막힌 이유를 돌려준다(막히지 않았으면 null). 버튼을 막는 데도, 카드에 이유를 적는 데도 같은 값을 쓴다.
  /** 하나만 고르는 칸: 지금 고른 것과의 차액을 감당할 수 있어야 바꿀 수 있다 */
  const swapBlock = (cost: number, currentCost: number, selected: boolean) =>
    !selected && cost - currentCost > remaining ? `${cost - currentCost - remaining}pt 부족` : null;
  /** 여러 개 고르는 칸: 고른 것은 언제든 뺄 수 있고, 새로 넣으려면 남은 포인트가 있어야 한다 */
  const addBlock = (cost: number, selected: boolean) =>
    !selected && cost > remaining ? `${cost - remaining}pt 부족` : null;
  const skillBlock = (cost: number, selected: boolean) =>
    !selected && skillIds.length >= 3 ? '스킬은 3개까지' : addBlock(cost, selected);

  const toggleSkill = (id: number) => {
    setSkillIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]);
  };

  const toggleRelic = (id: number) => {
    setRelicIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const start = async () => {
    if (overBudget || busy) return;
    setBusy(true);
    setError(null);
    try {
      await newGame({ difficulty, weaponId, armorId, helmetId, skillIds, relicIds, pacts });
      navigate('/game');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (!options) {
    return <div className="page-center dim">{error ?? '장비 목록을 불러오는 중...'}</div>;
  }

  const pactBonus = (options.pacts ?? [])
    .filter((p) => pacts.includes(p.code))
    .reduce((sum, p) => sum + p.scoreBonusPercent, 0);

  const basicSkillNote = '「기본 공격」은 항상 지급됩니다. 추가 스킬은 최대 3개.';

  return (
    <div className="page setup-page">
      <header className="setup-header">
        <button className="ghost" onClick={() => navigate('/')}>← 돌아가기</button>
        <h2>원정 준비</h2>
        <div className={`budget ${overBudget ? 'over' : ''}`}>
          스타팅 포인트 {usedPoints} / {options.budget}
          <span className="budget-left">남은 포인트 {Math.max(0, remaining)}</span>
          <span className="budget-bonus" title="도감에 등록한 항목 1종마다 +5 (최대 +200)">
            {options.bonusBudget > 0 ? `도감 보너스 +${options.bonusBudget}` : '도감을 채우면 예산이 늘어납니다'}
          </span>
        </div>
      </header>

      {wraith && <WraithNotice wraith={wraith} />}
      {kingdom && kingdom.state !== 'BALANCE' && <KingdomScale kingdom={kingdom} compact />}

      <section className="setup-section">
        <h3>난이도</h3>
        <div className="option-row">
          {DIFFICULTIES.map((d) => (
            <button key={d.value}
              className={`option-card ${difficulty === d.value ? 'selected' : ''}`}
              onClick={() => setDifficulty(d.value)}>
              <span className="option-name">{d.label}</span>
              <span className="option-desc">{d.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>무기</h3>
        <div className="option-row">
          {options.weapons.map((w) => (
            <OptionCard key={w.weaponId} className={rarityClass(w.rarity)}
              selected={weaponId === w.weaponId}
              block={swapBlock(w.scoreCost, weaponCost, weaponId === w.weaponId)}
              onClick={() => setWeaponId(w.weaponId)} title={w.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={weaponSprite(w.type, w.name)} size={32} /> {w.name}</span>
              <span className="option-desc"><span><Px s="sword" /> 공격 +{w.atkBonus}</span><span className="option-cost">{w.scoreCost}pt</span></span>
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>갑옷</h3>
        <div className="option-row">
          {options.armors.map((a) => (
            <OptionCard key={a.armorId} className={rarityClass(a.rarity)}
              selected={armorId === a.armorId}
              block={swapBlock(a.scoreCost, armorCost, armorId === a.armorId)}
              onClick={() => setArmorId(a.armorId)} title={a.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={armorSprite(a.type)} size={32} /> {a.name}</span>
              <span className="option-desc"><span><Px s="crest:steel" /> 방어 +{a.defBonus}</span><span className="option-cost">{a.scoreCost}pt</span></span>
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>투구</h3>
        <div className="option-row">
          {options.helmets.map((h) => (
            <OptionCard key={h.helmetId} className={rarityClass(h.rarity)}
              selected={helmetId === h.helmetId}
              block={swapBlock(h.scoreCost, helmetCost, helmetId === h.helmetId)}
              onClick={() => setHelmetId(h.helmetId)} title={h.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={helmetSprite(h.type)} size={32} /> {h.name}</span>
              <span className="option-desc"><span><Px s="heart" /> 체력 +{h.hpBonus}</span><span className="option-cost">{h.scoreCost}pt</span></span>
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>스킬 <span className="dim small">{basicSkillNote}</span></h3>
        <div className="option-row">
          {options.skills.filter((s) => !isBasicSkill(s)).map((s) => (
            <OptionCard key={s.skillId} className={rarityClass(s.rarity)}
              selected={skillIds.includes(s.skillId)}
              block={skillBlock(s.cost, skillIds.includes(s.skillId))}
              onClick={() => toggleSkill(s.skillId)} title={s.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={skillSprite(s)} size={32} /> {s.name}</span>
              <span className="option-desc"><span>계수 x{s.coefficient}, 쿨타임 {s.cooldown}</span><span className="option-cost">{s.cost}pt</span></span>
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>유물</h3>
        <div className="option-row">
          {options.relics.map((r) => (
            <OptionCard key={r.relicId} className={rarityClass(r.rarity)}
              selected={relicIds.includes(r.relicId)}
              block={addBlock(r.scoreCost, relicIds.includes(r.relicId))}
              onClick={() => toggleRelic(r.relicId)} title={r.effectDesc}>
              <span className="option-name with-sprite"><PixelSprite sprite={relicSprite(r.name)} size={32} /> {r.name}</span>
              <span className="option-desc"><span>{r.effectDesc}</span><span className="option-cost">{r.scoreCost}pt</span></span>
            </OptionCard>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>
          서약 <span className="dim small">— 스스로 거는 제약. 고른 만큼 점수가 오른다 (선택 사항)</span>
          {pactBonus > 0 && <span className="pact-total">점수 +{pactBonus}%</span>}
        </h3>
        <div className="option-row">
          {(options.pacts ?? []).map((p) => (
            <button key={p.code}
              className={`option-card pact-card ${pacts.includes(p.code) ? 'selected' : ''}`}
              onClick={() => setPacts((prev) => prev.includes(p.code) ? prev.filter((x) => x !== p.code) : [...prev, p.code])}>
              <span className="option-name">{p.title}</span>
              <span className="option-desc">{p.description}</span>
              <span className="pact-bonus">점수 +{p.scoreBonusPercent}%</span>
            </button>
          ))}
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      <footer className="setup-footer">
        <button className="primary wide" onClick={start} disabled={overBudget || busy}>
          {busy ? '왕궁의 문이 열린다...' : overBudget ? '스타팅 포인트 초과' : '잠입 시작'}
        </button>
      </footer>
    </div>
  );
}
