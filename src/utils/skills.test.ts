import { describe, expect, it } from 'vitest';
import { allSkillsCooling, dropBlockReason, isBasicSkill } from './skills';

const basic = { skill: { cost: 0 } };
const other = { skill: { cost: 100 } };

describe('isBasicSkill', () => {
  it('비용이 0인 스킬만 기본 공격이다', () => {
    expect(isBasicSkill({ cost: 0 })).toBe(true);
    expect(isBasicSkill({ cost: 120 })).toBe(false);
  });
});

describe('dropBlockReason', () => {
  it('스킬이 3개 이상이면 기본 공격도 버릴 수 있다', () => {
    expect(dropBlockReason([basic, other, other], basic, false)).toBeNull();
  });

  it('스킬이 2개뿐이면 기본 공격은 버릴 수 없다', () => {
    expect(dropBlockReason([basic, other], basic, false)).toContain('기본 공격');
  });

  it('스킬이 2개여도 기본 공격이 아닌 스킬은 버릴 수 있다', () => {
    expect(dropBlockReason([basic, other], other, false)).toBeNull();
  });

  it('마지막 남은 스킬은 버릴 수 없다', () => {
    expect(dropBlockReason([other], other, false)).toContain('마지막');
  });

  it('교체할 때도 기본 공격 규칙은 같다', () => {
    expect(dropBlockReason([basic, other], basic, true)).toContain('기본 공격');
    expect(dropBlockReason([basic, other, other], basic, true)).toBeNull();
  });

  it('교체는 슬롯 수가 줄지 않으므로 마지막 스킬도 바꿀 수 있다', () => {
    expect(dropBlockReason([other], other, true)).toBeNull();
  });
});

describe('allSkillsCooling', () => {
  it('하나라도 쓸 수 있으면 false', () => {
    expect(allSkillsCooling([{ coolTime: 2 }, { coolTime: 0 }])).toBe(false);
  });

  it('전부 쿨타임이면 true', () => {
    expect(allSkillsCooling([{ coolTime: 2 }, { coolTime: 1 }])).toBe(true);
  });

  it('스킬이 없으면 false (숨 고르기 버튼을 띄울 근거가 없다)', () => {
    expect(allSkillsCooling([])).toBe(false);
  });
});
