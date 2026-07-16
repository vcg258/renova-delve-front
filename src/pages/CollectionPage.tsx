import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCollection } from '../api/game';
import type { Encyclopedia } from '../api/types';
import { armorIcon, consumableIcon, helmetIcon, relicIcon, skillIcon, weaponIcon } from '../utils/icons';

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
        <h2>📖 도감</h2>
        <span />
      </header>

      {error && <p className="dim page-center">도감을 펼칠 수 없다...</p>}
      {!data && !error && <p className="dim page-center">먼지 쌓인 도감을 펼치는 중...</p>}

      {data && (
        <div className="collection-sections">
          <Section title="⚔ 무기" items={data.weaponDTO.map((e) => ({ id: e.collectionId, name: `${weaponIcon(e.weapon.type)} ${e.weapon.name}`, desc: e.weapon.description }))} />
          <Section title="🛡 갑옷" items={data.armorDTO.map((e) => ({ id: e.collectionId, name: `${armorIcon()} ${e.armor.name}`, desc: e.armor.description }))} />
          <Section title="🪖 투구" items={data.helmetDTO.map((e) => ({ id: e.collectionId, name: `${helmetIcon(e.helmet.type)} ${e.helmet.name}`, desc: e.helmet.description }))} />
          <Section title="✨ 스킬" items={data.skillDTO.map((e) => ({ id: e.collectionId, name: `${skillIcon(e.skill)} ${e.skill.name}`, desc: e.skill.description }))} />
          <Section title="🔮 유물" items={data.relicDTO.map((e) => ({ id: e.collectionId, name: `${relicIcon(e.relic.name)} ${e.relic.name}`, desc: e.relic.effectDesc }))} />
          <Section title="🧪 소모품" items={data.consumableDTO.map((e) => ({ id: e.collectionId, name: `${consumableIcon(e.consumable.effectType)} ${e.consumable.name}`, desc: e.consumable.description }))} />
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: { id: number; name: string; desc: string }[] }) {
  return (
    <section className="setup-section">
      <h3>{title} <span className="dim small">{items.length}종 수집</span></h3>
      {items.length === 0 ? (
        <p className="dim">아직 수집한 것이 없다.</p>
      ) : (
        <div className="option-row">
          {items.map((item) => (
            <div key={item.id} className="option-card static">
              <span className="option-name">{item.name}</span>
              <span className="option-desc">{item.desc}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
