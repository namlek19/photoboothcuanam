import {
  FrameConfig,
  PhotoSlotData,
  PlacedSticker,
  PresetFrameItem,
} from '../types/photobooth';
import { applyPixelFilterToCanvas, computePhotoTransform } from './filters';
import { calculateStripGeometry } from './stripGeometry';
import presetFramesData from '../data/presetFrames.json';

const PRESET_FRAMES = presetFramesData as PresetFrameItem[];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Deterministic decorative ocean bubbles for the frame background/overlay
 */
function drawOceanBubblesPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  isDarkBg: boolean
): void {
  // Deterministic seed positions (normalized 0..1)
  const bubbles = [
    { nx: 0.08, ny: 0.06, r: 16 },
    { nx: 0.92, ny: 0.09, r: 22 },
    { nx: 0.86, ny: 0.14, r: 9 },
    { nx: 0.06, ny: 0.27, r: 12 },
    { nx: 0.94, ny: 0.34, r: 18 },
    { nx: 0.07, ny: 0.49, r: 20 },
    { nx: 0.14, ny: 0.53, r: 8 },
    { nx: 0.91, ny: 0.62, r: 15 },
    { nx: 0.09, ny: 0.76, r: 14 },
    { nx: 0.93, ny: 0.83, r: 21 },
    { nx: 0.84, ny: 0.88, r: 10 },
    { nx: 0.22, ny: 0.95, r: 13 },
    { nx: 0.76, ny: 0.96, r: 11 },
  ];

  ctx.save();
  for (const b of bubbles) {
    const cx = b.nx * width;
    const cy = b.ny * height;
    const r = b.r * scale;

    const grad = ctx.createRadialGradient(
      cx - r * 0.3,
      cy - r * 0.3,
      r * 0.1,
      cx,
      cy,
      r
    );
    if (isDarkBg) {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.5, 'rgba(127, 255, 212, 0.22)');
      grad.addColorStop(1, 'rgba(66, 153, 225, 0.35)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.55, 'rgba(127, 255, 212, 0.38)');
      grad.addColorStop(1, 'rgba(66, 153, 225, 0.42)');
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 1.2 * scale;
    ctx.strokeStyle = isDarkBg
      ? 'rgba(127, 255, 212, 0.45)'
      : 'rgba(66, 153, 225, 0.45)';
    ctx.stroke();

    // Specular shine dot
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.32, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
  }
  ctx.restore();
}

function isColorDark(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.42;
}

/**
 * Draws the custom uploaded frame (either on 'background' or 'overlay' layer)
 */
async function drawCustomUploadedFrame(
  ctx: CanvasRenderingContext2D,
  config: FrameConfig,
  stripW: number,
  stripH: number,
  scaleFactor: number
): Promise<void> {
  if (!config.customFrame) return;
  try {
    const img = await loadImage(config.customFrame.dataUrl);
    ctx.save();
    ctx.globalAlpha = config.customFrame.opacity ?? 1;

    const centerX = (stripW / 2 + config.customFrame.x) * scaleFactor;
    const centerY = (stripH / 2 + config.customFrame.y) * scaleFactor;
    const drawW = stripW * config.customFrame.scale * scaleFactor;
    const drawH = stripH * config.customFrame.scale * scaleFactor;

    ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
    ctx.restore();
  } catch {
    // Ignore failed custom frame image load
  }
}

/**
 * Draws preset frame overlay details (Film sprocket holes, Retro Windows header, Ocean borders, or public/frames/*.png)
 */
async function drawPresetFrameOverlay(
  ctx: CanvasRenderingContext2D,
  config: FrameConfig,
  stripW: number,
  stripH: number,
  scale: number,
  isDarkBg: boolean
): Promise<void> {
  const preset = PRESET_FRAMES.find((p) => p.id === config.presetFrameId);
  const W = stripW * scale;
  const H = stripH * scale;

  ctx.save();

  if (config.presetFrameId === 'film-strip') {
    // 35mm sprocket holes along left & right borders
    const holeW = 9 * scale;
    const holeH = 13 * scale;
    const stepY = 26 * scale;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    for (let y = 18 * scale; y < H - 24 * scale; y += stepY) {
      drawRoundedRectPath(ctx, 7 * scale, y, holeW, holeH, 2 * scale);
      ctx.fill();
      drawRoundedRectPath(ctx, W - 16 * scale, y, holeW, holeH, 2 * scale);
      ctx.fill();
    }
  } else if (config.presetFrameId === 'retro-windows') {
    // Classic Y2K window border & top bar
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(4 * scale, 4 * scale, W - 8 * scale, H - 8 * scale);

    // Subtle bottom/right 3D bevel
    ctx.strokeStyle = '#4299e1';
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeRect(8 * scale, 8 * scale, W - 16 * scale, H - 16 * scale);
  } else if (config.presetFrameId === 'cute-pastel') {
    // Dashed cute inner border
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([8 * scale, 6 * scale]);
    drawRoundedRectPath(
      ctx,
      8 * scale,
      8 * scale,
      W - 16 * scale,
      H - 16 * scale,
      16 * scale
    );
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (
    config.presetFrameId === 'minimalist-ocean' ||
    config.presetFrameId === 'bubble-dream' ||
    config.presetFrameId === 'deep-navy'
  ) {
    ctx.strokeStyle = isDarkBg
      ? 'rgba(127, 255, 212, 0.45)'
      : 'rgba(66, 153, 225, 0.35)';
    ctx.lineWidth = 2 * scale;
    drawRoundedRectPath(
      ctx,
      6 * scale,
      6 * scale,
      W - 12 * scale,
      H - 12 * scale,
      14 * scale
    );
    ctx.stroke();
  }

  // If preset has an external overlay image in public/frames/
  if (preset?.imageUrl) {
    try {
      const overlayImg = await loadImage(preset.imageUrl);
      ctx.drawImage(overlayImg, 0, 0, W, H);
    } catch {
      // Ignore if optional external frame asset fails to load
    }
  }

  ctx.restore();
}

/**
 * Renders the complete Photobooth Strip onto a High-DPI Offscreen HTML5 Canvas
 * Strictly following the required layer order:
 * 1. Lớp Nền Khung
 * 2. Các Ô Ảnh (pan/zoom + Filter)
 * 3. Lớp Khung Đè (Frame Overlay / Custom Frame)
 * 4. Các Sticker tùy chỉnh
 */
export async function renderHighDpiStripCanvas(
  config: FrameConfig,
  photos: (PhotoSlotData | null)[],
  stickers: PlacedSticker[],
  dpiScale = 3
): Promise<HTMLCanvasElement> {
  const geom = calculateStripGeometry(config);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(geom.stripWidth * dpiScale);
  canvas.height = Math.round(geom.stripHeight * dpiScale);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo HTML5 Canvas 2D');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const isDarkBg = isColorDark(config.backgroundColor);

  // =========================================================
  // LAYER 1: LỚP NỀN KHUNG (FRAME BACKGROUND LAYER)
  // =========================================================
  ctx.save();
  ctx.fillStyle = config.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle ocean gradient sheen for ocean presets
  if (config.presetFrameId === 'bubble-dream') {
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, 'rgba(127, 255, 212, 0.32)');
    bgGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    bgGrad.addColorStop(1, 'rgba(66, 153, 225, 0.25)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Ocean Bubble Pattern on background if enabled
  if (config.bubblePattern) {
    drawOceanBubblesPattern(ctx, canvas.width, canvas.height, dpiScale, isDarkBg);
  }

  // If user uploaded a Custom Frame and set it to 'background' (below photos)
  if (config.customFrame && config.customFrame.layer === 'background') {
    await drawCustomUploadedFrame(
      ctx,
      config,
      geom.stripWidth,
      geom.stripHeight,
      dpiScale
    );
  }
  ctx.restore();

  // =========================================================
  // LAYER 2: CÁC Ô ẢNH (PHOTO SLOTS WITH PAN/ZOOM + FILTER)
  // =========================================================
  for (let i = 0; i < geom.slots.length; i++) {
    const slot = geom.slots[i];
    const photo = photos[i] || null;

    const sx = Math.round(slot.x * dpiScale);
    const sy = Math.round(slot.y * dpiScale);
    const sw = Math.round(slot.width * dpiScale);
    const sh = Math.round(slot.height * dpiScale);
    const sr = Math.round(slot.borderRadius * dpiScale);

    ctx.save();
    drawRoundedRectPath(ctx, sx, sy, sw, sh, sr);
    ctx.clip();

    if (photo && photo.originalDataUrl) {
      try {
        const img = await loadImage(photo.originalDataUrl);

        // Render into an offscreen slot canvas for crisp pixel-level filter processing
        const slotCanvas = document.createElement('canvas');
        slotCanvas.width = sw;
        slotCanvas.height = sh;
        const slotCtx = slotCanvas.getContext('2d');

        if (slotCtx) {
          slotCtx.imageSmoothingEnabled = true;
          slotCtx.imageSmoothingQuality = 'high';

          slotCtx.fillStyle = '#0f172a';
          slotCtx.fillRect(0, 0, sw, sh);

          const transform = computePhotoTransform(
            img.naturalWidth || photo.naturalWidth,
            img.naturalHeight || photo.naturalHeight,
            sw,
            sh,
            photo.panX,
            photo.panY,
            photo.zoom
          );

          slotCtx.drawImage(
            img,
            transform.drawX,
            transform.drawY,
            transform.drawWidth,
            transform.drawHeight
          );

          // Apply exact color filter + film grain + vignette
          applyPixelFilterToCanvas(slotCtx, sw, sh, photo.filterId);

          ctx.drawImage(slotCanvas, sx, sy, sw, sh);
        }
      } catch {
        ctx.fillStyle = '#e6fffa';
        ctx.fillRect(sx, sy, sw, sh);
      }
    } else {
      // Empty slot placeholder
      ctx.fillStyle = isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(66, 153, 225, 0.08)';
      ctx.fillRect(sx, sy, sw, sh);
    }

    ctx.restore();

    // Subtle slot frame border
    ctx.save();
    drawRoundedRectPath(ctx, sx, sy, sw, sh, sr);
    ctx.lineWidth = 1.2 * dpiScale;
    ctx.strokeStyle = isDarkBg
      ? 'rgba(127, 255, 212, 0.28)'
      : 'rgba(0, 0, 128, 0.12)';
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================
  // LAYER 3: LỚP KHUNG ĐÈ (FRAME OVERLAY / CUSTOM FRAME)
  // =========================================================
  await drawPresetFrameOverlay(
    ctx,
    config,
    geom.stripWidth,
    geom.stripHeight,
    dpiScale,
    isDarkBg
  );

  if (config.customFrame && config.customFrame.layer === 'overlay') {
    await drawCustomUploadedFrame(
      ctx,
      config,
      geom.stripWidth,
      geom.stripHeight,
      dpiScale
    );
  }

  // Draw Footer Brand / Caption & Date
  ctx.save();
  const footerCenterX = canvas.width / 2;
  const footerCenterY = (geom.footerY + geom.footerHeight * 0.46) * dpiScale;
  const textColor = isDarkBg ? '#7FFFD4' : '#000080';
  const subTextColor = isDarkBg
    ? 'rgba(255, 255, 255, 0.68)'
    : 'rgba(0, 0, 128, 0.58)';

  if (config.footerText.trim()) {
    ctx.font = `700 ${Math.round(13 * dpiScale)}px "Plus Jakarta Sans", "Be Vietnam Pro", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      config.footerText.trim(),
      footerCenterX,
      config.showDate ? footerCenterY - 7 * dpiScale : footerCenterY
    );
  }

  if (config.showDate) {
    const dateStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    ctx.font = `500 ${Math.round(9.5 * dpiScale)}px "Plus Jakarta Sans", "Be Vietnam Pro", sans-serif`;
    ctx.fillStyle = subTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      dateStr,
      footerCenterX,
      config.footerText.trim() ? footerCenterY + 9 * dpiScale : footerCenterY
    );
  }
  ctx.restore();

  // =========================================================
  // LAYER 4: CÁC STICKER TÙY CHỈNH (CUSTOM & BUILTIN STICKERS)
  // =========================================================
  for (const sticker of stickers) {
    if (!sticker.imageUrl) continue;
    try {
      const stickerImg = await loadImage(sticker.imageUrl);
      ctx.save();
      const cx = sticker.x * dpiScale;
      const cy = sticker.y * dpiScale;
      const rad = (sticker.rotation * Math.PI) / 180;
      const w = sticker.width * sticker.scale * dpiScale;
      const h = sticker.height * sticker.scale * dpiScale;

      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.drawImage(stickerImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    } catch {
      // Ignore individual broken sticker image
    }
  }

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Không thể xuất ảnh PNG'));
      },
      'image/png',
      1.0
    );
  });
}

/**
 * 1. Download High-DPI PNG to user's device (PC & Mobile iOS/Android compatible)
 */
export async function exportAndDownloadPng(
  config: FrameConfig,
  photos: (PhotoSlotData | null)[],
  stickers: PlacedSticker[]
): Promise<void> {
  const canvas = await renderHighDpiStripCanvas(config, photos, stickers, 3);
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.download = `ocean-photobooth-${config.layoutId}-${timestamp}.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * 2. Copy High-DPI PNG directly to Clipboard using navigator.clipboard.write + ClipboardItem
 */
export async function exportAndCopyToClipboard(
  config: FrameConfig,
  photos: (PhotoSlotData | null)[],
  stickers: PlacedSticker[]
): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.clipboard ||
    typeof ClipboardItem === 'undefined'
  ) {
    throw new Error('Trình duyệt của bạn không hỗ trợ Clipboard API cho hình ảnh.');
  }

  // Pass a Promise<Blob> directly to ClipboardItem so Safari/iOS preserves user activation gesture
  const blobPromise = renderHighDpiStripCanvas(config, photos, stickers, 3).then(
    (canvas) => canvasToBlob(canvas)
  );

  const item = new ClipboardItem({
    'image/png': blobPromise,
  });

  await navigator.clipboard.write([item]);
}

