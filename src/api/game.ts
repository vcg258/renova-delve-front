import { api } from './client';
import type {
  CatalogTotals,
  Difficulty, EncounterOutcome, Encyclopedia, GameHistory, GameSummary, GameView, ItemType,
  Achievement, ChronicleChapter, KingdomInfo, NodeInfo, WraithInfo, PathChoice, RankingRow, RestChoice, RunReview, SetupOptions, ShopItem, StatusDTO, TurnResult,
} from './types';

export async function getSetupOptions(): Promise<SetupOptions> {
  return (await api.get<SetupOptions>('/game/options')).data;
}

/** 왕국의 저울: 지금의 정세 */
export async function getKingdom(): Promise<KingdomInfo> {
  return (await api.get<KingdomInfo>('/game/kingdom')).data;
}

/** 레노바 연대기 전체, 1장부터 */
export async function getChronicle(): Promise<ChronicleChapter[]> {
  return (await api.get<ChronicleChapter[]>('/game/chronicle')).data;
}

/** 기다리는 망령이 없으면 서버가 204를 돌려준다 */
export async function getWraith(): Promise<WraithInfo | null> {
  const res = await api.get<WraithInfo | ''>('/game/wraith');
  return res.status === 204 || !res.data ? null : res.data;
}

export interface NewGamePayload {
  difficulty: Difficulty;
  weaponId: number | null;
  armorId: number | null;
  helmetId: number | null;
  skillIds: number[];
  relicIds: number[];
  pacts: string[];
}

export async function newGame(payload: NewGamePayload): Promise<GameView> {
  return (await api.post<GameView>('/game/new', payload)).data;
}

export async function getCurrentGame(): Promise<GameView> {
  return (await api.get<GameView>('/game/current')).data;
}

/** 걸린 악마의 계약을 파기한다 (천상 성향 3 이상, 골드를 바친다, 탐험 중에만) */
export async function breakContract(): Promise<GameView> {
  return (await api.post<GameView>('/game/contract/break')).data;
}

export async function abandonGame(): Promise<void> {
  await api.post('/game/abandon');
}

export async function nextNode(path: PathChoice = 'SAFE'): Promise<NodeInfo> {
  return (await api.post<NodeInfo>('/game/next', { path })).data;
}

/** 모닥불 선택 (보스 처치 후) */
export async function chooseRest(choice: RestChoice): Promise<GameView> {
  return (await api.post<GameView>('/game/rest', { choice })).data;
}

export async function getAchievements(): Promise<Achievement[]> {
  return (await api.get<Achievement[]>('/member/achievements')).data;
}

/** 상점 재입고 (골드 소모, 횟수마다 비용 상승) */
export async function rerollShop(): Promise<GameView> {
  return (await api.post<GameView>('/game/shop/reroll')).data;
}

/** AI 런 회고. 생성할 수 없으면(204) null */
export async function getRunReview(): Promise<RunReview | null> {
  const res = await api.get<RunReview>('/game/review');
  return res.status === 204 || !res.data ? null : res.data;
}

export async function useSkill(slotId: number, targetKeys: number[]): Promise<TurnResult> {
  return (await api.post<TurnResult>('/game/battle/skill', { slotId, targetKeys })).data;
}

/** 방어 태세: 공격하지 않고 이번 턴 받는 피해를 줄인다 */
export async function guardTurn(): Promise<TurnResult> {
  return (await api.post<TurnResult>('/game/battle/guard')).data;
}

/** 숨 고르기: 모든 스킬이 쿨타임일 때만. 피해는 그대로 받고 쿨타임이 2턴 줄어든다 */
export async function passTurn(): Promise<TurnResult> {
  return (await api.post<TurnResult>('/game/battle/pass')).data;
}

/** 도망치기: 보상 없이 전투를 끝낸다. 적이 한 번 공격하며 보스전에서는 거부된다 */
export async function fleeBattle(): Promise<TurnResult> {
  return (await api.post<TurnResult>('/game/battle/flee')).data;
}

/** 스킬 버리기 (전투·조우 중에는 거부된다) */
export async function discardSkill(slotId: number): Promise<StatusDTO> {
  return (await api.post<StatusDTO>('/game/skill/discard', { slotId })).data;
}

export async function useConsumable(inventorySlotId: number): Promise<TurnResult> {
  return (await api.post<TurnResult>('/game/battle/consumable', { inventorySlotId })).data;
}

export async function chooseEncounter(choiceIndex: number): Promise<EncounterOutcome> {
  return (await api.post<EncounterOutcome>('/game/encounter', { choiceIndex })).data;
}

/** replaceSlotId: 스킬 슬롯이 가득 찼을 때 버릴 슬롯 */
export async function selectReward(itemType: ItemType, itemId: number | null, replaceSlotId: number | null = null): Promise<StatusDTO> {
  return (await api.post<StatusDTO>('/game/reward', { itemType, itemId, replaceSlotId })).data;
}

export async function getShop(): Promise<ShopItem[]> {
  return (await api.get<ShopItem[]>('/game/shop')).data;
}

export async function buyItem(itemType: string, itemId: number, replaceSlotId: number | null = null): Promise<StatusDTO> {
  return (await api.post<StatusDTO>('/game/shop/buy', { itemType, itemId, replaceSlotId })).data;
}

export async function leaveShop(): Promise<GameView> {
  return (await api.post<GameView>('/game/shop/leave')).data;
}

export async function getSummary(): Promise<GameSummary> {
  return (await api.get<GameSummary>('/game/summary')).data;
}

export async function getRanking(difficulty: Difficulty): Promise<RankingRow[]> {
  return (await api.get<RankingRow[]>('/ranking', { params: { difficulty } })).data;
}

export async function getCollection(): Promise<Encyclopedia> {
  return (await api.get<Encyclopedia>('/collection')).data;
}

/** 도감 분류별 전체 항목 수 (미발견 칸과 수집률 표시용) */
export async function getCatalogTotals(): Promise<CatalogTotals> {
  return (await api.get<CatalogTotals>('/collection/totals')).data;
}

export async function getHistory(): Promise<GameHistory[]> {
  return (await api.get<GameHistory[]>('/member/history')).data;
}

/** 서버에 저장된 AI 안내자 대화 기록 삭제 */
export async function clearGuideHistory(): Promise<void> {
  await api.delete('/rag/history');
}

export async function askGuide(question: string): Promise<string> {
  const res = await api.post<{ answer: string }>('/rag', { question });
  return res.data.answer;
}
