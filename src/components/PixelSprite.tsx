import { memo, useMemo } from 'react';
import spriteData from '../sprites/sprites.json';

interface SpriteDef {
  rows: string[];
  palette: Record<string, string>;
  variants: Record<string, Record<string, string>>;
}

const SPRITES = spriteData as unknown as Record<string, SpriteDef>;

/** 스프라이트 지정자. "knight" 또는 "knight:ghost"(팔레트 변형) 형태 */
export type SpriteKey = string;

interface Props {
  sprite: SpriteKey;
  /** 화면에 그릴 한 변의 길이(px). 16의 배수일 때 도트가 가장 또렷하다 */
  size?: number;
  className?: string;
  title?: string;
}

interface Run {
  x: number;
  y: number;
  width: number;
  color: string;
}

/**
 * 16x16 도트 스프라이트를 SVG로 그린다.
 * 같은 색이 가로로 이어지는 칸은 하나의 rect로 합쳐 DOM 노드 수를 줄인다.
 * (이미지 파일 없이 JSON 데이터만으로 그리므로 팔레트만 바꿔 변형 몬스터를 만들 수 있다)
 */
function buildRuns(def: SpriteDef, variant?: string): Run[] {
  const palette = variant && def.variants[variant] ? { ...def.palette, ...def.variants[variant] } : def.palette;
  const runs: Run[] = [];
  def.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const color = ch === '.' ? null : palette[ch];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      // 8자리 hex의 알파가 00이면 "이 변형에서는 그리지 않는 칸"
      if (color && !(color.length === 9 && color.endsWith('00'))) {
        runs.push({ x, y, width: end - x, color });
      }
      x = end;
    }
  });
  return runs;
}

function PixelSprite({ sprite, size = 64, className, title }: Props) {
  const [name, variant] = sprite.split(':');
  const def = SPRITES[name] ?? SPRITES.imp;
  const runs = useMemo(() => buildRuns(def, variant), [def, variant]);

  return (
    <svg
      className={`pixel-sprite ${className ?? ''}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? name}
    >
      {title && <title>{title}</title>}
      {runs.map((run) => (
        <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.width} height={1} fill={run.color} />
      ))}
    </svg>
  );
}

export default memo(PixelSprite);
