import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StatusBar from './StatusBar';
import type { StatusDTO } from '../api/types';

/** 상태 바가 내놓는 마크업 검사 (브라우저 없이 문자열로 렌더링한다. 배치·겹침 같은 시각 요소는 여기서 볼 수 없다) */

const tiers = (label: string) => [1, 2, 3].map((tier) => ({
  tier, requiredScore: tier * 3, description: `${label} ${tier}단계 — 효과 ${tier}`,
}));

function status(overrides: Partial<StatusDTO> = {}): StatusDTO {
  return {
    stateDTO: {
      gameStateId: 1, difficulty: 'EASY', isActive: true, currentStage: 1, currentNodeId: 3,
      score: 120, gold: 45, startingPoints: 0, hasPhoenix: false,
    },
    characterDTO: { characterId: 1, level: 2, currentExp: 10, currentHp: 40, maxHp: 60, attack: 12, defense: 4 },
    consumableInventoryDTO: [],
    equipmentDTO: null,
    relicInventoryDTO: [],
    skillSlotDTO: [],
    relicSynergies: [],
    skillSynergies: [],
    pacts: [],
    alignment: {
      heaven: 1, abyss: 6, human: 2, dominant: 'ABYSS', tier: 2, nextTierAt: 9,
      blessing: '마계의 낙인 2단계 — 공격력 +18%, 대신 받는 피해 +12%',
      factions: [
        { code: 'HEAVEN', label: '천상', tendency: '질서와 자비.', tiers: tiers('천상의 가호'), devotion: '성향 12를 넘긴 뒤에는 고를 때마다 최대 HP +6' },
        { code: 'ABYSS', label: '마계', tendency: '욕망과 거래.', tiers: tiers('마계의 낙인') },
        { code: 'HUMAN', label: '인간', tendency: '의지와 실리.', tiers: tiers('인간의 의지') },
      ],
    },
    ...overrides,
  };
}

describe('StatusBar', () => {
  it('세력 설명은 title 속성이 아니라 말풍선(role=tooltip)으로 들어간다', () => {
    const html = renderToStaticMarkup(<StatusBar status={status()} />);

    expect(html).toContain('role="tooltip"');
    expect(html).toContain('욕망과 거래.');
    expect(html).toContain('마계의 낙인 3단계 — 효과 3');
    expect(html).not.toMatch(/alignment-pip[^>]*title=/);
    // 가호가 붙은 세력의 현재 단계만 강조된다
    expect(html.match(/tip-tier active/g)).toHaveLength(1);
  });

  it('세력 말풍선 끝에 서버가 보낸 헌신 보상이 붙는다 (없으면 생략)', () => {
    const html = renderToStaticMarkup(<StatusBar status={status()} />);

    expect(html).toContain('헌신: 성향 12를 넘긴 뒤에는 고를 때마다 최대 HP +6');
    expect(html.match(/헌신: /g)).toHaveLength(1);
  });

  it('가호 칩에는 이름만 쓰고, 효과와 다음 단계는 말풍선에 넣는다', () => {
    const html = renderToStaticMarkup(<StatusBar status={status()} />);

    expect(html).toMatch(/blessing-chip abyss[^>]*>마계의 낙인 2단계</);
    expect(html).toContain('공격력 +18%, 대신 받는 피해 +12%');
    expect(html).toContain('성향 9에 닿으면');
  });

  it('서약·유물 조합·스킬 조합이 한 줄에 종류별 칩으로 놓인다', () => {
    const html = renderToStaticMarkup(<StatusBar status={status({
      pacts: ['옅은 피'],
      relicSynergies: ['피의 사냥 — 치명타 시 출혈 2스택 부여 (핏빛 반지 + 사냥꾼의 눈)'],
      skillSynergies: ['휩쓸기 — 전체 공격 스킬 피해 +10% (전체 공격 스킬 2개 이상)'],
    })} />);

    expect(html).toContain('trait-chip pact');
    expect(html).toContain('trait-chip relic');
    expect(html).toContain('trait-chip skill');
    expect(html).toContain('치명타 시 출혈 2스택 부여');
    expect(html).not.toContain('더 보기');
  });

  it('칩이 많으면 6개만 보이고 나머지는 접힌다', () => {
    const many = Array.from({ length: 9 }, (_, i) => `조합${i} — 설명${i}`);
    const html = renderToStaticMarkup(<StatusBar status={status({ relicSynergies: many, skillSynergies: ['휩쓸기 — 설명'] })} />);

    expect(html.match(/trait-chip /g)).toHaveLength(6);
    expect(html).toContain('+4 더 보기');
  });

  it('성향 정보가 없는 구버전 응답에서도 깨지지 않는다', () => {
    const html = renderToStaticMarkup(<StatusBar status={status({ alignment: undefined, skillSynergies: undefined })} />);

    expect(html).toContain('status-bar');
    expect(html).not.toContain('trait-panel');
  });
});

describe('StatusBar 악마의 계약', () => {
  it('계약이 걸려 있으면 혜택 이름 칩과 작은 글씨 말풍선을 보여 준다 (조항 이름은 서버가 보내지 않는다)', () => {
    const html = renderToStaticMarkup(<StatusBar status={status({
      contract: { boon: '황금', hint: '세 걸음 뒤, 빚을 받으러 온다.', breakable: false, breakCost: 160 },
    })} />);
    expect(html).toContain('계약: 황금');
    expect(html).toContain('세 걸음 뒤, 빚을 받으러 온다.');
    expect(html).toContain('천상 성향 3 이상이면 골드 160');
  });

  it('계약이 없으면 칩이 없다', () => {
    const html = renderToStaticMarkup(<StatusBar status={status({ contract: null })} />);
    expect(html).not.toContain('계약:');
  });
});

describe('StatusBar 왕국의 정세', () => {
  it('원정에 고정된 정세가 있으면 칩과 효과 말풍선을 보여 준다', () => {
    const html = renderToStaticMarkup(<StatusBar status={status({ kingdom: '넓어지는 문', kingdomEffects: ['적 공격력 +10%', '전투 골드 +20%'] })} />);
    expect(html).toContain('넓어지는 문');
    expect(html).toContain('적 공격력 +10%, 전투 골드 +20%');
  });
});
