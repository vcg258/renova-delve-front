import type { SkillDTO } from '../api/types';

/** 기본 공격인지 (서버가 판정한 값) */
export function isBasicSkill(skill: Pick<SkillDTO, 'basic'>): boolean {
  return skill.basic;
}

interface SlotLike {
  skill: Pick<SkillDTO, 'basic'>;
}

/**
 * 이 슬롯의 스킬을 버릴 수 없는 이유 (버릴 수 있으면 null).
 * 서버가 최종 판정하지만, 눌러 보고 거절당하기 전에 화면에서 먼저 막고 이유를 적는다.
 *
 * @param replacing true면 다른 스킬로 바꾸는 중(슬롯 수가 줄지 않는다), false면 그냥 버리는 중
 * @param minSlotsToDropBasic 서버 규칙 값 (상태 응답의 minSlotsToDropBasic)
 */
export function dropBlockReason(slots: SlotLike[], slot: SlotLike, replacing: boolean,
  minSlotsToDropBasic: number): string | null {
  if (!replacing && slots.length <= 1) return '마지막 스킬은 버릴 수 없다';
  if (isBasicSkill(slot.skill) && slots.length < minSlotsToDropBasic) {
    return `기본 공격은 스킬 ${minSlotsToDropBasic}개부터 버릴 수 있다`;
  }
  return null;
}

/** 이번 턴에 쓸 수 있는 스킬이 하나도 없는지 (숨 고르기를 고를 수 있는 조건) */
export function allSkillsCooling(slots: { coolTime: number }[]): boolean {
  return slots.length > 0 && slots.every((slot) => slot.coolTime > 0);
}
