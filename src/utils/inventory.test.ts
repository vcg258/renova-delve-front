import { describe, expect, it } from 'vitest';
import { compareTrend, equipmentCompare, groupConsumables } from './inventory';

const potion = { consumableId: 1, name: '체력 물약', effectType: 'HEAL', effectValue: 30, scoreCost: 10, description: '' };
const bomb = { consumableId: 2, name: '화염병', effectType: 'DAMAGE', effectValue: 40, scoreCost: 10, description: '' };

describe('groupConsumables', () => {
  it('같은 소모품은 한 묶음으로 세고, 쓸 칸은 처음 칸이다', () => {
    const stacks = groupConsumables([
      { slotId: 11, consumable: potion },
      { slotId: 12, consumable: bomb },
      { slotId: 13, consumable: potion },
      { slotId: 14, consumable: potion },
    ]);
    expect(stacks).toHaveLength(2);
    expect(stacks[0]).toMatchObject({ slotId: 11, count: 3 });
    expect(stacks[1]).toMatchObject({ slotId: 12, count: 1 });
  });

  it('빈 목록은 빈 묶음', () => {
    expect(groupConsumables([])).toEqual([]);
  });
});

describe('equipmentCompare', () => {
  it('장비는 지금 착용 중인 보너스와 함께 보여 준다', () => {
    expect(equipmentCompare({ itemType: 'WEAPON', bonus: 8, currentBonus: 5 })).toBe('공격 +8 (지금 +5)');
    expect(equipmentCompare({ itemType: 'HELMET', bonus: 20, currentBonus: null })).toBe('최대 체력 +20 (지금 +0)');
  });

  it('장비가 아니거나 보너스가 없으면(예전 서버) null', () => {
    expect(equipmentCompare({ itemType: 'SKILL', bonus: null, currentBonus: null })).toBeNull();
    expect(equipmentCompare({ itemType: 'ARMOR' })).toBeNull();
  });

  it('올라가는지 내려가는지', () => {
    expect(compareTrend({ bonus: 8, currentBonus: 5 })).toBe('up');
    expect(compareTrend({ bonus: 3, currentBonus: 5 })).toBe('down');
    expect(compareTrend({ bonus: 5, currentBonus: 5 })).toBe('same');
  });
});
