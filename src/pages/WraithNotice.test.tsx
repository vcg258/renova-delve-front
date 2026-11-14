import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WraithNotice } from './SetupPage';
import { monsterSprite } from '../utils/sprites';
import type { WraithInfo } from '../api/types';

const wraith = (overrides: Partial<WraithInfo> = {}): WraithInfo => ({
  stage: 2, level: 5, killerName: '광증의 기사', skills: ['화염구', '출혈 베기'],
  faction: 'ABYSS', escapesLeft: 3, ...overrides,
});

describe('전생의 망령 안내', () => {
  it('기다리는 스테이지, 쓰러뜨린 적, 기술, 남은 도주 횟수를 보여 준다', () => {
    const html = renderToStaticMarkup(<WraithNotice wraith={wraith()} />);
    expect(html).toContain('스테이지 2');
    expect(html).toContain('광증의 기사에게 쓰러졌다');
    expect(html).toContain('화염구, 출혈 베기');
    expect(html).toContain('3번 더 달아나면');
  });

  it('조우에서 쓰러졌고 기술이 없으면 그에 맞게 쓴다', () => {
    const html = renderToStaticMarkup(<WraithNotice wraith={wraith({ killerName: null, skills: [] })} />);
    expect(html).toContain('조우에서 내린 선택의 대가로');
    expect(html).not.toContain('쓰던 기술');
  });

  it('망령은 일반 망령과 다른 전생의 망령 스프라이트로 그린다', () => {
    expect(monsterSprite('전생의 망령')).toBe('wraith:past');
    expect(monsterSprite('회랑의 망령')).toBe('wraith');
  });
});
