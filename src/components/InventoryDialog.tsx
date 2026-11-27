import type { StatusDTO } from '../api/types';
import { groupConsumables } from '../utils/inventory';
import { armorSprite, consumableSprite, helmetSprite, relicSprite, skillSprite, weaponSprite } from '../utils/sprites';
import Dialog from './Dialog';
import PixelSprite from './PixelSprite';
import Px from './Px';

const RARITY_LABEL: Record<string, string> = { COMMON: '흔한 유물', RARE: '희귀한 유물', EPIC: '전설의 유물' };

/**
 * 인벤토리: 착용 중인 장비와 그 보너스, 스킬, 유물, 소모품(종류별로 묶음).
 * 보기만 하는 창이다. 소모품은 탐험·전투 화면에서 쓰고, 스킬은 "스킬 정리"에서 버린다.
 */
export default function InventoryDialog({ status, onClose }: { status: StatusDTO; onClose: () => void }) {
  const equipment = status.equipmentDTO;
  const character = status.characterDTO;
  const skills = status.skillSlotDTO ?? [];
  const relics = status.relicInventoryDTO ?? [];
  const consumables = groupConsumables(status.consumableInventoryDTO ?? []);

  const gear = [
    {
      part: '무기', stat: '공격',
      item: equipment?.weapon ? { name: equipment.weapon.name, bonus: equipment.weapon.atkBonus, description: equipment.weapon.description,
        sprite: weaponSprite(equipment.weapon.type, equipment.weapon.name) } : null,
    },
    {
      part: '갑옷', stat: '방어',
      item: equipment?.armor ? { name: equipment.armor.name, bonus: equipment.armor.defBonus, description: equipment.armor.description,
        sprite: armorSprite(equipment.armor.type) } : null,
    },
    {
      part: '투구', stat: '최대 체력',
      item: equipment?.helmet ? { name: equipment.helmet.name, bonus: equipment.helmet.hpBonus, description: equipment.helmet.description,
        sprite: helmetSprite(equipment.helmet.type) } : null,
    },
  ];

  return (
    <Dialog label="인벤토리" onClose={onClose} className="inventory">
      <div className="swap-panel inventory-panel">
        <h3>인벤토리</h3>
        {character && (
          <p className="inventory-stats">
            공격 <b>{character.attack}</b>, 방어 <b>{character.defense}</b>, 체력 <b>{character.currentHp}</b> / {character.maxHp}
            <span className="dim small"> (장비 보너스 포함)</span>
          </p>
        )}

        <section className="inventory-section">
          <h4>착용 중인 장비</h4>
          <ul className="inventory-gear">
            {gear.map(({ part, stat, item }) => (
              <li key={part} className={item ? '' : 'empty'}>
                <span className="inventory-part">{part}</span>
                {item ? (
                  <>
                    <PixelSprite sprite={item.sprite} size={32} />
                    <span className="inventory-name">{item.name}</span>
                    <span className="inventory-bonus">{stat} +{item.bonus}</span>
                    {item.description && <span className="inventory-desc dim small">{item.description}</span>}
                  </>
                ) : <span className="dim">비어 있다</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="inventory-section">
          <h4>스킬 {skills.length}개</h4>
          {skills.length === 0 ? <p className="dim small">배운 스킬이 없다.</p> : (
            <ul className="inventory-list">
              {skills.map((slot) => (
                <li key={slot.slotId} title={slot.skill.description}>
                  <PixelSprite sprite={skillSprite(slot.skill)} size={16} /> {slot.skill.name}
                  <span className="dim small"> 쿨타임 {slot.skill.cooldown}턴</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="inventory-section">
          <h4>유물 {relics.length}개</h4>
          {relics.length === 0 ? <p className="dim small">가진 유물이 없다.</p> : (
            <ul className="inventory-list wide">
              {relics.map((r) => (
                <li key={r.slotId}>
                  <Px s={relicSprite(r.relic.name)} /> <b>{r.relic.name}</b>
                  <span className="dim small"> {RARITY_LABEL[r.relic.rarity] ?? ''}</span>
                  <span className="inventory-desc small">{r.relic.effectDesc}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="inventory-section">
          <h4>소모품</h4>
          {consumables.length === 0 ? <p className="dim small">가진 소모품이 없다.</p> : (
            <ul className="inventory-list">
              {consumables.map((c) => (
                <li key={c.consumable.consumableId} title={c.consumable.description}>
                  <Px s={consumableSprite(c.consumable.effectType, c.consumable.name)} /> {c.consumable.name}
                  {c.count > 1 && <span className="stack-count">x{c.count}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="shop-actions">
          <button className="primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </Dialog>
  );
}
