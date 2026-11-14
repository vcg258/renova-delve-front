/**
 * 상태 바 아래에 늘어놓는 표시(서약 / 유물 조합 / 스킬 조합)를 다루는 순수 함수.
 * 서버는 "이름 — 설명" 한 줄로 내려주고, 화면은 이름만 칩에 쓰고 설명은 말풍선에 넣는다.
 */

export type TraitKind = 'pact' | 'relic' | 'skill';

export interface Trait {
  kind: TraitKind;
  name: string;
  detail: string;
}

const KIND_LABEL: Record<TraitKind, string> = { pact: '서약', relic: '유물 조합', skill: '스킬 조합' };

export function traitKindLabel(kind: TraitKind): string {
  return KIND_LABEL[kind];
}

/** "피의 사냥 — 치명타 시 출혈 2스택 (핏빛 반지 + 사냥꾼의 눈)" -> 이름과 설명 */
export function splitTrait(text: string): { name: string; detail: string } {
  const at = text.indexOf(' — ');
  if (at < 0) return { name: text.trim(), detail: '' };
  return { name: text.slice(0, at).trim(), detail: text.slice(at + 3).trim() };
}

export function buildTraits(pacts: string[] = [], relicSynergies: string[] = [], skillSynergies: string[] = []): Trait[] {
  const toTraits = (kind: TraitKind, texts: string[], fallback: string): Trait[] =>
    texts.map((text) => {
      const { name, detail } = splitTrait(text);
      return { kind, name, detail: detail || fallback };
    });
  return [
    ...toTraits('pact', pacts, '스스로 건 제약. 제약마다 점수 보너스가 붙는다.'),
    ...toTraits('relic', relicSynergies, ''),
    ...toTraits('skill', skillSynergies, ''),
  ];
}

/**
 * 칩이 많으면 앞의 limit개만 보이고 나머지는 접는다.
 * 딱 하나만 접히는 경우는 접지 않는다 ("+1" 버튼이 칩 하나와 같은 자리를 차지하므로 의미가 없다).
 */
export function foldTraits<T>(items: T[], limit: number, expanded: boolean): { visible: T[]; hidden: number } {
  if (expanded || items.length <= limit + 1) return { visible: items, hidden: 0 };
  return { visible: items.slice(0, limit), hidden: items.length - limit };
}
