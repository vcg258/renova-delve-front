import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import KingdomScale from './KingdomScale';
import type { KingdomInfo } from '../api/types';

const kingdom = (overrides: Partial<KingdomInfo> = {}): KingdomInfo => ({
  state: 'ABYSS_WIDENING', title: '넓어지는 문', description: '문이 넓어졌다.',
  effects: ['적 공격력 +10%', '전투 골드 +20%'], heaven: 20, abyss: 55, human: 25, players: 4, ...overrides,
});

describe('왕국의 저울', () => {
  it('세 세력의 비율 막대, 정세 이름, 효과, 원정자 수를 보여 준다', () => {
    const html = renderToStaticMarkup(<KingdomScale kingdom={kingdom()} />);
    expect(html).toContain('넓어지는 문');
    expect(html).toContain('width:55%');
    expect(html).toContain('55%');
    expect(html).toContain('원정자 4명');
    expect(html).toContain('적 공격력 +10%, 전투 골드 +20%');
    expect(html).toContain('state-abyss_widening');
  });

  it('원정 준비 화면(compact)은 막대 없이 이번 원정에 걸리는 효과만', () => {
    const html = renderToStaticMarkup(<KingdomScale kingdom={kingdom()} compact />);
    expect(html).not.toContain('kingdom-bars');
    expect(html).toContain('이번 원정에 걸리는 정세');
  });

  it('균형이면 효과 없음', () => {
    const html = renderToStaticMarkup(<KingdomScale kingdom={kingdom({ state: 'BALANCE', effects: [] })} />);
    expect(html).toContain('효과 없음');
  });
});
