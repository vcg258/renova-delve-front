import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCollection } from '../api/game';
import type { Encyclopedia } from '../api/types';
import PixelSprite, { type SpriteKey } from '../components/PixelSprite';
import Px from '../components/Px';
import {
  armorSprite, consumableSprite, helmetSprite, relicSprite, skillSprite, weaponSprite,
} from '../utils/sprites';

interface Entry {
  id: number;
  sprite: SpriteKey;
  name: string;
  desc: string;
}

/**
 * 도감: 지금까지의 플레이에서 획득한 장비/스킬/유물/소모품 아카이브.
 */
export default function CollectionPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Encyclopedia | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCollection().then(setData).catch(() => setError(true));
  }, []);

  return (
    <div className="page collection-page">
      <header className="setup-header">
        <button className="ghost" onClick={() => navigate('/')}>← 돌아가기</button>
        <h2><Px s="book" /> 도감</h2>
        <span />
      </header>

      {error && <p className="dim page-center">도감을 펼칠 수 없다...</p>}
      {!data && !error && <p className="dim page-center">먼지 쌓인 도감을 펼치는 중...</p>}

      {data && (
        <div className="collection-sections">
          <p className="dim small">도감에 등록한 항목 1종마다 다음 원정의 스타팅 포인트가 5씩 늘어납니다. (최대 +200)</p>
          <Section title="무기" icon="sword" items={data.weaponDTO.map((e) => ({
            id: e.collectionId, sprite: weaponSprite(e.weapon.type, e.weapon.name), name: e.weapon.name, desc: e.weapon.description,
          }))} />
          <Section title="갑옷" icon="armor:chain" items={data.armorDTO.map((e) => ({
            id: e.collectionId, sprite: armorSprite(e.armor.type), name: e.armor.name, desc: e.armor.description,
          }))} />
          <Section title="투구" icon="helmet" items={data.helmetDTO.map((e) => ({
            id: e.collectionId, sprite: helmetSprite(e.helmet.type), name: e.helmet.name, desc: e.helmet.description,
          }))} />
          <Section title="스킬" icon="scroll" items={data.skillDTO.map((e) => ({
            id: e.collectionId, sprite: skillSprite(e.skill), name: e.skill.name, desc: e.skill.description,
          }))} />
          <Section title="유물" icon="crystal" items={data.relicDTO.map((e) => ({
            id: e.collectionId, sprite: relicSprite(e.relic.name), name: e.relic.name, desc: e.relic.effectDesc,
          }))} />
          <Section title="소모품" icon="potion" items={data.consumableDTO.map((e) => ({
            id: e.collectionId, sprite: consumableSprite(e.consumable.effectType, e.consumable.name),
            name: e.consumable.name, desc: e.consumable.description,
          }))} />
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, items }: { title: string; icon: SpriteKey; items: Entry[] }) {
  return (
    <section className="setup-section">
      <h3><Px s={icon} /> {title} <span className="dim small">{items.length}종 수집</span></h3>
      {items.length === 0 ? (
        <p className="dim">아직 수집한 것이 없다.</p>
      ) : (
        <div className="option-row">
          {items.map((item) => (
            <div key={item.id} className="option-card static">
              <span className="option-name with-sprite"><PixelSprite sprite={item.sprite} size={32} /> {item.name}</span>
              <span className="option-desc">{item.desc}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
