import { describe, expect, it } from 'vitest';
import { buildTraits, foldTraits, splitTrait } from './traits';

describe('splitTrait', () => {
  it('이름과 설명을 나눈다', () => {
    expect(splitTrait('피의 사냥 — 치명타 시 출혈 2스택 부여 (핏빛 반지 + 사냥꾼의 눈)')).toEqual({
      name: '피의 사냥',
      detail: '치명타 시 출혈 2스택 부여 (핏빛 반지 + 사냥꾼의 눈)',
    });
  });

  it('구분자가 없으면 전체가 이름이다', () => {
    expect(splitTrait('옅은 피')).toEqual({ name: '옅은 피', detail: '' });
  });

  it('설명 안에 구분자가 또 나와도 첫 번째에서만 나눈다', () => {
    expect(splitTrait('가 — 나 — 다')).toEqual({ name: '가', detail: '나 — 다' });
  });
});

describe('buildTraits', () => {
  it('서약, 유물 조합, 스킬 조합 순서로 합치고 종류를 붙인다', () => {
    const traits = buildTraits(['옅은 피'], ['피의 사냥 — 설명1'], ['휩쓸기 — 설명2']);
    expect(traits.map((t) => [t.kind, t.name])).toEqual([
      ['pact', '옅은 피'], ['relic', '피의 사냥'], ['skill', '휩쓸기'],
    ]);
    expect(traits[0].detail).not.toBe(''); // 서약은 설명이 없으므로 기본 안내를 넣는다
    expect(traits[2].detail).toBe('설명2');
  });

  it('값이 없어도(구버전 응답) 빈 목록을 돌려준다', () => {
    expect(buildTraits(undefined, undefined, undefined)).toEqual([]);
  });
});

describe('foldTraits', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  it('한도 이하면 모두 보인다', () => {
    expect(foldTraits(items.slice(0, 6), 6, false)).toEqual({ visible: [1, 2, 3, 4, 5, 6], hidden: 0 });
  });

  it('하나만 넘칠 때는 접지 않는다', () => {
    expect(foldTraits(items.slice(0, 7), 6, false).hidden).toBe(0);
  });

  it('둘 이상 넘치면 한도까지만 보이고 나머지 수를 알려준다', () => {
    expect(foldTraits(items, 6, false)).toEqual({ visible: [1, 2, 3, 4, 5, 6], hidden: 3 });
  });

  it('펼치면 모두 보인다', () => {
    expect(foldTraits(items, 6, true)).toEqual({ visible: items, hidden: 0 });
  });
});
