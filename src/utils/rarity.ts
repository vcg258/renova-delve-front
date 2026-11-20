import type { Rarity } from '../api/types';

/** 카드에 붙는 등급 클래스. 등급이 없으면(소모품, 예전 서버) 빈 문자열 */
export function rarityClass(rarity?: Rarity | null): string {
  return rarity ? `rarity-${rarity.toLowerCase()}` : '';
}

const LABEL: Record<Rarity, string> = { COMMON: '흔한', RARE: '희귀한', EPIC: '전설의' };

/** 카드 머리말: "희귀한 스킬"처럼 등급과 종류를 잇는다. 등급이 없으면 종류만 */
export function rarityKind(kind: string, rarity?: Rarity | null): string {
  return rarity ? `${LABEL[rarity]} ${kind}` : kind;
}
