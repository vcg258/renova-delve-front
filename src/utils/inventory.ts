import type { ConsumableDTO, ConsumableInventoryDTO, ShopItem } from '../api/types';

/** 같은 소모품 여러 칸을 한 줄로 묶은 것. 쓸 때는 그중 첫 칸을 쓴다 */
export interface ConsumableStack {
  slotId: number;
  consumable: ConsumableDTO;
  count: number;
}

/** 소모품 칸을 종류별로 묶는다. 처음 나온 순서를 지킨다 */
export function groupConsumables(items: ConsumableInventoryDTO[]): ConsumableStack[] {
  const stacks = new Map<number, ConsumableStack>();
  for (const item of items) {
    const stack = stacks.get(item.consumable.consumableId);
    if (stack) stack.count += 1;
    else stacks.set(item.consumable.consumableId, { slotId: item.slotId, consumable: item.consumable, count: 1 });
  }
  return [...stacks.values()];
}

/** 장비 부위가 올려 주는 능력치의 이름 */
export const EQUIPMENT_STAT: Record<string, string> = {
  WEAPON: '공격',
  ARMOR: '방어',
  HELMET: '최대 체력',
};

/** 상점 장비를 지금 착용 중인 것과 비교한 문구. 예: "공격 +8 (지금 +5)". 장비가 아니면 null */
export function equipmentCompare(item: Pick<ShopItem, 'itemType' | 'bonus' | 'currentBonus'>): string | null {
  const stat = EQUIPMENT_STAT[item.itemType];
  if (!stat || item.bonus == null) return null;
  const current = item.currentBonus ?? 0;
  return `${stat} +${item.bonus} (지금 +${current})`;
}

/** 비교 결과: 올라가면 up, 내려가면 down, 같으면 same */
export function compareTrend(item: Pick<ShopItem, 'bonus' | 'currentBonus'>): 'up' | 'down' | 'same' | null {
  if (item.bonus == null) return null;
  const current = item.currentBonus ?? 0;
  return item.bonus > current ? 'up' : item.bonus < current ? 'down' : 'same';
}
