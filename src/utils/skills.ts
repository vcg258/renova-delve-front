import type { SkillDTO } from '../api/types';

/** 기본 공격은 스킬을 이만큼(기본 공격 포함) 가졌을 때만 버리거나 바꿀 수 있다. 서버 SkillSlotService와 같은 값 */
export const MIN_SLOTS_TO_DROP_BASIC = 3;

/** 기본 공격인지. 스타팅 포인트 비용이 0인 스킬은 기본 공격 하나뿐이다 (서버와 같은 기준) */
export function isBasicSkill(skill: Pick<SkillDTO, 'cost'>): boolean {
  return skill.cost === 0;
}

interface SlotLike {
  skill: Pick<SkillDTO, 'cost'>;
}

/**
 * 이 슬롯의 스킬을 버릴 수 없는 이유 (버릴 수 있으면 null).
 * 서버가 최종 판정하지만, 눌러 보고 거절당하기 전에 화면에서 먼저 막고 이유를 적는다.
 *
 * @param replacing true면 다른 스킬로 바꾸는 중(슬롯 수가 줄지 않는다), false면 그냥 버리는 중
 */
export function dropBlockReason(slots: SlotLike[], slot: SlotLike, replacing: boolean): string | null {
  if (!replacing && slots.length <= 1) return '마지막 스킬은 버릴 수 없다';
  if (isBasicSkill(slot.skill) && slots.length < MIN_SLOTS_TO_DROP_BASIC) {
    return `기본 공격은 스킬 ${MIN_SLOTS_TO_DROP_BASIC}개부터 버릴 수 있다`;
  }
  return null;
}

/** 이번 턴에 쓸 수 있는 스킬이 하나도 없는지 (숨 고르기를 고를 수 있는 조건) */
export function allSkillsCooling(slots: { coolTime: number }[]): boolean {
  return slots.length > 0 && slots.every((slot) => slot.coolTime > 0);
}
