import { describe, expect, it } from 'vitest';
import { allSkillsCooling, dropBlockReason, isBasicSkill } from './skills';

const basic = { skill: { basic: true } };
const other = { skill: { basic: false } };
/** 서버가 상태 응답으로 주는 규칙 값 (minSlotsToDropBasic) */
const MIN = 3;

describe('isBasicSkill', () => {
  it('서버가 준 표시를 따른다', () => {
    expect(isBasicSkill({ basic: true })).toBe(true);
    expect(isBasicSkill({ basic: false })).toBe(false);
  });
});

describe('dropBlockReason', () => {
  it('스킬이 3개 이상이면 기본 공격도 버릴 수 있다', () => {
    expect(dropBlockReason([basic, other, other], basic, false, MIN)).toBeNull();
  });

  it('스킬이 2개뿐이면 기본 공격은 버릴 수 없다', () => {
    expect(dropBlockReason([basic, other], basic, false, MIN)).toContain('기본 공격');
  });

  it('스킬이 2개여도 기본 공격이 아닌 스킬은 버릴 수 있다', () => {
    expect(dropBlockReason([basic, other], other, false, MIN)).toBeNull();
  });

  it('마지막 남은 스킬은 버릴 수 없다', () => {
    expect(dropBlockReason([other], other, false, MIN)).toContain('마지막');
  });

  it('교체할 때도 기본 공격 규칙은 같다', () => {
    expect(dropBlockReason([basic, other], basic, true, MIN)).toContain('기본 공격');
    expect(dropBlockReason([basic, other, other], basic, true, MIN)).toBeNull();
  });

  it('교체는 슬롯 수가 줄지 않으므로 마지막 스킬도 바꿀 수 있다', () => {
    expect(dropBlockReason([other], other, true, MIN)).toBeNull();
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

describe('서버 규칙 값', () => {
  it('최소 스킬 수를 서버가 4로 바꾸면 3개일 때도 기본 공격을 버릴 수 없다', () => {
    expect(dropBlockReason([basic, other, other], basic, false, 4)).toContain('4개부터');
    expect(dropBlockReason([basic, other, other, other], basic, false, 4)).toBeNull();
  });
});
