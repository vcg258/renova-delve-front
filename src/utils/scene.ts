import { useSyncExternalStore } from 'react';
import type { Faction } from '../api/types';

/**
 * 배경(AtmosphereFX)이 그릴 장면.
 *
 * 배경은 라우터 바깥에 한 번만 마운트되므로, 게임 화면이 "지금 어디까지 내려왔는지"를
 * 이 작은 스토어에 적어 두고 배경이 구독한다. (Context를 쓰면 App 전체가 다시 그려진다)
 */
export interface Scene {
  /** 0 = 게임 밖(메뉴), 1~5 = 진행 중인 스테이지. 깊어질수록 하늘이 가려지고 마계의 문이 커진다 */
  stage: number;
  /** 가호가 붙은 세력. 배경의 빛·불씨·창불이 그쪽으로 기운다 */
  faction: Faction | null;
  /** 보스전: 마계의 문이 맥동한다 */
  boss: boolean;
  /** 모닥불: 성문 앞에 불이 켜진다 */
  rest: boolean;
}

const MENU_SCENE: Scene = { stage: 0, faction: null, boss: false, rest: false };

let current: Scene = MENU_SCENE;
const listeners = new Set<() => void>();

export function setScene(next: Scene) {
  if (next.stage === current.stage && next.faction === current.faction
    && next.boss === current.boss && next.rest === current.rest) return;
  current = next;
  listeners.forEach((listener) => listener());
}

export function resetScene() {
  setScene(MENU_SCENE);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getScene(): Scene {
  return current;
}

export function useScene(): Scene {
  return useSyncExternalStore(subscribe, getScene);
}
