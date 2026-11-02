import { FilterDefinition, FilterId } from '../types/photobooth';

export const FILTERS: FilterDefinition[] = [
  {
    id: 'normal',
    name: 'Bình Thường',
    subtitle: 'Trong trẻo tự nhiên',
    cssFilter: 'none',
    badgeColor: '#7FFFD4',
  },
  {
    id: 'mono',
    name: 'Mono (Retro)',
    subtitle: 'Film hoài cổ ấm',
    cssFilter: 'sepia(0.38) contrast(1.08) brightness(0.98) saturate(0.75)',
    overlayColor: 'rgba(218, 185, 130, 0.14)',
    vignette: 0.22,
    grain: 0.09,
    badgeColor: '#f6ad55',
  },
  {
    id: 'bw',
    name: 'Đen Trắng',
    subtitle: 'Tương phản nghệ thuật',
    cssFilter: 'grayscale(1) contrast(1.26) brightness(1.03)',
    vignette: 0.25,
    grain: 0.06,
    badgeColor: '#cbd5e0',
  },
  {
    id: 'soft',
    name: 'Mềm Mại',
    subtitle: 'Sáng mịn dịu da',
    cssFilter: 'brightness(1.09) contrast(0.93) saturate(1.06)',
    overlayColor: 'rgba(255, 240, 248, 0.12)',
    softGlow: true,
    badgeColor: '#fbb6ce',
  },
  {
    id: 'dazz_classic',
    name: 'Dazz Classic',
    subtitle: 'Tông ấm hạt film',
    cssFilter: 'contrast(1.14) saturate(1.18) sepia(0.22) brightness(0.99)',
    overlayColor: 'rgba(255, 170, 90, 0.12)',
    vignette: 0.28,
    grain: 0.14,
    badgeColor: '#f6e05e',
  },
  {
    id: 'dazz_instant',
    name: 'Dazz Instant',
    subtitle: 'Ảnh lấy liền xanh mát',
    cssFilter: 'brightness(1.06) contrast(1.08) saturate(1.12) hue-rotate(-6deg)',
    overlayColor: 'rgba(127, 255, 212, 0.14)',
    vignette: 0.16,
    grain: 0.05,
    badgeColor: '#4299e1',
  },
];

export function getFilterById(id: FilterId): FilterDefinition {
  return FILTERS.find((f) => f.id === id) || FILTERS[0];
}

/**
 * Shared non-destructive crop/pan/zoom geometry calculator
 * Ensures 100% identical alignment between DOM preview and High-DPI Canvas Export
 */
export function computePhotoTransform(
  naturalWidth: number,
  naturalHeight: number,
  slotWidth: number,
  slotHeight: number,
  panX: number,
  panY: number,
  zoom: number
): {
  drawWidth: number;
  drawHeight: number;
  drawX: number;
  drawY: number;
  maxPanPxX: number;
  maxPanPxY: number;
} {
  const safeImgW = Math.max(1, naturalWidth);
  const safeImgH = Math.max(1, naturalHeight);
  const imgAspect = safeImgW / safeImgH;
  const slotAspect = slotWidth / slotHeight;

  let baseWidth: number;
  let baseHeight: number;

  if (imgAspect > slotAspect) {
    baseHeight = slotHeight;
    baseWidth = slotHeight * imgAspect;
  } else {
    baseWidth = slotWidth;
    baseHeight = slotWidth / imgAspect;
  }

  const clampedZoom = Math.max(1, Math.min(3, zoom));
  const drawWidth = baseWidth * clampedZoom;
  const drawHeight = baseHeight * clampedZoom;

  // Allow panning across any overflow + small extra slack if needed
  const maxPanPxX = Math.max((drawWidth - slotWidth) / 2, slotWidth * 0.25);
  const maxPanPxY = Math.max((drawHeight - slotHeight) / 2, slotHeight * 0.25);

  const clampedPanX = Math.max(-1, Math.min(1, panX));
  const clampedPanY = Math.max(-1, Math.min(1, panY));

  const centerOffsetX = clampedPanX * maxPanPxX;
  const centerOffsetY = clampedPanY * maxPanPxY;

  const drawX = (slotWidth - drawWidth) / 2 + centerOffsetX;
  const drawY = (slotHeight - drawHeight) / 2 + centerOffsetY;

  return {
    drawWidth,
    drawHeight,
    drawX,
    drawY,
    maxPanPxX,
    maxPanPxY,
  };
}

/**
 * Pixel-level color filter processor on an offscreen slot canvas so filters work identically
 * across all browsers including iOS Safari where ctx.filter can be ignored.
 */
export function applyPixelFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterId: FilterId
): void {
  if (filterId === 'normal') return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const filterDef = getFilterById(filterId);
  const grainAmount = (filterDef.grain || 0) * 255;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (filterId === 'bw') {
      // High contrast B&W
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrasted = (lum - 128) * 1.26 + 128 + 4;
      r = g = b = contrasted;
    } else if (filterId === 'mono') {
      // Retro warm film
      const avg = 0.299 * r + 0.587 * g + 0.114 * b;
      // Blend 28% desaturated + warm sepia tone
      r = r * 0.65 + avg * 0.35 + 18;
      g = g * 0.65 + avg * 0.35 + 8;
      b = b * 0.62 + avg * 0.38 - 14;
      // Mild contrast
      r = (r - 128) * 1.07 + 128;
      g = (g - 128) * 1.06 + 128;
      b = (b - 128) * 1.02 + 128;
    } else if (filterId === 'soft') {
      // Bright, soft pastel skin tone lift
      r = r * 1.07 + 10;
      g = g * 1.06 + 8;
      b = b * 1.06 + 10;
      // Slightly soften shadows
      r = (r - 128) * 0.93 + 132;
      g = (g - 128) * 0.93 + 131;
      b = (b - 128) * 0.94 + 133;
    } else if (filterId === 'dazz_classic') {
      // Warm classic film with lifted shadows & amber highlights
      r = (r - 128) * 1.15 + 128 + 14;
      g = (g - 128) * 1.11 + 128 + 5;
      b = (b - 128) * 1.04 + 128 - 12;
    } else if (filterId === 'dazz_instant') {
      // Crisp cool-aqua instant film
      r = (r - 128) * 1.06 + 128 + 2;
      g = (g - 128) * 1.09 + 128 + 10;
      b = (b - 128) * 1.12 + 128 + 14;
    }

    // Add organic film grain if configured
    if (grainAmount > 0) {
      const noise = (Math.random() - 0.5) * grainAmount;
      r += noise;
      g += noise;
      b += noise;
    }

    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }

  ctx.putImageData(imgData, 0, 0);

  // Soft glow bloom pass for 'soft'
  if (filterDef.softGlow) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }

  // Vignette pass if configured
  if (filterDef.vignette && filterDef.vignette > 0) {
    ctx.save();
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy);
    const grad = ctx.createRadialGradient(cx, cy, maxR * 0.45, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(10, 14, 26, ${filterDef.vignette})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

