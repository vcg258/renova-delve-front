import { describe, expect, it } from 'vitest';
import { fitPlacement } from './HoverTip';

const viewport = { width: 400, height: 600 };

describe('말풍선 위치 자동 조정', () => {
  it('오른쪽으로 넘치면 오른쪽 정렬로 옮긴다', () => {
    expect(fitPlacement({ left: 300, right: 460, top: 100, bottom: 160 }, viewport, { align: 'center', side: 'bottom' }))
      .toEqual({ align: 'right', side: 'bottom' });
  });

  it('왼쪽으로 넘치면 왼쪽 정렬로 옮긴다', () => {
    expect(fitPlacement({ left: -20, right: 140, top: 100, bottom: 160 }, viewport, { align: 'center', side: 'bottom' }))
      .toEqual({ align: 'left', side: 'bottom' });
  });

  it('아래가 모자라고 위에 자리가 있으면 위로 띄운다', () => {
    expect(fitPlacement({ left: 100, right: 200, top: 520, bottom: 640 }, viewport, { align: 'center', side: 'bottom' }))
      .toEqual({ align: 'center', side: 'top' });
  });

  it('넘치지 않으면 그대로 둔다', () => {
    expect(fitPlacement({ left: 100, right: 200, top: 100, bottom: 160 }, viewport, { align: 'left', side: 'bottom' }))
      .toEqual({ align: 'left', side: 'bottom' });
  });
});
