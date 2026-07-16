import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetupOptions, newGame } from '../api/game';
import { errorMessage } from '../api/client';
import type { Difficulty, SetupOptions } from '../api/types';
import { armorIcon, helmetIcon, relicIcon, skillIcon, weaponIcon } from '../utils/icons';

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
      await newGame({ difficulty, weaponId, armorId, helmetId, skillIds, relicIds });
      navigate('/game');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (!options) {
    return <div className="page-center dim">{error ?? '장비 목록을 불러오는 중...'}</div>;
  }

  const basicSkillNote = '「기본 공격」은 항상 지급됩니다. 추가 스킬은 최대 3개.';

  return (
    <div className="page setup-page">
      <header className="setup-header">
        <button className="ghost" onClick={() => navigate('/')}>← 돌아가기</button>
        <h2>원정 준비</h2>
        <div className={`budget ${overBudget ? 'over' : ''}`}>
          스타팅 포인트 {usedPoints} / {options.budget}
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
              onClick={() => setWeaponId(w.weaponId)} title={w.description}>
              <span className="option-name">{weaponIcon(w.type)} {w.name}</span>
              <span className="option-desc">⚔ +{w.atkBonus} · {w.scoreCost}pt</span>
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
              onClick={() => setArmorId(a.armorId)} title={a.description}>
              <span className="option-name">{armorIcon()} {a.name}</span>
              <span className="option-desc">🛡 +{a.defBonus} · {a.scoreCost}pt</span>
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
              onClick={() => setHelmetId(h.helmetId)} title={h.description}>
              <span className="option-name">{helmetIcon(h.type)} {h.name}</span>
              <span className="option-desc">❤ +{h.hpBonus} · {h.scoreCost}pt</span>
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
              onClick={() => toggleSkill(s.skillId)} title={s.description}>
              <span className="option-name">{skillIcon(s)} {s.name}</span>
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
              onClick={() => toggleRelic(r.relicId)} title={r.effectDesc}>
              <span className="option-name">{relicIcon(r.name)} {r.name}</span>
              <span className="option-desc">{r.effectDesc} · {r.scoreCost}pt</span>
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
