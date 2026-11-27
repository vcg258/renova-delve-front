import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MonsterCard from './MonsterCard';
import type { BattleKeyword, BattleMonster } from '../api/types';

/** 몬스터 카드의 상태이상 칩이 서버가 준 설명 말풍선을 함께 내놓는지 (브라우저 없이 문자열로 렌더링한다) */

function monster(overrides: Partial<BattleMonster> = {}): BattleMonster {
  return {
    key: 0, monsterId: 1, name: '광증의 기사', monsterType: 0,
    maxHp: 50, currentHp: 30, atk: 10, def: 2,
    buffs: {}, description: '', intent: 'ATTACK', intentAtk: 10, enraged: false,
    ...overrides,
  } as BattleMonster;
}

const KEYWORDS: Record<string, BattleKeyword> = Object.fromEntries([
  ['BLEED', '출혈', '서버 설명: 출혈'],
  ['BURN', '화상', '서버 설명: 화상'],
  ['POISON', '독', '서버 설명: 독'],
  ['STUN', '기절', '서버 설명: 기절'],
  ['ENRAGED', '격노', '서버 설명: 격노'],
].map(([key, label, description]) => [key, { key, label, description }]));

const render = (m: BattleMonster, keywords: Record<string, BattleKeyword> | undefined = KEYWORDS) => renderToStaticMarkup(
  <MonsterCard monster={m} selected={false} onSelect={() => {}} fxKind={null} fxId={undefined} damage={null} keywords={keywords} />,
);

describe('MonsterCard 상태이상 말풍선', () => {
  it.each(['BLEED', 'BURN', 'POISON', 'STUN'])('%s 칩에 서버가 준 규칙 설명이 붙는다', (buff) => {
    const html = render(monster({ buffs: { [buff]: 2 } }));
    expect(html).toContain('role="tooltip"');
    expect(html).toContain(KEYWORDS[buff].description);
  });

  it('격노한 보스에는 격노 설명이 붙는다', () => {
    const html = render(monster({ monsterType: 2, enraged: true }));
    expect(html).toContain(KEYWORDS.ENRAGED.description);
  });

  it('상태이상이 없으면 말풍선도 없다', () => {
    expect(render(monster())).not.toContain(KEYWORDS.BLEED.description);
  });

  it('설명을 받지 못했어도 칩 이름은 나온다', () => {
    const html = render(monster({ buffs: { BURN: 1 } }), undefined);
    expect(html).toContain('화상 1');
  });
});
