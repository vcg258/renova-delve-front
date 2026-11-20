import { describe, expect, it } from 'vitest';
import { rarityClass, rarityKind } from './rarity';

describe('rarity', () => {
  it('등급 클래스', () => {
    expect(rarityClass('EPIC')).toBe('rarity-epic');
    expect(rarityClass(null)).toBe('');
    expect(rarityClass(undefined)).toBe('');
  });

  it('등급과 종류를 잇는 머리말, 등급이 없으면 종류만', () => {
    expect(rarityKind('스킬', 'RARE')).toBe('희귀한 스킬');
    expect(rarityKind('소모품', null)).toBe('소모품');
  });
});
