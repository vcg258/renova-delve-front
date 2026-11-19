import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import InventoryDialog from './InventoryDialog';
import type { StatusDTO } from '../api/types';

const potion = { consumableId: 1, name: '체력 물약', effectType: 'HEAL', effectValue: 30, scoreCost: 10, description: '회복' };

function status(overrides: Partial<StatusDTO> = {}): StatusDTO {
  return {
    stateDTO: {
      gameStateId: 1, difficulty: 'EASY', isActive: true, currentStage: 1, currentNodeId: 3,
      score: 0, gold: 0, startingPoints: 0, hasPhoenix: false,
    },
    characterDTO: { characterId: 1, level: 1, currentExp: 0, currentHp: 40, maxHp: 60, attack: 17, defense: 6 },
    consumableInventoryDTO: [
      { slotId: 1, consumable: potion }, { slotId: 2, consumable: potion }, { slotId: 3, consumable: potion },
    ],
    equipmentDTO: {
      equipId: 1,
      weapon: { weaponId: 3, name: '멸망의 지팡이', type: 'STAFF', atkBonus: 12, specialEffect: 0, scoreCost: 0, description: '' },
      armor: null,
      helmet: null,
    },
    relicInventoryDTO: [],
    skillSlotDTO: [],
    ...overrides,
  } as StatusDTO;
}

describe('InventoryDialog', () => {
  it('착용 중인 장비와 보너스, 비어 있는 부위를 보여 준다', () => {
    const html = renderToStaticMarkup(<InventoryDialog status={status()} onClose={() => {}} />);
    expect(html).toContain('멸망의 지팡이');
    expect(html).toContain('공격 +12');
    expect(html).toContain('비어 있다');
  });

  it('같은 소모품은 묶어서 개수를 보여 준다', () => {
    const html = renderToStaticMarkup(<InventoryDialog status={status()} onClose={() => {}} />);
    expect(html.match(/체력 물약/g)).toHaveLength(1);
    expect(html).toContain('x3');
  });

  it('장비 슬롯이 없어도 그린다', () => {
    const html = renderToStaticMarkup(<InventoryDialog status={status({ equipmentDTO: null })} onClose={() => {}} />);
    expect(html.match(/비어 있다/g)).toHaveLength(3);
  });
});
