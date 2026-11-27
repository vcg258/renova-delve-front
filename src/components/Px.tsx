import PixelSprite, { type SpriteKey } from './PixelSprite';

/**
 * 글줄 안에 넣는 작은 도트 아이콘. (이모지 대신 사용)
 * size는 16의 배수일 때 가장 또렷하다.
 */
export default function Px({ s, size = 16, title }: { s: SpriteKey; size?: number; title?: string }) {
  return <PixelSprite sprite={s} size={size} className="px" title={title} />;
}
