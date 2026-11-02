import { FrameConfig, LayoutId, SlotRect, StripGeometry } from '../types/photobooth';

export interface LayoutMeta {
  id: LayoutId;
  name: string;
  shortDesc: string;
  cols: number;
  baseSlots: number;
  slotAspect: number; // width / height
  baseStripWidth: number;
  footerExtra: number;
}

export const LAYOUTS: LayoutMeta[] = [
  {
    id: '1x4',
    name: '1x4 Dải Dọc',
    shortDesc: '4 ảnh dọc cổ điển (4:3)',
    cols: 1,
    baseSlots: 4,
    slotAspect: 4 / 3,
    baseStripWidth: 320,
    footerExtra: 56,
  },
  {
    id: '2x2',
    name: '2x2 Lưới 4 Ảnh',
    shortDesc: 'Lưới 2 cột x 2 hàng (3:4)',
    cols: 2,
    baseSlots: 4,
    slotAspect: 3 / 4,
    baseStripWidth: 460,
    footerExtra: 60,
  },
  {
    id: '2x3',
    name: '2x3 Lưới 6 Ảnh',
    shortDesc: 'Lưới 2 cột x 3 hàng (3:4)',
    cols: 2,
    baseSlots: 6,
    slotAspect: 3 / 4,
    baseStripWidth: 460,
    footerExtra: 60,
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    shortDesc: '1 ảnh vuông lề rộng (1:1)',
    cols: 1,
    baseSlots: 1,
    slotAspect: 1 / 1,
    baseStripWidth: 360,
    footerExtra: 92,
  },
];

export function getLayoutMeta(id: LayoutId): LayoutMeta {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/**
 * Calculates the exact logical coordinates of the photo strip and all its slots.
 * Used by both DOM interactive strip and High-DPI Offscreen Canvas export.
 */
export function calculateStripGeometry(config: FrameConfig): StripGeometry {
  const meta = getLayoutMeta(config.layoutId);
  const cols = meta.cols;
  const totalSlots = Math.max(1, meta.baseSlots + Math.max(0, config.extraSlots));
  const rows = Math.ceil(totalSlots / cols);

  const stripWidth = meta.baseStripWidth;
  const padding = Math.max(8, Math.min(56, config.padding));
  const gap = Math.max(0, Math.min(40, config.gap));
  const borderRadius = Math.max(0, Math.min(40, config.borderRadius));

  const innerWidth = stripWidth - padding * 2;
  const slotWidth = (innerWidth - gap * (cols - 1)) / cols;
  const slotHeight = slotWidth / meta.slotAspect;

  const slots: SlotRect[] = [];

  for (let i = 0; i < totalSlots; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Check if this is the last item in an odd-numbered total for a 2-col layout
    const isLastOddItem = cols === 2 && totalSlots % 2 === 1 && i === totalSlots - 1;

    const x = isLastOddItem
      ? (stripWidth - slotWidth) / 2
      : padding + col * (slotWidth + gap);

    const y = padding + row * (slotHeight + gap);

    slots.push({
      index: i,
      x,
      y,
      width: slotWidth,
      height: slotHeight,
      borderRadius,
    });
  }

  const gridBottom = padding + rows * slotHeight + Math.max(0, rows - 1) * gap;
  const footerHeight = meta.footerExtra;
  const stripHeight = gridBottom + footerHeight;

  return {
    stripWidth,
    stripHeight,
    cols,
    rows,
    totalSlots,
    slotAspect: meta.slotAspect,
    slots,
    footerY: gridBottom,
    footerHeight,
  };
}

