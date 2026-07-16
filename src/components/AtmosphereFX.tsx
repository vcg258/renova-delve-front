import { useMemo } from 'react';

/**
 * 마왕성 분위기 연출 레이어 (전부 CSS 애니메이션, pointer-events 없음)
 *
 * 구성(뒤→앞): 별(희미) → 달 + 먹구름 → 마른 번개 → 원경 산맥/폐탑
 * → 근경 마왕성 → 죽은 나무(전경) → 안개 → 떨어지는 재 → 낮게 떠도는 불씨
 * → 박쥐 → 필름 그레인 → 비네트
 */
export default function AtmosphereFX() {
  // 떨어지는 재/먼지 (축제 반딧불 대신, 불탄 왕국의 재)
  const ashes = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1.5 + Math.random() * 3,
        duration: 14 + Math.random() * 18,
        delay: Math.random() * 18,
        drift: (Math.random() - 0.5) * 160,
      })),
    [],
  );

  // 성문/지면 근처에서만 낮게 흩날리는 잔불 (소수, 어둡게)
  const embers = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        left: 30 + Math.random() * 40, // 성 근처에만
        size: 2 + Math.random() * 2.5,
        duration: 7 + Math.random() * 8,
        delay: Math.random() * 10,
        drift: (Math.random() - 0.5) * 60,
      })),
    [],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 45,
        size: 1 + Math.random() * 1.4,
        duration: 3.5 + Math.random() * 5,
        delay: Math.random() * 6,
      })),
    [],
  );

  const bats = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        top: 8 + Math.random() * 18,
        duration: 26 + Math.random() * 18,
        delay: i * 9 + Math.random() * 6,
        scale: 0.7 + Math.random() * 0.5,
      })),
    [],
  );

  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="stars">
        {stars.map((s) => (
          <span key={s.id} className="star"
            style={{
              left: `${s.left}%`, top: `${s.top}%`,
              width: s.size, height: s.size,
              animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s`,
            }} />
        ))}
      </div>

      <div className="moon" />
      <div className="storm-cloud c1" />
      <div className="storm-cloud c2" />
      <div className="lightning" />

      <div className="castle-glow" />
      <div className="castle-far" />
      <div className="castle-silhouette" />

      <div className="dead-tree left" />
      <div className="dead-tree right" />

      <div className="fog fog-1" />
      <div className="fog fog-2" />
      <div className="fog fog-3" />

      {ashes.map((a) => (
        <span key={`a-${a.id}`} className="ash"
          style={{
            left: `${a.left}%`, width: a.size, height: a.size,
            animationDuration: `${a.duration}s`, animationDelay: `${a.delay}s`,
            ['--drift' as string]: `${a.drift}px`,
          }} />
      ))}

      {embers.map((e) => (
        <span key={`e-${e.id}`} className="low-ember"
          style={{
            left: `${e.left}%`, width: e.size, height: e.size,
            animationDuration: `${e.duration}s`, animationDelay: `${e.delay}s`,
            ['--drift' as string]: `${e.drift}px`,
          }} />
      ))}

      {bats.map((b) => (
        <span key={b.id} className="bat"
          style={{
            top: `${b.top}%`,
            animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s`,
            fontSize: `${16 * b.scale}px`,
          }}>
          🦇
        </span>
      ))}

      <div className="grain" />
      <div className="vignette" />
    </div>
  );
}
