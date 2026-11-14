import type { SpriteKey } from '../components/PixelSprite';
import type { SkillDTO, SkillInfo } from '../api/types';

/**
 * 몬스터 이름 -> 도트 스프라이트 매칭.
 * 위에서부터 차례로 검사하므로 더 구체적인 규칙을 위에 둔다.
 * (예: '회랑의 망령 기사'는 '망령'보다 '기사'가 먼저 걸려야 유령 기사로 그려진다)
 */
const MONSTER_SPRITE_RULES: [string[], SpriteKey][] = [
  // 천상
  [['대천사'], 'archangel'],
  [['추락한', '타천'], 'angel:fallen'],
  [['심판', '집행자의 천사'], 'angel:judge'],
  [['성가대'], 'angel:choir'],
  [['천사'], 'angel'],
  // 마계
  [['유혹의 마왕'], 'demonlord:tempter'],
  [['심연의 그림자'], 'demonlord:shadow'],
  [['악마화된 왕', '마왕'], 'demonlord'],
  [['계약의 악마'], 'imp:contract'],
  [['고블린'], 'imp:goblin'],
  [['임프', '악마'], 'imp'],
  // 용 / 언데드 군주
  [['용', '드래곤'], 'dragon'],
  [['뼈의 군주'], 'skeleton:lord'],
  [['흡혈귀 귀족'], 'vampire:noble'],
  [['흡혈'], 'vampire'],
  // 기사 계열
  [['기사단장'], 'knight:captain'],
  [['망령 기사'], 'knight:ghost'],
  [['덩굴에 묶인 갑옷'], 'knight:vine'],
  [['위병', '썩어가는'], 'knight:rusted'],
  [['기사', '병사', '부관', '중장갑', '갑옷'], 'knight'],
  // 인간형
  [['순례자', '광신도'], 'rogue:pilgrim'],
  [['궁수', '저격'], 'rogue:archer'],
  [['부랑자'], 'rogue:vagrant'],
  [['암살'], 'rogue:assassin'],
  [['도적'], 'rogue'],
  // 마법사 계열
  [['화염 마법사'], 'mage:fire'],
  [['얼음 마법사'], 'mage:ice'],
  [['피의 연금술사', '피의 갈증'], 'mage:blood'],
  [['사제'], 'mage:priest'],
  [['마법사', '연금술'], 'mage'],
  // 영체
  [['전생의 망령'], 'wraith:past'],
  [['수호령'], 'wraith:guardian'],
  [['그림자', '어둠의 정령'], 'wraith:shadow'],
  [['망령', '정령', '원혼'], 'wraith'],
  // 언데드 / 살점
  [['해골', '스켈레톤'], 'skeleton'],
  [['사용인'], 'zombie:servant'],
  [['살점', '융합체', '실험체', '도살자', '수집가', '내장', '집행자', '실패작'], 'zombie:flesh'],
  [['좀비', '시체'], 'zombie'],
  // 석상
  [['제단 수호자'], 'golem:altar'],
  [['가고일'], 'golem:gargoyle'],
  [['골렘', '석상'], 'golem'],
  // 짐승 / 벌레
  [['쥐'], 'wolf:rat'],
  [['군견', '사냥개'], 'wolf:hound'],
  [['늑대'], 'wolf'],
  [['날벌레'], 'spider:swarm'],
  [['집게', '갑각'], 'spider:crab'],
  [['거미'], 'spider'],
  // 점액 / 식물
  [['하수구 점액'], 'slime:sewage'],
  [['슬라임', '점액'], 'slime'],
  [['넝쿨', '덩굴', '식목'], 'plant:thorn'],
  [['식물', '꽃'], 'plant'],
];

export function monsterSprite(name: string): SpriteKey {
  for (const [keywords, sprite] of MONSTER_SPRITE_RULES) {
    if (keywords.some((keyword) => name.includes(keyword))) return sprite;
  }
  return 'imp';
}

const SKILL_SPRITES: Record<string, SpriteKey> = {
  '기본 공격': 'sword',
  '강타': 'hammer',
  '연속 베기': 'slashes',
  '출혈 베기': 'slashes:bleed',
  '화염구': 'fireball',
  '맹독 단검': 'sword:poison',
  '기절 타격': 'hammer:stun',
  '회전 베기': 'spin',
  '처형': 'axe',
  '헬파이어': 'skullflame',
};

/** 스킬 -> 도트 아이콘. 이름이 등록돼 있지 않으면 상태이상 종류로 고른다 */
export function skillSprite(skill: SkillDTO | SkillInfo): SpriteKey {
  const byName = SKILL_SPRITES[skill.name];
  if (byName) return byName;
  switch (skill.statusEffect) {
    case 1: return 'slashes:bleed';
    case 2: return 'fireball';
    case 3: return 'sword:poison';
    case 4: return 'hammer:stun';
  }
  if (skill.target === 'EnemyAll') return 'spin';
  return skill.coefficient >= 1.5 ? 'hammer' : 'sword';
}

/* ------------------------------------------------------------------
   장비 / 유물 / 소모품 / 상점
   ------------------------------------------------------------------ */

export function weaponSprite(type: string, name = ''): SpriteKey {
  if (name.includes('멸망')) return 'staff:doom';
  switch (type) {
    case 'DAGGER': return 'dagger';
    case 'BLUNT': return 'mace';
    case 'STAFF': return 'staff';
    default: return 'sword';
  }
}

function weaponSpriteByName(name: string): SpriteKey {
  if (name.includes('멸망')) return 'staff:doom';
  if (name.includes('단검')) return 'dagger';
  if (name.includes('둔기') || name.includes('철퇴')) return 'mace';
  if (name.includes('지팡이')) return 'staff';
  return 'sword';
}

export function armorSprite(type: string): SpriteKey {
  switch (type) {
    case 'LEATHER': return 'armor:leather';
    case 'CHAIN': return 'armor:chain';
    case 'METAL': return 'armor:plate';
    default: return 'armor';
  }
}

function armorSpriteByName(name: string): SpriteKey {
  if (name.includes('가죽')) return 'armor:leather';
  if (name.includes('사슬')) return 'armor:chain';
  if (name.includes('판금')) return 'armor:plate';
  return 'armor';
}

export function helmetSprite(type: string): SpriteKey {
  switch (type) {
    case 'MASK': return 'mask';
    case 'LEATHER': return 'helmet:leather';
    case 'CLOTH': return 'helmet:hood';
    default: return 'helmet';
  }
}

function helmetSpriteByName(name: string): SpriteKey {
  if (name.includes('가면')) return 'mask';
  if (name.includes('모자')) return 'helmet:leather';
  if (name.includes('후드')) return 'helmet:hood';
  return 'helmet';
}

export function relicSprite(name: string): SpriteKey {
  if (name.includes('핏빛')) return 'ring:blood';
  if (name.includes('반지')) return 'ring';
  if (name.includes('핵')) return 'crystal:core';
  if (name.includes('수정')) return 'crystal';
  if (name.includes('문장') || name.includes('방패')) return 'crest';
  if (name.includes('눈')) return 'eye';
  return 'amulet';
}

export function consumableSprite(effectType: string, name = ''): SpriteKey {
  if (name.includes('폭탄')) return 'bomb';
  if (name.includes('깃털')) return 'feather';
  switch (effectType) {
    case 'ATTACK': case 'GRANT': return 'potion:attack';
    case 'DEFENCE': return 'potion:defence';
    case 'RELEASE': return 'potion:antidote';
    case 'DAMAGE': return 'bomb';
    case 'RESURRECTION': return 'feather';
    default: return 'potion';
  }
}

function consumableSpriteByName(name: string): SpriteKey {
  if (name.includes('폭탄')) return 'bomb';
  if (name.includes('깃털')) return 'feather';
  if (name.includes('해독')) return 'potion:antidote';
  if (name.includes('공격')) return 'potion:attack';
  if (name.includes('방어')) return 'potion:defence';
  return 'potion';
}

/** 상점 진열품은 타입과 이름만 내려오므로 이름으로 고른다 */
export function shopSprite(itemType: string, name: string): SpriteKey {
  switch (itemType) {
    case 'WEAPON': return weaponSpriteByName(name);
    case 'ARMOR': return armorSpriteByName(name);
    case 'HELMET': return helmetSpriteByName(name);
    case 'SKILL': return SKILL_SPRITES[name] ?? 'scroll';
    case 'RELIC': return relicSprite(name);
    case 'CONSUMABLE': return consumableSpriteByName(name);
    default: return 'chest';
  }
}
