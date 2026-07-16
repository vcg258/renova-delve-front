import { api } from './client';
import type {
  Difficulty, EncounterOutcome, Encyclopedia, GameSummary, GameView, ItemType,
  NodeInfo, RankingRow, SetupOptions, ShopItem, StatusDTO, TurnResult,
} from './types';

export async function getSetupOptions(): Promise<SetupOptions> {
  return (await api.get<SetupOptions>('/game/options')).data;
}

export interface NewGamePayload {
  difficulty: Difficulty;
  weaponId: number | null;
  armorId: number | null;
  helmetId: number | null;
  skillIds: number[];
  relicIds: number[];
}

export async function newGame(payload: NewGamePayload): Promise<GameView> {
  return (await api.post<GameView>('/game/new', payload)).data;
}

export async function getCurrentGame(): Promise<GameView> {
  return (await api.get<GameView>('/game/current')).data;
}

export async function abandonGame(): Promise<void> {
  await api.post('/game/abandon');
}

export async function nextNode(): Promise<NodeInfo> {
  return (await api.post<NodeInfo>('/game/next')).data;
}

export async function useSkill(slotId: number, targetKeys: number[]): Promise<TurnResult> {
  return (await api.post<TurnResult>('/game/battle/skill', { slotId, targetKeys })).data;
}

export async function useConsumable(inventorySlotId: number): Promise<TurnResult> {
  return (await api.post<TurnResult>('/game/battle/consumable', { inventorySlotId })).data;
}

export async function chooseEncounter(choiceIndex: number): Promise<EncounterOutcome> {
  return (await api.post<EncounterOutcome>('/game/encounter', { choiceIndex })).data;
}

export async function selectReward(itemType: ItemType, itemId: number | null): Promise<StatusDTO> {
  return (await api.post<StatusDTO>('/game/reward', { itemType, itemId })).data;
}

export async function getShop(): Promise<ShopItem[]> {
  return (await api.get<ShopItem[]>('/game/shop')).data;
}

export async function buyItem(itemType: string, itemId: number): Promise<StatusDTO> {
  return (await api.post<StatusDTO>('/game/shop/buy', { itemType, itemId })).data;
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

export async function askGuide(question: string): Promise<string> {
  const res = await api.post<{ answer: string }>('/rag', { question });
  return res.data.answer;
}
