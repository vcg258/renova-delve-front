import { afterEach, describe, expect, it, vi } from 'vitest';
import { getScene, resetScene, setScene, subscribe } from './scene';

/**
 * 배경 장면 스토어. 전역 가변 상태이므로 "게임 화면을 나가면 메뉴 장면으로 돌아간다"가 깨지지 않게 고정한다.
 * useScene은 React 훅이라 여기서는 구독 통지만 확인한다 (스토어는 useSyncExternalStore로 읽는다).
 */
describe('scene store', () => {
  afterEach(() => resetScene());

  it('같은 장면을 다시 넣으면 구독자를 깨우지 않는다', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    setScene({ stage: 3, faction: 'ABYSS', boss: false, rest: false });
    setScene({ stage: 3, faction: 'ABYSS', boss: false, rest: false });
    expect(listener).toHaveBeenCalledTimes(1);

    setScene({ stage: 3, faction: 'ABYSS', boss: true, rest: false });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('resetScene은 메뉴 장면으로 되돌린다', () => {
    setScene({ stage: 5, faction: 'HEAVEN', boss: true, rest: false });
    resetScene();
    expect(getScene()).toEqual({ stage: 0, faction: null, boss: false, rest: false });
  });

  it('구독을 해제하면 더는 통지받지 않는다', () => {
    const listener = vi.fn();
    subscribe(listener)();

    setScene({ stage: 2, faction: null, boss: false, rest: true });
    expect(listener).not.toHaveBeenCalled();
  });
});
