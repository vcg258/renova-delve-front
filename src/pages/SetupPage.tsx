import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetupOptions, newGame } from '../api/game';
import { errorMessage } from '../api/client';
import type { Difficulty, SetupOptions } from '../api/types';
import PixelSprite from '../components/PixelSprite';
import Px from '../components/Px';
import { armorSprite, helmetSprite, relicSprite, skillSprite, weaponSprite } from '../utils/sprites';

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'EASY', label: '쉬움', desc: '보상 x0.7 · 랭킹 미등록' },
  { value: 'NORMAL', label: '보통', desc: '표준 난이도' },
  { value: 'HARD', label: '어려움', desc: '적 강화 · 보상 x1.3' },
  { value: 'HELL', label: '지옥', desc: '적 대폭 강화 · 보상 x2.0' },
];

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
  /** 하나만 고르는 칸: 지금 고른 것과의 차액을 감당할 수 있어야 바꿀 수 있다 */
  const cannotSwap = (cost: number, currentCost: number, selected: boolean) =>
    !selected && cost - currentCost > remaining;
  /** 여러 개 고르는 칸: 고른 것은 언제든 뺄 수 있고, 새로 넣으려면 남은 포인트가 있어야 한다 */
  const cannotAdd = (cost: number, selected: boolean) => !selected && cost > remaining;

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
            <button key={w.weaponId}
              className={`option-card ${weaponId === w.weaponId ? 'selected' : ''}`}
              disabled={cannotSwap(w.scoreCost, weaponCost, weaponId === w.weaponId)}
              onClick={() => setWeaponId(w.weaponId)} title={w.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={weaponSprite(w.type, w.name)} size={32} /> {w.name}</span>
              <span className="option-desc"><Px s="sword" /> +{w.atkBonus} · {w.scoreCost}pt</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>갑옷</h3>
        <div className="option-row">
          {options.armors.map((a) => (
            <button key={a.armorId}
              className={`option-card ${armorId === a.armorId ? 'selected' : ''}`}
              disabled={cannotSwap(a.scoreCost, armorCost, armorId === a.armorId)}
              onClick={() => setArmorId(a.armorId)} title={a.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={armorSprite(a.type)} size={32} /> {a.name}</span>
              <span className="option-desc"><Px s="crest:steel" /> +{a.defBonus} · {a.scoreCost}pt</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>투구</h3>
        <div className="option-row">
          {options.helmets.map((h) => (
            <button key={h.helmetId}
              className={`option-card ${helmetId === h.helmetId ? 'selected' : ''}`}
              disabled={cannotSwap(h.scoreCost, helmetCost, helmetId === h.helmetId)}
              onClick={() => setHelmetId(h.helmetId)} title={h.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={helmetSprite(h.type)} size={32} /> {h.name}</span>
              <span className="option-desc"><Px s="heart" /> +{h.hpBonus} · {h.scoreCost}pt</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>스킬 <span className="dim small">{basicSkillNote}</span></h3>
        <div className="option-row">
          {options.skills.filter((s) => s.cost > 0).map((s) => (
            <button key={s.skillId}
              className={`option-card ${skillIds.includes(s.skillId) ? 'selected' : ''}`}
              disabled={cannotAdd(s.cost, skillIds.includes(s.skillId))
                || (skillIds.length >= 3 && !skillIds.includes(s.skillId))}
              onClick={() => toggleSkill(s.skillId)} title={s.description}>
              <span className="option-name with-sprite"><PixelSprite sprite={skillSprite(s)} size={32} /> {s.name}</span>
              <span className="option-desc">계수 x{s.coefficient} · 쿨 {s.cooldown} · {s.cost}pt</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>유물</h3>
        <div className="option-row">
          {options.relics.map((r) => (
            <button key={r.relicId}
              className={`option-card rarity-${r.rarity.toLowerCase()} ${relicIds.includes(r.relicId) ? 'selected' : ''}`}
              disabled={cannotAdd(r.scoreCost, relicIds.includes(r.relicId))}
              onClick={() => toggleRelic(r.relicId)} title={r.effectDesc}>
              <span className="option-name with-sprite"><PixelSprite sprite={relicSprite(r.name)} size={32} /> {r.name}</span>
              <span className="option-desc">{r.effectDesc} · {r.scoreCost}pt</span>
            </button>
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
