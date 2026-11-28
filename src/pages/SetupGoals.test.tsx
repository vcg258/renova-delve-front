import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SetupGoals, nextDifficulty } from './SetupPage';
import type { SetupOptions } from '../api/types';

const options = (overrides: Partial<SetupOptions> = {}): SetupOptions => ({
  budget: 500, bonusBudget: 0, maxSkillPicks: 3, pacts: [], weapons: [], armors: [], helmets: [], skills: [], relics: [],
  locked: { weapons: [1, 2], armors: [3], helmets: [], skills: [4], relics: [] },
  budgetPerCollection: 10, maxBonusBudget: 500, bestCleared: null, ...overrides,
});

describe('원정 준비의 다음 목표', () => {
  it('다음 난이도는 클리어한 가장 높은 난이도의 바로 위다', () => {
    expect(nextDifficulty(null)).toBe('EASY');
    expect(nextDifficulty('EASY')).toBe('NORMAL');
    expect(nextDifficulty('HELL')).toBeNull();
  });

  it('처음이면 쉬움부터, 잠긴 항목 수와 남은 예산 성장을 보여 준다', () => {
    const html = renderToStaticMarkup(<SetupGoals options={options()} />);
    expect(html).toContain('쉬움 난이도로');
    expect(html).toContain('4개 남았다');
    expect(html).toContain('10씩 늘어난다');
    expect(html).toContain('최대 +500');
  });

  it('보통을 깼으면 어려움을 권하고, 다 해금했고 예산이 꽉 찼으면 그 줄은 없다', () => {
    const html = renderToStaticMarkup(<SetupGoals options={options({
      bestCleared: 'NORMAL', bonusBudget: 500,
      locked: { weapons: [], armors: [], helmets: [], skills: [], relics: [] },
    })} />);
    expect(html).toContain('보통 클리어. 다음은 어려움');
    expect(html).not.toContain('잠긴');
    expect(html).not.toContain('늘어난다');
  });
});
