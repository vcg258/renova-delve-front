// 백엔드 DTO 미러 타입

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'HELL';
export type Phase = 'NONE' | 'EXPLORE' | 'BATTLE' | 'ENCOUNTER' | 'REWARD' | 'SHOP' | 'GAMEOVER' | 'CLEAR';
export type NodeType = 'BATTLE' | 'ELITE' | 'BOSS' | 'ENCOUNTER';
export type ItemType = 'WEAPON' | 'ARMOR' | 'HELMET' | 'SKILL' | 'RELIC' | 'CONSUMABLE' | 'SKIP';

export interface MemberInfo {
  memberId: number;
  loginId: string;
  createdAt?: string;
}

export interface WeaponDTO {
  weaponId: number;
  name: string;
  type: string;
  atkBonus: number;
  specialEffect: number;
  scoreCost: number;
  description: string;
}

export interface ArmorDTO {
  armorId: number;
  name: string;
  type: string;
  defBonus: number;
  specialEffect: number;
  scoreCost: number;
  description: string;
}

export interface HelmetDTO {
  helmetId: number;
  name: string;
  type: string;
  hpBonus: number;
  specialEffect: number;
  scoreCost: number;
  description: string;
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
}

export interface RelicDTO {
  relicId: number;
  name: string;
  effectDesc: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC';
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
  budget: number;
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
  relicSynergies?: string[]; // 발동 중인 유물 조합 시너지
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
}

export interface EncounterInfo {
  text: string;
  choices: string[];
}

export interface NodeInfo {
  nodeType: NodeType;
  story: string;
  monsters: BattleMonster[] | null;
  encounter: EncounterInfo | null;
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
}

export interface GameSummary {
  cleared: boolean;
  score: number;
  gold: number;
  stage: number;
  node: number;
  level: number;
  narrative: string;
}

export interface GameView {
  phase: Phase;
  status: StatusDTO | null;
  node: NodeInfo | null;
  reward: RewardView | null;
  shop: ShopItem[] | null;
  summary: GameSummary | null;
}

export interface TurnResult {
  result: 'WIN' | 'LOSE' | 'CONTINUE';
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
