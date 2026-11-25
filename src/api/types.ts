// 백엔드 DTO 미러 타입

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'HELL';
export type Phase = 'NONE' | 'EXPLORE' | 'BATTLE' | 'ENCOUNTER' | 'REWARD' | 'SHOP' | 'REST' | 'GAMEOVER' | 'CLEAR';
export type NodeType = 'BATTLE' | 'ELITE' | 'BOSS' | 'ENCOUNTER' | 'WRAITH' | 'CONTRACT';

/** 원정에 걸린 악마의 계약. 조항은 서버만 알고, 화면에는 서명 전에 본 작은 글씨만 온다 */
export interface ContractInfo {
  boon: string;        // 받은 혜택 이름
  hint: string;        // 조항의 작은 글씨
  breakable: boolean;  // 지금 파기할 수 있는가 (천상 성향 3 이상 + 골드)
  breakCost: number;
}

/** 다음 원정에서 기다리는 전생의 망령 (GET /game/wraith) */
export interface WraithInfo {
  stage: number;
  level: number;
  killerName: string | null;
  skills: string[];
  faction: 'HEAVEN' | 'ABYSS' | 'HUMAN' | null;
  escapesLeft: number;
}
export type ItemType = 'WEAPON' | 'ARMOR' | 'HELMET' | 'SKILL' | 'RELIC' | 'CONSUMABLE' | 'SKIP';

export type Role = 'USER' | 'ADMIN';
export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

export interface MemberInfo {
  memberId: number;
  loginId: string;
  nickname: string;
  name?: string | null;    // 등록하지 않았으면 null (이름·이메일 수집 이전에 가입한 계정)
  email?: string | null;   // 등록하지 않았으면 아이디 찾기 / 비밀번호 찾기를 쓸 수 없다
  hasPassword?: boolean;   // 소셜 로그인 계정은 false
  role: Role;
  status: MemberStatus;
  lastLoginAt: string | null;
  createdAt: string;
  collectionCount: number;
  bestScore: number;
}

export interface MemberSummary {
  memberId: number;
  loginId: string;
  nickname: string;
  role: Role;
  status: MemberStatus;
  statusReason: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  playing: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  withdrawnMembers: number;
  newMembersLast7Days: number;
  activeGames: number;
  totalGamesPlayed: number;
  clearedGames: number;
  gamesByDifficulty: Record<string, number>;
  topRankings: RankingRow[];
}

export interface WeaponDTO {
  weaponId: number;
  name: string;
  type: string;
  atkBonus: number;
  specialEffect: number;
  scoreCost: number;
  description: string;
  rarity?: Rarity; // 등급 (서버 v0.12.0부터)
}

export interface ArmorDTO {
  armorId: number;
  name: string;
  type: string;
  defBonus: number;
  specialEffect: number;
  scoreCost: number;
  description: string;
  rarity?: Rarity; // 등급 (서버 v0.12.0부터)
}

export interface HelmetDTO {
  helmetId: number;
  name: string;
  type: string;
  hpBonus: number;
  specialEffect: number;
  scoreCost: number;
  description: string;
  rarity?: Rarity; // 등급 (서버 v0.12.0부터)
}

export interface SkillInfo {
  skillId: number;
  name: string;
  target: 'Self' | 'EnemySingle' | 'EnemyAll';
  attackCount: number;
  coefficient: number;
  cost: number;
  cooldown: number;
  statusEffect: number;
  effectStack: number;
  description: string;
  basic?: boolean; // 기본 공격 (서버 v0.11.0부터. 없으면 비용 0으로 판정)
  rarity?: Rarity; // 등급 (서버 v0.12.0부터)
}

export interface SkillDTO {
  name: string;
  target: 'Self' | 'EnemySingle' | 'EnemyAll';
  attackCount: number;
  coefficient: number;
  cost: number;
  cooldown: number;
  statusEffect: number;
  effectStack: number;
  description: string;
  basic?: boolean; // 기본 공격 (서버 v0.11.0부터. 없으면 비용 0으로 판정)
  rarity?: Rarity; // 등급 (서버 v0.12.0부터)
}

/** 등급. 상점과 전리품은 스테이지별 확률로 등급을 먼저 정한다 (서버 v0.12.0) */
export type Rarity = 'COMMON' | 'RARE' | 'EPIC';

export interface RelicDTO {
  relicId: number;
  name: string;
  effectDesc: string;
  rarity: Rarity;
  scoreCost: number;
}

export interface ConsumableDTO {
  consumableId: number;
  name: string;
  effectType: string;
  effectValue: number;
  scoreCost: number;
  description: string;
}

export interface SetupOptions {
  budget: number;       // 총 예산 (기본 + 도감 보너스)
  bonusBudget: number;  // 도감 수집 보너스
  pacts: PactInfo[];    // 선택 가능한 서약
  weapons: WeaponDTO[];
  armors: ArmorDTO[];
  helmets: HelmetDTO[];
  skills: SkillInfo[];
  relics: RelicDTO[];
}

export interface GameStateDTO {
  gameStateId: number;
  difficulty: Difficulty;
  isActive: boolean;
  currentStage: number;
  currentNodeId: number | null;
  score: number;
  gold: number;
  startingPoints: number;
  hasPhoenix: boolean;
}

export interface CharacterDTO {
  characterId: number;
  level: number;
  currentExp: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export interface SkillSlotDTO {
  slotId: number;
  slotIndex: number;
  coolTime: number;
  skill: SkillDTO;
}

export interface ConsumableInventoryDTO {
  slotId: number;
  consumable: ConsumableDTO;
}

export interface RelicInventoryDTO {
  slotId: number;
  relic: RelicDTO;
}

export interface EquipmentDTO {
  equipId: number;
  weapon: WeaponDTO | null;
  armor: ArmorDTO | null;
  helmet: HelmetDTO | null;
}

export interface StatusDTO {
  stateDTO: GameStateDTO;
  characterDTO: CharacterDTO | null;
  consumableInventoryDTO: ConsumableInventoryDTO[];
  equipmentDTO: EquipmentDTO | null;
  relicInventoryDTO: RelicInventoryDTO[];
  skillSlotDTO: SkillSlotDTO[];
  relicSynergies?: string[]; // 발동 중인 유물 조합 시너지 ("이름 — 설명")
  skillSynergies?: string[]; // 발동 중인 스킬 조합 시너지 ("이름 — 설명")
  maxSkillSlots?: number;    // 스킬 슬롯 상한. 가득 차면 새 스킬은 기존 스킬과 교체한다
  minSlotsToDropBasic?: number; // 기본 공격을 버리거나 바꿀 수 있는 최소 스킬 수 (서버 규칙 값)
  alignment?: Alignment;     // 성향 (천상 / 마계 / 인간)
  pacts?: string[];          // 이번 원정에 건 서약 이름
  contract?: ContractInfo | null; // 걸린 악마의 계약
  kingdom?: string | null;         // 이 원정에 고정된 왕국 정세 (균형이면 null)
  kingdomEffects?: string[];
}

/** 서약: 원정 전에 스스로 거는 제약 (점수 보너스) */
export interface PactInfo {
  code: string;
  title: string;
  description: string;
  scoreBonusPercent: number;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  achieved: boolean;
}

/** 모닥불 선택 */
export type RestChoice = 'HEAL' | 'TRAIN' | 'HEAVEN' | 'ABYSS' | 'HUMAN';

export type Faction = 'HEAVEN' | 'ABYSS' | 'HUMAN';

/** 조우에서 각 세력의 방식을 택한 횟수와 발동 중인 가호 */
export interface Alignment {
  heaven: number;
  abyss: number;
  human: number;
  dominant: Faction | null;
  blessing: string | null;   // "가호 이름 n단계 — 효과"
  tier?: number;             // 가호 단계 (0 = 없음, 1~3)
  nextTierAt?: number | null; // 다음 단계에 필요한 점수
  factions?: FactionInfo[];  // 세력별 설명과 단계표 (말풍선용)
}

export interface FactionInfo {
  code: Faction;
  label: string;
  tendency: string;
  tiers: { tier: number; requiredScore: number; description: string }[];
  devotion?: string;  // 3단계를 넘긴 뒤 이 세력을 고를 때마다 받는 헌신 보상
}

export interface BattleMonster {
  key: number;
  monsterId: number;
  name: string;
  monsterType: number; // 0 일반 / 1 엘리트 / 2 보스
  maxHp: number;
  currentHp: number;
  atk: number;
  def: number;
  buffs: Record<string, number>;
  description: string;
  intent: MonsterIntent; // 이번 턴 행동 예고
  enraged: boolean;      // 보스 격노
}

export type MonsterIntent = 'ATTACK' | 'HEAVY' | 'GUARD';

/** 모험 기록 한 건 (result: 진행 중 PLAYING / 과거 기록은 null) */
export interface GameHistory {
  gameStateId: number;
  difficulty: Difficulty;
  stage: number;
  node: number;
  score: number;
  result: 'PLAYING' | 'CLEAR' | 'DEFEAT' | 'ABANDON' | null;
  startedAt: string;
  endedAt: string | null;
}

export interface EncounterInfo {
  text: string;
  choices: string[];
  factions?: (Faction | '')[]; // 각 선택지가 속한 세력 (choices와 같은 순서)
}

export interface NodeInfo {
  nodeType: NodeType;
  story: string;
  monsters: BattleMonster[] | null;
  encounter: EncounterInfo | null;
  path?: PathChoice | null;   // 이 전투에 적용된 갈림길. 조우 노드는 null
  pathNote?: string | null;   // 갈림길이 무엇을 바꿨는지(또는 왜 적용되지 않았는지)
  contractNote?: string | null; // 이번 노드에서 계약 조항이 발동했다면 그 내용
}

export interface RewardView {
  exp: number;
  gold: number;
  skills: SkillInfo[];
  relics: RelicDTO[];
  consumables: ConsumableDTO[];
}

export interface ShopItem {
  itemType: string;
  itemId: number;
  name: string;
  description: string;
  price: number;
  sold: boolean;
  bonus?: number | null;        // 장비의 능력치 보너스 (장비가 아니면 null)
  currentBonus?: number | null; // 지금 착용 중인 같은 부위 장비의 보너스
  rarity?: Rarity | null;       // 등급 (소모품은 null)
}

export interface GameSummary {
  cleared: boolean;
  score: number;
  gold: number;
  stage: number;
  node: number;
  level: number;
  narrative: string;
  stats?: RunStats; // 원정 통계 (세션이 만료되면 모두 0)
}

/** 원정 통계 (결과 화면) */
export interface RunStats {
  turns: number;
  battlesWon: number;
  battlesFled: number;
  monstersKilled: number;
  elitesKilled: number;
  bossesKilled: number;
  damageDealt: number;
  damageTaken: number;
  biggestBattle: number;
  encounters: number;
  consumablesUsed: number;
  goldFromBattles: number;
}

/** 도감 분류별 전체 항목 수 */
export type CatalogTotals = Record<'weapon' | 'armor' | 'helmet' | 'skill' | 'relic' | 'consumable', number>;

export interface GameView {
  phase: Phase;
  status: StatusDTO | null;
  node: NodeInfo | null;
  reward: RewardView | null;
  shop: ShopItem[] | null;
  summary: GameSummary | null;
  shopRerollCost: number | null; // 상점 단계일 때 다음 재입고 비용
  story?: string | null;         // 마지막 노드의 서사 (노드가 없는 단계에서 새로고침할 때 복원용)
}

/** 갈림길 선택 */
export type PathChoice = 'SAFE' | 'DANGER' | 'AMBUSH';

/** AI 런 회고 (구조화 출력) */
export interface RunReview {
  title: string;
  epitaph: string;
  analysis: string;
  tips: string[];
  chapterTitle: string | null;  // 레노바 연대기에 실린 이번 장
  chapter: string | null;
}

/** 왕국의 저울 (GET /game/kingdom): 지난 7일 동안 모든 원정자의 선택으로 정해진 정세 */
export interface KingdomInfo {
  state: 'HEAVEN_RISING' | 'ABYSS_WIDENING' | 'HUMAN_RESOLVE' | 'BALANCE';
  title: string;
  description: string;
  effects: string[];
  heaven: number;  // %
  abyss: number;
  human: number;
  players: number;
}

/** 레노바 연대기의 한 장 (GET /game/chronicle) */
export interface ChronicleChapter {
  chapterNo: number;
  title: string;
  body: string;
  cleared: boolean;
  stage: number;
  node: number;
  faction: 'HEAVEN' | 'ABYSS' | 'HUMAN' | null;
  difficulty: Difficulty;
  createdAt: string;
}

export interface TurnResult {
  result: 'WIN' | 'LOSE' | 'CONTINUE' | 'FLED'; // FLED: 도망쳐서 전투가 끝남 (보상 없음)
  log: string[];
  monsters: BattleMonster[];
  status: StatusDTO;
  reward: RewardView | null;
  cleared: boolean;
  phase: Phase;
}

export interface EncounterOutcome {
  text: string;
  status: StatusDTO;
  phase: Phase;
}

export interface RankingRow {
  rank: number;
  loginId: string;
  difficulty: Difficulty;
  bestScore: number;
  clearTime: number | null;
  achievedAt: string;
}

export interface CollectionBase {
  collectionId: number;
  acquiredAt: string;
}

export interface Encyclopedia {
  armorDTO: (CollectionBase & { armor: ArmorDTO })[];
  consumableDTO: (CollectionBase & { consumable: ConsumableDTO })[];
  helmetDTO: (CollectionBase & { helmet: HelmetDTO })[];
  relicDTO: (CollectionBase & { relic: RelicDTO })[];
  skillDTO: (CollectionBase & { skill: SkillDTO })[];
  weaponDTO: (CollectionBase & { weapon: WeaponDTO })[];
}

/** 전투 키워드 설명 (상태이상, 보스 격노). 규칙과 함께 서버가 내려준다 */
export interface BattleKeyword {
  key: string;
  label: string;
  description: string;
}
