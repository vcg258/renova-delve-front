import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MonsterCard, { BUFF_HELP } from './MonsterCard';
import type { BattleMonster } from '../api/types';

/** 몬스터 카드의 상태이상 칩이 설명 말풍선을 함께 내놓는지 (브라우저 없이 문자열로 렌더링한다) */

function monster(overrides: Partial<BattleMonster> = {}): BattleMonster {
  return {
    key: 0, monsterId: 1, name: '광증의 기사', monsterType: 0,
    maxHp: 50, currentHp: 30, atk: 10, def: 2,
    buffs: {}, description: '', intent: 'ATTACK', enraged: false,
    ...overrides,
  } as BattleMonster;
}

const render = (m: BattleMonster) => renderToStaticMarkup(
  <MonsterCard monster={m} selected={false} onSelect={() => {}} fxKind={null} fxId={undefined} damage={null} />,
);

describe('MonsterCard 상태이상 말풍선', () => {
  it.each(['BLEED', 'BURN', 'POISON', 'STUN'])('%s 칩에 규칙 설명이 붙는다', (buff) => {
    const html = render(monster({ buffs: { [buff]: 2 } }));
    expect(html).toContain('role="tooltip"');
    expect(html).toContain(BUFF_HELP[buff]);
  });

  it('격노한 보스에는 격노 설명이 붙는다', () => {
    const html = render(monster({ monsterType: 2, enraged: true }));
    expect(html).toContain(BUFF_HELP.ENRAGED);
  });

  it('상태이상이 없으면 말풍선도 없다', () => {
    expect(render(monster())).not.toContain(BUFF_HELP.BLEED);
  });
});
