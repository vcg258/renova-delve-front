import { describe, expect, it } from 'vitest';
import spriteData from '../sprites/sprites.json';
import {
  armorSprite, consumableSprite, helmetSprite, monsterSprite, relicSprite, shopSprite, skillSprite, weaponSprite,
} from './sprites';

/**
 * 이름 -> 스프라이트 매칭은 규칙을 위에서부터 검사한다.
 * 규칙 순서가 바뀌거나 넓은 키워드가 위로 올라가면 다른 그림이 조용히 나오므로, 시드 데이터의 이름으로 고정해 둔다.
 */
describe('monsterSprite', () => {
  const cases: [string, string][] = [
    // 구체적인 규칙이 넓은 규칙보다 먼저 걸려야 하는 경우
    ['회랑의 망령 기사', 'knight:ghost'],      // '망령'(영체)보다 '망령 기사'가 먼저
    ['덩굴에 묶인 갑옷', 'knight:vine'],       // '덩굴'(식물)보다 먼저
    ['기사단장', 'knight:captain'],            // '기사'보다 먼저
    ['유혹의 마왕', 'demonlord:tempter'],      // '마왕'보다 먼저
    ['악마화된 왕', 'demonlord'],              // '악마'(임프)보다 먼저
    ['계약의 악마', 'imp:contract'],
    ['정화의 대천사', 'archangel'],            // '천사'보다 먼저
    ['추락한 천사', 'angel:fallen'],
    ['빛을 잃은 성가대', 'angel:choir'],
    ['하수구 점액질', 'slime:sewage'],         // '점액'보다 먼저
    ['하수구 쥐괴물', 'wolf:rat'],
    ['피의 연금술사', 'mage:blood'],           // '연금술'보다 먼저
    ['흡혈귀 귀족', 'vampire:noble'],          // '흡혈'보다 먼저
    ['뼈의 군주', 'skeleton:lord'],
    ['묘지기 가고일', 'golem:gargoyle'],
    // 넓은 규칙
    ['광증의 기사', 'knight'],
    ['인간 병사', 'knight'],
    ['광증의 중장갑병', 'knight'],
    ['썩어가는 위병', 'knight:rusted'],
    ['탐욕스러운 부랑자', 'rogue:vagrant'],
    ['계시받은 순례자', 'rogue:pilgrim'],
    ['환영의 마법사', 'mage'],
    ['굶주린 군견', 'wolf:hound'],
    ['바위 골렘', 'golem'],
    ['식인 식물', 'plant'],
    ['뒤틀린 정원 식목', 'plant:thorn'],
    ['좀비', 'zombie'],
    ['연금술 실패작', 'mage'],                 // '연금술'이 '실패작'(살점)보다 위에 있다
    ['실패한 융합체', 'zombie:flesh'],
    ['망령', 'wraith'],
  ];

  it.each(cases)('%s -> %s', (name, expected) => {
    expect(monsterSprite(name)).toBe(expected);
  });

  it('어느 규칙에도 걸리지 않으면 기본 그림으로 떨어진다', () => {
    expect(monsterSprite('이름 없는 것')).toBe('imp');
  });
});

describe('장비 · 유물 · 소모품', () => {
  it('무기는 타입으로 고르되 이름이 우선하는 예외가 있다', () => {
    expect(weaponSprite('DAGGER')).toBe('dagger');
    expect(weaponSprite('BLUNT')).toBe('mace');
    expect(weaponSprite('STAFF', '멸망의 지팡이')).toBe('staff:doom');
    expect(weaponSprite('UNKNOWN')).toBe('sword');
  });

  it('갑옷 · 투구', () => {
    expect(armorSprite('METAL')).toBe('armor:plate');
    expect(armorSprite('UNKNOWN')).toBe('armor');
    expect(helmetSprite('MASK')).toBe('mask');
    expect(helmetSprite('UNKNOWN')).toBe('helmet');
  });

  it('유물은 이름으로 고른다', () => {
    expect(relicSprite('핏빛 반지')).toBe('ring:blood'); // '반지'보다 먼저
    expect(relicSprite('심연의 핵')).toBe('crystal:core');
    expect(relicSprite('수호자의 문장')).toBe('crest');
    expect(relicSprite('고대의 부적')).toBe('amulet');
  });

  it('소모품은 이름 예외 다음에 효과 종류로 고른다', () => {
    expect(consumableSprite('HEAL', '화염 폭탄')).toBe('bomb');
    expect(consumableSprite('RESURRECTION')).toBe('feather');
    expect(consumableSprite('RELEASE')).toBe('potion:antidote');
    expect(consumableSprite('HEAL')).toBe('potion');
  });

  it('상점 진열품은 타입과 이름만으로 고른다', () => {
    expect(shopSprite('WEAPON', '녹슨 단검')).toBe('dagger');
    expect(shopSprite('ARMOR', '기사단 판금 갑옷')).toBe('armor:plate');
    expect(shopSprite('SKILL', '화염구')).toBe('fireball');
    expect(shopSprite('SKILL', '등록되지 않은 스킬')).toBe('scroll');
    expect(shopSprite('CONSUMABLE', '해독제')).toBe('potion:antidote');
    expect(shopSprite('???', '무언가')).toBe('chest');
  });
});

describe('skillSprite', () => {
  const base = { name: '이름 없는 스킬', statusEffect: 0, target: 'EnemySingle', coefficient: 1 };

  it('등록된 이름이 가장 먼저다', () => {
    expect(skillSprite({ ...base, name: '화염구', statusEffect: 1 } as never)).toBe('fireball');
  });

  it('이름이 없으면 상태이상 -> 대상 -> 계수 순으로 고른다', () => {
    expect(skillSprite({ ...base, statusEffect: 3 } as never)).toBe('sword:poison');
    expect(skillSprite({ ...base, target: 'EnemyAll' } as never)).toBe('spin');
    expect(skillSprite({ ...base, coefficient: 1.8 } as never)).toBe('hammer');
    expect(skillSprite(base as never)).toBe('sword');
  });
});

/**
 * 매칭 함수가 돌려주는 키가 실제로 그릴 수 있는 스프라이트인지 확인한다.
 * (키는 '이름' 또는 '이름:팔레트변형' 형태다. 오타가 나면 화면에 아무것도 그려지지 않는다)
 */
describe('매칭 결과는 모두 sprites.json에 있는 그림이다', () => {
  const data = spriteData as unknown as Record<string, { variants?: Record<string, unknown> }>;

  const exists = (key: string) => {
    const [name, variant] = key.split(':');
    const sprite = data[name];
    if (!sprite) return false;
    return variant === undefined || (sprite.variants !== undefined && variant in sprite.variants);
  };

  const keys = new Set<string>([
    ...['회랑의 망령 기사', '덩굴에 묶인 갑옷', '기사단장', '유혹의 마왕', '심연의 그림자', '악마화된 왕', '계약의 악마',
      '고블린', '정화의 대천사', '추락한 천사', '심판의 천사', '빛을 잃은 성가대', '천사', '용', '뼈의 군주', '흡혈귀 귀족',
      '흡혈 박쥐', '썩어가는 위병', '광증의 기사', '계시받은 순례자', '궁수', '탐욕스러운 부랑자', '암살자', '도적',
      '화염 마법사', '얼음 마법사', '피의 연금술사', '사제', '환영의 마법사', '수호령', '어둠의 정령', '망령', '해골 병사',
      '광기의 사용인', '실패한 융합체', '좀비', '제단 수호자', '묘지기 가고일', '바위 골렘', '하수구 쥐괴물', '굶주린 군견',
      '늑대', '날벌레 떼', '집게 괴물', '거미', '하수구 점액질', '슬라임', '뒤틀린 정원 식목', '식인 식물', '이름 없는 것',
    ].map(monsterSprite),
    ...['SWORD', 'DAGGER', 'BLUNT', 'STAFF'].map((t) => weaponSprite(t)), weaponSprite('STAFF', '멸망의 지팡이'),
    ...['LEATHER', 'CHAIN', 'METAL', 'X'].map(armorSprite),
    ...['MASK', 'LEATHER', 'CLOTH', 'X'].map(helmetSprite),
    ...['핏빛 반지', '반지', '심연의 핵', '수정', '문장', '눈', '부적'].map(relicSprite),
    ...['ATTACK', 'DEFENCE', 'RELEASE', 'DAMAGE', 'RESURRECTION', 'HEAL'].map((t) => consumableSprite(t)),
    shopSprite('SKILL', '없는 스킬'), shopSprite('???', '무언가'),
  ]);

  it.each([...keys])('%s', (key) => {
    expect(exists(key)).toBe(true);
  });
});
