import { toByteArray } from 'base64-js';
import jpeg from 'jpeg-js';
import type { StickerShape } from '@shared/scanner/geometry';
import type { RGB } from '@shared/scanner/sampling';

export function sampleJpeg(base64: string, shapes: StickerShape[]): RGB[] {
  const decoded = jpeg.decode(toByteArray(base64), { useTArray: true, formatAsRGBA: true });
  if (!decoded?.data?.length) throw new Error('The captured photo could not be decoded.');
  const { width, height, data } = decoded; const cropSide = Math.min(width, height); const cropX = (width - cropSide) / 2; const cropY = (height - cropSide) / 2; const half = Math.max(2, Math.round(cropSide * 0.018));
  return shapes.map(({ cx, cy }) => { const px = Math.round(cropX + cx * cropSide); const py = Math.round(cropY + cy * cropSide); let r = 0; let g = 0; let b = 0; let count = 0; for (let y = Math.max(0, py - half); y <= Math.min(height - 1, py + half); y++) { for (let x = Math.max(0, px - half); x <= Math.min(width - 1, px + half); x++) { const index = (y * width + x) * 4; r += data[index]; g += data[index + 1]; b += data[index + 2]; count++; } } return { r: r / count, g: g / count, b: b / count }; });
}
