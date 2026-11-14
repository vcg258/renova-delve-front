import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChapterView } from './ChroniclePage';
import type { ChronicleChapter } from '../api/types';

const chapter = (overrides: Partial<ChronicleChapter> = {}): ChronicleChapter => ({
  chapterNo: 3, title: '금화를 쥔 손', body: '그는 금화를 쥐었다.', cleared: false, stage: 2, node: 7,
  faction: 'ABYSS', difficulty: 'HARD', createdAt: '2026-11-15T03:00:00', ...overrides,
});

describe('연대기의 장', () => {
  it('장 번호·제목·본문과 서버가 정한 사실(난이도, 쓰러진 자리, 세력)을 보여 준다', () => {
    const html = renderToStaticMarkup(<ChapterView chapter={chapter()} />);
    expect(html).toContain('제3장');
    expect(html).toContain('금화를 쥔 손');
    expect(html).toContain('그는 금화를 쥐었다.');
    expect(html).toContain('2026-11-15');
    expect(html).toContain('어려움');
    expect(html).toContain('스테이지 2-7에서 쓰러졌다');
    expect(html).toContain('마계에 기울었다');
  });

  it('클리어한 장은 결말을 다르게 쓰고, 세력이 없으면 생략한다', () => {
    const html = renderToStaticMarkup(<ChapterView chapter={chapter({ cleared: true, faction: null })} />);
    expect(html).toContain('왕을 쓰러뜨렸다');
    expect(html).not.toContain('기울었다');
    expect(html).toContain('cleared');
  });
});
