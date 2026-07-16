import type { SkillDTO, SkillInfo } from '../api/types';

/**
 * 이름/속성 키워드 기반 아이콘 매칭.
 * 이미지 에셋 없이도 모든 몬스터/스킬/아이템에 어울리는 심볼을 붙여준다.
 */

const MONSTER_ICON_RULES: [string[], string][] = [
  [['용', '드래곤'], '🐉'],
  [['왕', '군주', '단장', '귀족'], '👑'],
  [['거미'], '🕷️'],
  [['늑대', '군견', '사냥개'], '🐺'],
  [['골렘', '석상', '가고일'], '🗿'],
  [['좀비', '사용인', '시체', '융합체', '살점', '실험체', '도살자'], '🧟'],
  [['해골', '스켈레톤', '뼈'], '💀'],
  [['기사', '병사', '위병', '부관', '중장갑', '집행자', '갑옷'], '🛡️'],
  [['마법사', '연금', '광신도', '사제', '수호령'], '🧙'],
  [['망령', '정령', '그림자', '원혼', '혼'], '👻'],
  [['흡혈'], '🧛'],
  [['박쥐', '날벌레'], '🦇'],
  [['슬라임', '점액'], '🟢'],
  [['고블린'], '👺'],
  [['쥐'], '🐀'],
  [['식물', '넝쿨', '덩굴', '식목', '꽃'], '🌿'],
  [['궁수', '저격', '화살'], '🏹'],
  [['도적', '암살', '부랑자'], '🗡️'],
  [['집게', '갑각'], '🦀'],
  [['악마', '심연', '마계'], '😈'],
  [['내장', '장기', '피의'], '🫀'],
];

export function monsterIcon(name: string): string {
  for (const [keywords, icon] of MONSTER_ICON_RULES) {
    if (keywords.some((k) => name.includes(k))) return icon;
  }
  return '👹';
}

export function skillIcon(skill: SkillDTO | SkillInfo): string {
  switch (skill.statusEffect) {
    case 1: return '🩸'; // 출혈
    case 2: return '🔥'; // 화상
    case 3: return '☠️'; // 독
    case 4: return '💫'; // 기절
  }
  if (skill.target === 'EnemyAll') return '🌀';
  if (skill.coefficient >= 1.5) return '⚔️';
  return '🗡️';
}

export function consumableIcon(effectType: string): string {
  switch (effectType) {
    case 'RECOVERY': return '🧪';
    case 'ATTACK': case 'GRANT': return '⚗️';
    case 'DEFENCE': return '🛡️';
    case 'DAMAGE': return '💣';
    case 'RESURRECTION': return '🪶';
    case 'RELEASE': return '✨';
    default: return '🎒';
  }
}

export function relicIcon(name: string): string {
  if (name.includes('반지')) return '💍';
  if (name.includes('수정') || name.includes('핵')) return '🔮';
  if (name.includes('문장') || name.includes('방패')) return '🛡️';
  if (name.includes('부적')) return '🧿';
  if (name.includes('눈')) return '👁️';
  if (name.includes('목걸이')) return '📿';
  return '🏺';
}

export function weaponIcon(type: string): string {
  switch (type) {
    case 'SWORD': return '⚔️';
    case 'DAGGER': return '🗡️';
    case 'BLUNT': return '🔨';
    case 'STAFF': return '🪄';
    default: return '⚔️';
  }
}

export function armorIcon(): string {
  return '🥋';
}

export function helmetIcon(type: string): string {
  return type === 'MASK' ? '🎭' : '🪖';
}

/** 상점 아이템 타입 -> 아이콘 (이름 보조 매칭) */
export function shopIcon(itemType: string, name: string): string {
  switch (itemType) {
    case 'WEAPON': return name.includes('단검') ? '🗡️' : name.includes('지팡이') ? '🪄' : name.includes('둔기') ? '🔨' : '⚔️';
    case 'ARMOR': return '🥋';
    case 'HELMET': return name.includes('가면') ? '🎭' : '🪖';
    case 'SKILL': return '📜';
    case 'RELIC': return relicIcon(name);
    case 'CONSUMABLE':
      if (name.includes('폭탄')) return '💣';
      if (name.includes('깃털')) return '🪶';
      if (name.includes('해독')) return '✨';
      if (name.includes('공격')) return '⚗️';
      if (name.includes('방어')) return '🛡️';
      return '🧪';
    default: return '🎁';
  }
}
