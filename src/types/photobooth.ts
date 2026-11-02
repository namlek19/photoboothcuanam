export type AppMode = 'mirror' | 'booth';

export type LayoutId = '1x4' | '2x2' | '2x3' | 'polaroid';

export type CountdownSeconds = 3 | 5 | 8;

export type ShootMode = 'auto' | 'manual';

export type FilterId =
  | 'normal'
  | 'mono'
  | 'bw'
  | 'soft'
  | 'dazz_classic'
  | 'dazz_instant';

export interface FilterDefinition {
  id: FilterId;
  name: string;
  subtitle: string;
  cssFilter: string;
  overlayColor?: string;
  vignette?: number;
  grain?: number;
  softGlow?: boolean;
  badgeColor: string;
}

export interface PhotoSlotData {
  id: string;
  originalDataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  panX: number; // -1 to 1 normalized offset
  panY: number; // -1 to 1 normalized offset
  zoom: number; // 1.0 to 3.0
  filterId: FilterId;
  timestamp: number;
}

export interface PresetFrameItem {
  id: string;
  name: string;
  category: 'ocean' | 'retro' | 'cute' | 'custom_png';
  description: string;
  previewColor: string;
  accentColor: string;
  /** Optional path to PNG overlay in public/frames/*.png */
  imageUrl?: string;
  /** Default recommended style tweaks when choosing this preset */
  recommendedStyle?: {
    backgroundColor?: string;
    bubblePattern?: boolean;
    padding?: number;
    gap?: number;
    borderRadius?: number;
    textColor?: string;
  };
}

export interface CustomUploadedFrame {
  dataUrl: string;
  name: string;
  x: number; // offset in strip logical px from center
  y: number; // offset in strip logical px from center
  scale: number; // 0.2 to 3.0 (1.0 = cover strip)
  layer: 'overlay' | 'background'; // 'overlay' = above photos, 'background' = below photos
  opacity: number; // 0.1 to 1.0
}

export interface StickerDefinition {
  id: string;
  name: string;
  category: 'ocean' | 'cute' | 'text';
  svgContent?: string;
  imageUrl?: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface PlacedSticker {
  id: string;
  stickerId: string;
  name: string;
  isCustomUpload?: boolean;
  imageUrl?: string;
  x: number; // logical X on strip
  y: number; // logical Y on strip
  scale: number; // 0.3 to 3.0
  rotation: number; // degrees
  width: number;
  height: number;
}

export interface FrameConfig {
  layoutId: LayoutId;
  extraSlots: number;
  backgroundColor: string;
  bubblePattern: boolean;
  padding: number;
  gap: number;
  borderRadius: number;
  presetFrameId: string;
  customFrame: CustomUploadedFrame | null;
  footerText: string;
  showDate: boolean;
}

export interface SlotRect {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface StripGeometry {
  stripWidth: number;
  stripHeight: number;
  cols: number;
  rows: number;
  totalSlots: number;
  slotAspect: number;
  slots: SlotRect[];
  footerY: number;
  footerHeight: number;
}

