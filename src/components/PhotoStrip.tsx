import React, { useRef, useState } from 'react';
import {
  X,
  Upload,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeftRight,
  Heart,
  Minus,
  RotateCw,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  FrameConfig,
  PhotoSlotData,
  PlacedSticker,
  PresetFrameItem,
} from '../types/photobooth';
import { computePhotoTransform, getFilterById } from '../utils/filters';
import { calculateStripGeometry } from '../utils/stripGeometry';
import presetFramesData from '../data/presetFrames.json';

const PRESET_FRAMES = presetFramesData as PresetFrameItem[];

interface PhotoStripProps {
  config: FrameConfig;
  photos: (PhotoSlotData | null)[];
  stickers: PlacedSticker[];
  activeShootSlotIndex: number | null;
  isEditingCustomFrame: boolean;
  onToggleEditCustomFrame: (editing: boolean) => void;
  onDeletePhoto: (slotIndex: number) => void;
  onUploadPhotoToSlot: (slotIndex: number, file: File) => void;
  onSwapPhotos: (indexA: number, indexB: number) => void;
  onUpdatePhotoTransform: (
    slotIndex: number,
    updates: Partial<Pick<PhotoSlotData, 'panX' | 'panY' | 'zoom'>>
  ) => void;
  onAddExtraSlot: () => void;
  onRemoveExtraSlot: () => void;
  onUpdateCustomFrame: (
    updates: Partial<NonNullable<FrameConfig['customFrame']>>
  ) => void;
  onUpdateSticker: (
    stickerId: string,
    updates: Partial<PlacedSticker>
  ) => void;
  onDeleteSticker: (stickerId: string) => void;
}

function isColorDark(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.42;
}

const DECORATIVE_BUBBLES = [
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

export const PhotoStrip: React.FC<PhotoStripProps> = ({
  config,
  photos,
  stickers,
  activeShootSlotIndex,
  isEditingCustomFrame,
  onToggleEditCustomFrame,
  onDeletePhoto,
  onUploadPhotoToSlot,
  onSwapPhotos,
  onUpdatePhotoTransform,
  onAddExtraSlot,
  onRemoveExtraSlot,
  onUpdateCustomFrame,
  onUpdateSticker,
  onDeleteSticker,
}) => {
  const geom = calculateStripGeometry(config);
  const stripContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Slot Pan/Zoom active index
  const [panZoomSlotIndex, setPanZoomSlotIndex] = useState<number | null>(null);
  // Swap mode source slot index (for touch & click swap)
  const [swapSourceIndex, setSwapSourceIndex] = useState<number | null>(null);
  // HTML5 Drag & Drop source index
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const draggedSlotRef = useRef<number | null>(null);

  // Selected sticker ID on the strip
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Pointer drag state for panning inside a photo slot
  const slotPanDragRef = useRef<{
    slotIndex: number;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
    maxPanPxX: number;
    maxPanPxY: number;
  } | null>(null);

  // Pointer drag state for moving custom frame
  const customFrameDragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Pointer drag state for moving/rotating/scaling a sticker
  const stickerDragRef = useRef<{
    id: string;
    mode: 'move' | 'transform';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialScale: number;
    initialRotation: number;
    centerClientX: number;
    centerClientY: number;
  } | null>(null);

  const isDarkBg = isColorDark(config.backgroundColor);
  const preset = PRESET_FRAMES.find((p) => p.id === config.presetFrameId);

  const getLogicalScaleFactor = (): number => {
    if (!stripContainerRef.current) return 1;
    const rect = stripContainerRef.current.getBoundingClientRect();
    return rect.width > 0 ? geom.stripWidth / rect.width : 1;
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Mode Banner if adjusting Custom Frame or Swapping Slots */}
      {isEditingCustomFrame && config.customFrame && (
        <div className="mb-2.5 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#000080] text-white text-xs font-semibold shadow-md animate-bounce">
          <Move className="w-3.5 h-3.5 text-[#7FFFD4]" />
          <span>Kéo trực tiếp trên khung để di chuyển khung tải lên</span>
          <button
            type="button"
            onClick={() => onToggleEditCustomFrame(false)}
            className="ml-1 px-2 py-0.5 rounded-full bg-[#7FFFD4] text-[#000080] font-bold hover:opacity-90"
          >
            Xong
          </button>
        </div>
      )}

      {swapSourceIndex !== null && (
        <div className="mb-2.5 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3182ce] text-white text-xs font-semibold shadow-md">
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#7FFFD4]" />
          <span>Chọn ô ảnh thứ 2 để đổi vị trí với Ô #{swapSourceIndex + 1}</span>
          <button
            type="button"
            onClick={() => setSwapSourceIndex(null)}
            className="ml-1 px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Active Slot Pan/Zoom Floating Control Bar */}
      {panZoomSlotIndex !== null && photos[panZoomSlotIndex] && (
        <div className="mb-3 w-full max-w-[360px] p-2.5 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-[#4299e1] shadow-lg flex flex-col gap-2 z-30">
          <div className="flex items-center justify-between text-xs font-bold text-[#000080]">
            <span className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#3182ce]" />
              Chỉnh góc Ô #{panZoomSlotIndex + 1} (Kéo ảnh để căn mặt)
            </span>
            <button
              type="button"
              onClick={() => setPanZoomSlotIndex(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#000080] text-white text-[11px]"
            >
              <Check className="w-3 h-3 text-[#7FFFD4]" />
              Xong
            </button>
          </div>
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-[#3182ce] shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={photos[panZoomSlotIndex]!.zoom}
              onChange={(e) =>
                onUpdatePhotoTransform(panZoomSlotIndex, {
                  zoom: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#000080] cursor-pointer h-1.5 bg-[#ebf8ff] rounded-lg"
            />
            <ZoomIn className="w-4 h-4 text-[#3182ce] shrink-0" />
            <span className="text-[11px] font-bold text-[#000080] w-10 text-right">
              {photos[panZoomSlotIndex]!.zoom.toFixed(1)}x
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdatePhotoTransform(panZoomSlotIndex, {
                  panX: 0,
                  panY: 0,
                  zoom: 1,
                })
              }
              className="p-1.5 rounded-lg bg-[#ebf8ff] hover:bg-[#7FFFD4]/60 text-[#000080]"
              title="Đặt lại góc ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Sticker Floating Quick Controls */}
      {selectedStickerId &&
        stickers.some((s) => s.id === selectedStickerId) && (
          <div className="mb-3 w-full max-w-[360px] p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-[#7FFFD4] shadow-lg flex flex-wrap items-center justify-between gap-2 z-30">
            {(() => {
              const st = stickers.find((s) => s.id === selectedStickerId)!;
              return (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#000080]">
                    <Sparkles className="w-3.5 h-3.5 text-[#3182ce]" />
                    <span className="truncate max-w-[110px]">{st.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSticker(st.id, {
                          scale: Math.max(0.35, +(st.scale - 0.15).toFixed(2)),
                        })
                      }
                      className="p-1.5 rounded-lg bg-[#ebf8ff] hover:bg-[#7FFFD4]/60 text-[#000080]"
                      title="Thu nhỏ sticker"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSticker(st.id, {
                          scale: Math.min(3, +(st.scale + 0.15).toFixed(2)),
                        })
                      }
                      className="p-1.5 rounded-lg bg-[#ebf8ff] hover:bg-[#7FFFD4]/60 text-[#000080]"
                      title="Phóng to sticker"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSticker(st.id, {
                          rotation: (st.rotation - 15) % 360,
                        })
                      }
                      className="p-1.5 rounded-lg bg-[#ebf8ff] hover:bg-[#7FFFD4]/60 text-[#000080]"
                      title="Xoay trái 15°"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSticker(st.id, {
                          rotation: (st.rotation + 15) % 360,
                        })
                      }
                      className="p-1.5 rounded-lg bg-[#ebf8ff] hover:bg-[#7FFFD4]/60 text-[#000080]"
                      title="Xoay phải 15°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteSticker(st.id);
                        setSelectedStickerId(null);
                      }}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                      title="Xóa sticker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStickerId(null)}
                      className="px-2 py-1 rounded-lg bg-[#000080] text-white text-[11px] font-bold"
                    >
                      Xong
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      {/* THE INTERACTIVE PHOTO STRIP */}
      <div
        ref={stripContainerRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedStickerId(null);
          }
        }}
        className="relative shadow-[0_18px_50px_rgba(0,0,128,0.16)] rounded-xl overflow-hidden transition-all duration-300"
        style={{
          width: '100%',
          maxWidth: geom.cols === 2 ? '380px' : '295px',
          aspectRatio: `${geom.stripWidth} / ${geom.stripHeight}`,
          backgroundColor: config.backgroundColor || '#ffffff',
        }}
      >
        {/* LAYER 1: BACKGROUND & BUBBLE PATTERN & CUSTOM FRAME (IF BACKGROUND) */}
        {config.presetFrameId === 'bubble-dream' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(127,255,212,0.32) 0%, rgba(255,255,255,0.15) 50%, rgba(66,153,225,0.25) 100%)',
            }}
          />
        )}

        {config.bubblePattern && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {DECORATIVE_BUBBLES.map((b, idx) => (
              <div
                key={idx}
                className="absolute rounded-full"
                style={{
                  left: `${b.nx * 100}%`,
                  top: `${b.ny * 100}%`,
                  width: `${(b.r * 2 / geom.stripWidth) * 100}%`,
                  aspectRatio: '1 / 1',
                  transform: 'translate(-50%, -50%)',
                  background: isDarkBg
                    ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(127,255,212,0.22) 55%, rgba(66,153,225,0.35))'
                    : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(127,255,212,0.38) 55%, rgba(66,153,225,0.42))',
                  border: isDarkBg
                    ? '1px solid rgba(127,255,212,0.45)'
                    : '1px solid rgba(66,153,225,0.45)',
                }}
              />
            ))}
          </div>
        )}

        {/* Custom Uploaded Frame on 'background' layer */}
        {config.customFrame && config.customFrame.layer === 'background' && (
          <img
            src={config.customFrame.dataUrl}
            alt="Custom Frame Background"
            draggable={false}
            className="absolute pointer-events-none max-w-none"
            style={{
              width: `${config.customFrame.scale * 100}%`,
              height: `${config.customFrame.scale * 100}%`,
              left: `${((geom.stripWidth / 2 + config.customFrame.x) / geom.stripWidth) * 100}%`,
              top: `${((geom.stripHeight / 2 + config.customFrame.y) / geom.stripHeight) * 100}%`,
              transform: 'translate(-50%, -50%)',
              opacity: config.customFrame.opacity ?? 1,
            }}
          />
        )}

        {/* LAYER 2: PHOTO SLOTS */}
        {geom.slots.map((slot) => {
          const photo = photos[slot.index] || null;
          const isShootingThis = activeShootSlotIndex === slot.index;
          const isPanZoomActive = panZoomSlotIndex === slot.index;
          const isSwapSelected = swapSourceIndex === slot.index;
          const isDragOver = dragOverIndex === slot.index;

          const leftPct = (slot.x / geom.stripWidth) * 100;
          const topPct = (slot.y / geom.stripHeight) * 100;
          const widthPct = (slot.width / geom.stripWidth) * 100;
          const heightPct = (slot.height / geom.stripHeight) * 100;

          const filterDef = photo ? getFilterById(photo.filterId) : null;
          const transform = photo
            ? computePhotoTransform(
                photo.naturalWidth,
                photo.naturalHeight,
                slot.width,
                slot.height,
                photo.panX,
                photo.panY,
                photo.zoom
              )
            : null;

          return (
            <div
              key={slot.index}
              draggable={Boolean(photo) && !isPanZoomActive && !isEditingCustomFrame}
              onDragStart={() => {
                draggedSlotRef.current = slot.index;
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (
                  draggedSlotRef.current !== null &&
                  draggedSlotRef.current !== slot.index
                ) {
                  setDragOverIndex(slot.index);
                }
              }}
              onDragLeave={() => {
                if (dragOverIndex === slot.index) setDragOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIndex(null);
                if (
                  draggedSlotRef.current !== null &&
                  draggedSlotRef.current !== slot.index
                ) {
                  onSwapPhotos(draggedSlotRef.current, slot.index);
                }
                draggedSlotRef.current = null;
              }}
              onClick={() => {
                if (swapSourceIndex !== null) {
                  if (swapSourceIndex !== slot.index) {
                    onSwapPhotos(swapSourceIndex, slot.index);
                  }
                  setSwapSourceIndex(null);
                }
              }}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                borderRadius: `${(slot.borderRadius / geom.stripWidth) * 100 * 2.8}px`,
              }}
              className={`absolute overflow-hidden group transition-shadow ${
                isShootingThis
                  ? 'ring-4 ring-[#7FFFD4] shadow-[0_0_20px_rgba(127,255,212,0.9)]'
                  : isPanZoomActive
                  ? 'ring-3 ring-[#0000FF] shadow-lg z-20'
                  : isSwapSelected
                  ? 'ring-3 ring-[#4299e1] animate-pulse'
                  : isDragOver
                  ? 'ring-3 ring-[#7FFFD4]'
                  : 'border border-[#000080]/15'
              } ${
                isDarkBg ? 'bg-white/10' : 'bg-[#e6f6fc]/80'
              }`}
            >
              {/* Hidden File Input for Slot Upload */}
              <input
                ref={(el) => {
                  fileInputRefs.current[slot.index] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadPhotoToSlot(slot.index, file);
                  }
                  e.target.value = '';
                }}
              />

              {photo && transform ? (
                <>
                  {/* Full-frame Non-destructive Photo with Live Pan/Zoom & Filter */}
                  <div
                    onPointerDown={(e) => {
                      if (!isPanZoomActive) return;
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      slotPanDragRef.current = {
                        slotIndex: slot.index,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialPanX: photo.panX,
                        initialPanY: photo.panY,
                        maxPanPxX: transform.maxPanPxX,
                        maxPanPxY: transform.maxPanPxY,
                      };
                    }}
                    onPointerMove={(e) => {
                      const drag = slotPanDragRef.current;
                      if (!drag || drag.slotIndex !== slot.index) return;
                      const logicalScale = getLogicalScaleFactor();
                      const dxLogical = (e.clientX - drag.startX) * logicalScale;
                      const dyLogical = (e.clientY - drag.startY) * logicalScale;

                      const nextPanX = Math.max(
                        -1,
                        Math.min(1, drag.initialPanX + dxLogical / drag.maxPanPxX)
                      );
                      const nextPanY = Math.max(
                        -1,
                        Math.min(1, drag.initialPanY + dyLogical / drag.maxPanPxY)
                      );
                      onUpdatePhotoTransform(slot.index, {
                        panX: nextPanX,
                        panY: nextPanY,
                      });
                    }}
                    onPointerUp={() => {
                      slotPanDragRef.current = null;
                    }}
                    onWheel={(e) => {
                      if (!isPanZoomActive) return;
                      e.preventDefault();
                      const delta = e.deltaY < 0 ? 0.08 : -0.08;
                      const nextZoom = Math.max(
                        1,
                        Math.min(3, +(photo.zoom + delta).toFixed(2))
                      );
                      onUpdatePhotoTransform(slot.index, { zoom: nextZoom });
                    }}
                    className={`w-full h-full relative ${
                      isPanZoomActive
                        ? 'cursor-move touch-none'
                        : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <img
                      src={photo.originalDataUrl}
                      alt={`Ảnh ${slot.index + 1}`}
                      draggable={false}
                      className="absolute max-w-none select-none pointer-events-none"
                      style={{
                        width: `${(transform.drawWidth / slot.width) * 100}%`,
                        height: `${(transform.drawHeight / slot.height) * 100}%`,
                        left: `${(transform.drawX / slot.width) * 100}%`,
                        top: `${(transform.drawY / slot.height) * 100}%`,
                        filter: filterDef?.cssFilter || 'none',
                      }}
                    />

                    {/* Filter Color Overlay Tint for Live Fidelity */}
                    {filterDef?.overlayColor && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: filterDef.overlayColor }}
                      />
                    )}
                  </div>

                  {/* Top-Right Delete 'X' Button (Required per prompt) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (panZoomSlotIndex === slot.index) {
                        setPanZoomSlotIndex(null);
                      }
                      onDeletePhoto(slot.index);
                    }}
                    className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-[#000080]/80 hover:bg-red-600 text-white flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md"
                    title="Xóa ảnh này để chụp lại"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Bottom Action Pills on Each Filled Slot: Pan/Zoom, Swap, Upload */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 z-20 flex items-center justify-between gap-1 opacity-95 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-1 pointer-events-auto">
                      {/* Toggle Pan/Zoom Non-destructive Crop */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPanZoomSlotIndex(
                            isPanZoomActive ? null : slot.index
                          );
                        }}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow ${
                          isPanZoomActive
                            ? 'bg-[#7FFFD4] text-[#000080]'
                            : 'bg-[#000080]/75 hover:bg-[#000080] text-white'
                        }`}
                        title="Kéo hoặc phóng to/thu nhỏ góc mặt trong ô"
                      >
                        <Move className="w-3 h-3" />
                        <span className="hidden sm:inline">Căn góc</span>
                      </button>

                      {/* Touch / Click Swap Order Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (swapSourceIndex === null) {
                            setSwapSourceIndex(slot.index);
                          } else if (swapSourceIndex === slot.index) {
                            setSwapSourceIndex(null);
                          } else {
                            onSwapPhotos(swapSourceIndex, slot.index);
                            setSwapSourceIndex(null);
                          }
                        }}
                        className={`p-1 rounded-full text-[10px] font-bold shadow ${
                          isSwapSelected
                            ? 'bg-[#7FFFD4] text-[#000080]'
                            : 'bg-[#000080]/75 hover:bg-[#000080] text-white'
                        }`}
                        title="Đổi vị trí với ô ảnh khác"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Upload replacement photo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRefs.current[slot.index]?.click();
                      }}
                      className="pointer-events-auto p-1 rounded-full bg-white/85 hover:bg-white text-[#000080] shadow"
                      title="Tải ảnh khác lên ô này"
                    >
                      <Upload className="w-3 h-3" />
                    </button>
                  </div>
                </>
              ) : (
                /* Empty Slot: Click to Upload Photo or Shoot into this slot */
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[slot.index]?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-center p-2 hover:bg-[#7FFFD4]/25 transition-colors cursor-pointer"
                  title="Bấm để tải ảnh từ thiết bị lên ô này"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isDarkBg
                        ? 'bg-white/15 text-[#7FFFD4]'
                        : 'bg-white/80 text-[#3182ce]'
                    } shadow-sm`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      isDarkBg ? 'text-white/80' : 'text-[#000080]/70'
                    }`}
                  >
                    Ô #{slot.index + 1} • Tải ảnh
                  </span>
                </button>
              )}
            </div>
          );
        })}

        {/* LAYER 3: PRESET FRAME OVERLAY & CUSTOM FRAME (IF OVERLAY) */}
        {config.presetFrameId === 'film-strip' && (
          <div className="absolute inset-y-2 inset-x-1.5 pointer-events-none flex justify-between">
            <div className="flex flex-col justify-around">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-3 rounded-[2px] bg-white/80 block"
                />
              ))}
            </div>
            <div className="flex flex-col justify-around">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-3 rounded-[2px] bg-white/80 block"
                />
              ))}
            </div>
          </div>
        )}

        {config.presetFrameId === 'cute-pastel' && (
          <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-pink-400/75 pointer-events-none" />
        )}

        {config.presetFrameId === 'retro-windows' && (
          <div className="absolute inset-1 border-2 border-[#000080] pointer-events-none" />
        )}

        {preset?.imageUrl && (
          <img
            src={preset.imageUrl}
            alt={preset.name}
            draggable={false}
            className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
          />
        )}

        {config.customFrame && config.customFrame.layer === 'overlay' && (
          <img
            src={config.customFrame.dataUrl}
            alt="Custom Frame Overlay"
            draggable={false}
            className="absolute pointer-events-none max-w-none z-10"
            style={{
              width: `${config.customFrame.scale * 100}%`,
              height: `${config.customFrame.scale * 100}%`,
              left: `${((geom.stripWidth / 2 + config.customFrame.x) / geom.stripWidth) * 100}%`,
              top: `${((geom.stripHeight / 2 + config.customFrame.y) / geom.stripHeight) * 100}%`,
              transform: 'translate(-50%, -50%)',
              opacity: config.customFrame.opacity ?? 1,
            }}
          />
        )}

        {/* Interactive Drag Layer when Editing Custom Uploaded Frame */}
        {isEditingCustomFrame && config.customFrame && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              customFrameDragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initialX: config.customFrame!.x,
                initialY: config.customFrame!.y,
              };
            }}
            onPointerMove={(e) => {
              if (!customFrameDragRef.current) return;
              const scale = getLogicalScaleFactor();
              const dx = (e.clientX - customFrameDragRef.current.startX) * scale;
              const dy = (e.clientY - customFrameDragRef.current.startY) * scale;
              onUpdateCustomFrame({
                x: Math.round(customFrameDragRef.current.initialX + dx),
                y: Math.round(customFrameDragRef.current.initialY + dy),
              });
            }}
            onPointerUp={() => {
              customFrameDragRef.current = null;
            }}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.05 : -0.05;
              const nextScale = Math.max(
                0.2,
                Math.min(3, +(config.customFrame!.scale + delta).toFixed(2))
              );
              onUpdateCustomFrame({ scale: nextScale });
            }}
            className="absolute inset-0 z-30 cursor-move touch-none ring-4 ring-inset ring-[#7FFFD4] bg-[#000080]/5 flex items-center justify-center"
            title="Kéo để di chuyển khung, lăn chuột để phóng to/thu nhỏ"
          >
            <span className="px-3 py-1 rounded-full bg-[#000080]/80 text-[#7FFFD4] text-[11px] font-bold pointer-events-none">
              Kéo để căn vị trí khung • Lăn chuột để Zoom
            </span>
          </div>
        )}

        {/* Footer Text & Date */}
        <div
          className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none z-10 px-2 text-center"
          style={{
            top: `${(geom.footerY / geom.stripHeight) * 100}%`,
            height: `${(geom.footerHeight / geom.stripHeight) * 100}%`,
          }}
        >
          {config.footerText.trim() && (
            <p
              className="text-[11px] font-extrabold tracking-wider leading-tight truncate max-w-full"
              style={{ color: isDarkBg ? '#7FFFD4' : '#000080' }}
            >
              {config.footerText}
            </p>
          )}
          {config.showDate && (
            <p
              className="text-[9px] font-medium mt-0.5"
              style={{
                color: isDarkBg
                  ? 'rgba(255,255,255,0.68)'
                  : 'rgba(0,0,128,0.58)',
              }}
            >
              {new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* LAYER 4: INTERACTIVE STICKERS */}
        {stickers.map((sticker) => {
          const isSelected = selectedStickerId === sticker.id;
          const leftPct = (sticker.x / geom.stripWidth) * 100;
          const topPct = (sticker.y / geom.stripHeight) * 100;
          const widthPct =
            ((sticker.width * sticker.scale) / geom.stripWidth) * 100;

          return (
            <div
              key={sticker.id}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedStickerId(sticker.id);
                e.currentTarget.setPointerCapture(e.pointerId);
                stickerDragRef.current = {
                  id: sticker.id,
                  mode: 'move',
                  startX: e.clientX,
                  startY: e.clientY,
                  initialX: sticker.x,
                  initialY: sticker.y,
                  initialScale: sticker.scale,
                  initialRotation: sticker.rotation,
                  centerClientX: 0,
                  centerClientY: 0,
                };
              }}
              onPointerMove={(e) => {
                const drag = stickerDragRef.current;
                if (!drag || drag.id !== sticker.id || drag.mode !== 'move')
                  return;
                const scaleFactor = getLogicalScaleFactor();
                const dx = (e.clientX - drag.startX) * scaleFactor;
                const dy = (e.clientY - drag.startY) * scaleFactor;

                const nextX = Math.max(
                  10,
                  Math.min(geom.stripWidth - 10, drag.initialX + dx)
                );
                const nextY = Math.max(
                  10,
                  Math.min(geom.stripHeight - 10, drag.initialY + dy)
                );
                onUpdateSticker(sticker.id, { x: nextX, y: nextY });
              }}
              onPointerUp={() => {
                stickerDragRef.current = null;
              }}
              onWheel={(e) => {
                if (!isSelected) return;
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                const nextScale = Math.max(
                  0.35,
                  Math.min(3, +(sticker.scale + delta).toFixed(2))
                );
                onUpdateSticker(sticker.id, { scale: nextScale });
              }}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                aspectRatio: `${sticker.width} / ${sticker.height}`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
              }}
              className={`absolute z-20 cursor-move touch-none select-none ${
                isSelected
                  ? 'ring-2 ring-[#0000FF] ring-offset-2 ring-offset-transparent rounded-lg'
                  : 'hover:ring-1 hover:ring-[#4299e1]/60 rounded-lg'
              }`}
            >
              <img
                src={sticker.imageUrl}
                alt={sticker.name}
                draggable={false}
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Direct Delete & Rotate Handles when Sticker is Selected */}
              {isSelected && (
                <>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onDeleteSticker(sticker.id);
                      setSelectedStickerId(null);
                    }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
                    title="Xóa sticker"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onUpdateSticker(sticker.id, {
                        rotation: (sticker.rotation + 20) % 360,
                      });
                    }}
                    className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#000080] text-[#7FFFD4] flex items-center justify-center shadow-md hover:bg-[#3182ce]"
                    title="Bấm để xoay sticker"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* HEART '+1?' BUTTON RIGHT BELOW THE PHOTO STRIP (Required per prompt) */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onAddExtraSlot}
          className="group relative flex items-center gap-2 px-5 py-2 rounded-full bg-white/85 hover:bg-[#7FFFD4] text-[#000080] border-2 border-[#4299e1]/50 hover:border-[#000080] shadow-[0_6px_20px_rgba(66,153,225,0.18)] transition-all duration-200 active:scale-95"
          title="Thêm 1 ô ảnh mới vào cuối dải ảnh hiện tại"
        >
          <span className="relative flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-400 group-hover:scale-125 transition-transform" />
          </span>
          <span className="text-sm font-extrabold tracking-wide text-[#000080]">
            +1?
          </span>
          <span className="text-xs font-medium text-[#3182ce] group-hover:text-[#000080]">
            Thêm ô ảnh
          </span>
        </button>

        {config.extraSlots > 0 && (
          <button
            type="button"
            onClick={onRemoveExtraSlot}
            className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/75 hover:bg-red-50 text-[#000080] hover:text-red-600 border border-[#000080]/20 text-xs font-bold transition-all"
            title="Bớt 1 ô ảnh đã thêm"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Bớt ô ({config.extraSlots})</span>
          </button>
        )}
      </div>
    </div>
  );
};

