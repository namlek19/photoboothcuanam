import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Sparkles,
  Download,
  Copy,
  Sliders,
  ArrowLeft,
  Timer,
  Repeat,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Square,
} from 'lucide-react';
import { CameraStreamState } from '../hooks/useCameraStream';
import {
  CountdownSeconds,
  FilterId,
  FrameConfig,
  LayoutId,
  PhotoSlotData,
  PlacedSticker,
  PresetFrameItem,
  ShootMode,
  StickerDefinition,
} from '../types/photobooth';
import { FILTERS, getFilterById } from '../utils/filters';
import { calculateStripGeometry, getLayoutMeta } from '../utils/stripGeometry';
import { playShutterSound } from '../utils/sound';
import {
  exportAndCopyToClipboard,
  exportAndDownloadPng,
} from '../utils/exportEngine';
import { PhotoStrip } from './PhotoStrip';
import { FrameCustomizer } from './FrameCustomizer';

interface BoothViewProps {
  camera: CameraStreamState;
  onBackToMirror: () => void;
}

export const BoothView: React.FC<BoothViewProps> = ({
  camera,
  onBackToMirror,
}) => {
  // Frame & Layout Configuration
  const [frameConfig, setFrameConfig] = useState<FrameConfig>({
    layoutId: '1x4',
    extraSlots: 0,
    backgroundColor: '#f4fefe',
    bubblePattern: true,
    padding: 22,
    gap: 14,
    borderRadius: 12,
    presetFrameId: 'minimalist-ocean',
    customFrame: null,
    footerText: 'Photobooth của Nam',
    showDate: true,
  });

  const geom = calculateStripGeometry(frameConfig);
  const layoutMeta = getLayoutMeta(frameConfig.layoutId);

  // Photos array matching totalSlots
  const [photos, setPhotos] = useState<(PhotoSlotData | null)[]>(() =>
    Array(geom.totalSlots).fill(null)
  );

  // Adjust photos array length when totalSlots changes (via Layout change or Heart +1? button)
  useEffect(() => {
    setPhotos((prev) => {
      if (prev.length === geom.totalSlots) return prev;
      if (prev.length < geom.totalSlots) {
        return [
          ...prev,
          ...Array(geom.totalSlots - prev.length).fill(null),
        ];
      }
      return prev.slice(0, geom.totalSlots);
    });
  }, [geom.totalSlots]);

  // Stickers placed on the strip
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);

  // Active Filter (Live Preview + applied to captures)
  const [activeFilterId, setActiveFilterId] = useState<FilterId>('normal');
  const activeFilter = getFilterById(activeFilterId);

  // Countdown & Shoot Mode
  const [countdownSec, setCountdownSec] = useState<CountdownSeconds>(3);
  const [shootMode, setShootMode] = useState<ShootMode>('auto');
  const [isShooting, setIsShooting] = useState(false);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [activeShootSlotIndex, setActiveShootSlotIndex] = useState<number | null>(
    null
  );
  const [screenFlash, setScreenFlash] = useState(false);

  // Deep Customizer Modal/Drawer & Direct Custom Frame Editing
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isEditingCustomFrame, setIsEditingCustomFrame] = useState(false);

  // Export & Toast state
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 3400);
    },
    []
  );

  // Refs to keep shooting loop reactive and cancellable
  const cancelShootRef = useRef(false);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const activeFilterRef = useRef(activeFilterId);
  activeFilterRef.current = activeFilterId;

  const triggerShutterFlashAndSound = useCallback(() => {
    playShutterSound();
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 180);
  }, []);

  /**
   * Captures full-frame photo from camera into the specified slot index
   */
  const captureIntoSlot = useCallback(
    (slotIndex: number) => {
      const captured = camera.captureFullFrameDataUrl();
      if (!captured) return;

      triggerShutterFlashAndSound();

      const newPhoto: PhotoSlotData = {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        originalDataUrl: captured.dataUrl,
        naturalWidth: captured.width,
        naturalHeight: captured.height,
        panX: 0,
        panY: 0,
        zoom: 1,
        filterId: activeFilterRef.current,
        timestamp: Date.now(),
      };

      setPhotos((prev) => {
        const next = [...prev];
        next[slotIndex] = newPhoto;
        return next;
      });
    },
    [camera, triggerShutterFlashAndSound]
  );

  /**
   * Starts the countdown & shooting sequence (Auto-shoot or Manual single shot)
   */
  const startShootSequence = useCallback(async () => {
    if (isShooting) {
      // Allow stopping an active auto-shoot sequence
      cancelShootRef.current = true;
      setIsShooting(false);
      setRemainingCount(null);
      setActiveShootSlotIndex(null);
      return;
    }

    // Find empty slots from top to bottom
    const currentPhotos = photosRef.current;
    const emptyIndices: number[] = [];
    for (let i = 0; i < currentPhotos.length; i++) {
      if (!currentPhotos[i]) {
        emptyIndices.push(i);
      }
    }

    if (emptyIndices.length === 0) {
      showToast(
        'Dải ảnh đã đầy! Hãy bấm nút X trên ô ảnh bất kỳ để chụp lại hoặc bấm trái tim +1? để thêm ô.',
        'error'
      );
      return;
    }

    const targets =
      shootMode === 'auto' ? emptyIndices : [emptyIndices[0]];

    cancelShootRef.current = false;
    setIsShooting(true);

    for (let tIdx = 0; tIdx < targets.length; tIdx++) {
      if (cancelShootRef.current) break;
      const targetSlot = targets[tIdx];
      setActiveShootSlotIndex(targetSlot);

      // Countdown loop: countdownSec .. 1
      for (let c = countdownSec; c >= 1; c--) {
        if (cancelShootRef.current) break;
        setRemainingCount(c);
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (cancelShootRef.current) break;
      setRemainingCount(null);
      captureIntoSlot(targetSlot);

      // Pause briefly between consecutive shots in Auto mode
      if (tIdx < targets.length - 1 && !cancelShootRef.current) {
        await new Promise((r) => setTimeout(r, 850));
      }
    }

    setIsShooting(false);
    setRemainingCount(null);
    setActiveShootSlotIndex(null);
  }, [
    isShooting,
    shootMode,
    countdownSec,
    captureIntoSlot,
    showToast,
  ]);

  // Keyboard shortcut: Spacebar to start shooting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        startShootSequence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startShootSequence]);

  // Changing filter updates live mirror preview AND applies to existing photos in the strip
  const handleSelectFilter = (filterId: FilterId) => {
    setActiveFilterId(filterId);
    setPhotos((prev) =>
      prev.map((p) => (p ? { ...p, filterId } : null))
    );
  };

  // Upload photo from device into a specific slot (Full-frame Non-destructive)
  const handleUploadPhotoToSlot = (slotIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const uploadedPhoto: PhotoSlotData = {
          id: `upload-${Date.now()}-${slotIndex}`,
          originalDataUrl: dataUrl,
          naturalWidth: img.naturalWidth || 1200,
          naturalHeight: img.naturalHeight || 900,
          panX: 0,
          panY: 0,
          zoom: 1,
          filterId: activeFilterId,
          timestamp: Date.now(),
        };
        setPhotos((prev) => {
          const next = [...prev];
          next[slotIndex] = uploadedPhoto;
          return next;
        });
        showToast(`Đã tải ảnh lên Ô #${slotIndex + 1}. Bạn có thể kéo/zoom để căn góc!`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (slotIndex: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleSwapPhotos = (indexA: number, indexB: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const temp = next[indexA];
      next[indexA] = next[indexB];
      next[indexB] = temp;
      return next;
    });
  };

  const handleUpdatePhotoTransform = (
    slotIndex: number,
    updates: Partial<Pick<PhotoSlotData, 'panX' | 'panY' | 'zoom'>>
  ) => {
    setPhotos((prev) => {
      const next = [...prev];
      const current = next[slotIndex];
      if (!current) return prev;
      next[slotIndex] = { ...current, ...updates };
      return next;
    });
  };

  const handleAddExtraSlot = () => {
    setFrameConfig((prev) => ({
      ...prev,
      extraSlots: Math.min(6, prev.extraSlots + 1),
    }));
    showToast('Đã thêm +1 ô ảnh mới vào cuối dải ảnh! ♡');
  };

  const handleRemoveExtraSlot = () => {
    setFrameConfig((prev) => ({
      ...prev,
      extraSlots: Math.max(0, prev.extraSlots - 1),
    }));
  };

  // Customizer callbacks
  const handleSelectLayout = (layoutId: LayoutId) => {
    setFrameConfig((prev) => ({
      ...prev,
      layoutId,
      extraSlots: 0,
    }));
  };

  const handleSelectPresetFrame = (preset: PresetFrameItem) => {
    setFrameConfig((prev) => ({
      ...prev,
      presetFrameId: preset.id,
      ...(preset.recommendedStyle || {}),
    }));
  };

  const handleUploadCustomFrame = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFrameConfig((prev) => ({
        ...prev,
        customFrame: {
          dataUrl,
          name: file.name,
          x: 0,
          y: 0,
          scale: 1,
          layer: 'overlay',
          opacity: 1,
        },
      }));
      setIsEditingCustomFrame(true);
      showToast('Đã tải khung của bạn! Hãy kéo trực tiếp trên khung ảnh để căn chỉnh.');
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCustomFrame = (
    updates: Partial<NonNullable<FrameConfig['customFrame']>>
  ) => {
    setFrameConfig((prev) => {
      if (!prev.customFrame) return prev;
      return {
        ...prev,
        customFrame: {
          ...prev.customFrame,
          ...updates,
        },
      };
    });
  };

  const handleRemoveCustomFrame = () => {
    setFrameConfig((prev) => ({
      ...prev,
      customFrame: null,
    }));
    setIsEditingCustomFrame(false);
  };

  const handleAddBuiltinSticker = (st: StickerDefinition) => {
    const newSticker: PlacedSticker = {
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stickerId: st.id,
      name: st.name,
      imageUrl: st.imageUrl,
      x: Math.round(
        geom.stripWidth * (0.28 + Math.random() * 0.44)
      ),
      y: Math.round(
        geom.stripHeight * (0.22 + Math.random() * 0.55)
      ),
      scale: 1,
      rotation: Math.round((Math.random() - 0.5) * 20),
      width: st.defaultWidth,
      height: st.defaultHeight,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleUploadCustomSticker = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect =
          (img.naturalWidth || 100) / (img.naturalHeight || 100);
        const baseW = 72;
        const baseH = Math.round(baseW / aspect);
        const customSticker: PlacedSticker = {
          id: `custom-st-${Date.now()}`,
          stickerId: 'custom',
          name: file.name,
          isCustomUpload: true,
          imageUrl: dataUrl,
          x: Math.round(geom.stripWidth / 2),
          y: Math.round(geom.stripHeight / 2),
          scale: 1,
          rotation: 0,
          width: baseW,
          height: baseH,
        };
        setStickers((prev) => [...prev, customSticker]);
        showToast('Đã thêm sticker của bạn lên khung ảnh!');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSticker = (
    stickerId: string,
    updates: Partial<PlacedSticker>
  ) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === stickerId ? { ...s, ...updates } : s))
    );
  };

  const handleDeleteSticker = (stickerId: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== stickerId));
  };

  // Export handlers
  const handleDownloadPng = async () => {
    try {
      setIsExporting(true);
      await exportAndDownloadPng(frameConfig, photos, stickers);
      showToast('Đã tải ảnh PNG chất lượng cao về máy!');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Lỗi khi xuất ảnh PNG',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      setIsExporting(true);
      await exportAndCopyToClipboard(frameConfig, photos, stickers);
      showToast('Đã sao chép ảnh vào bộ nhớ tạm (Clipboard)!');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Không thể sao chép vào Clipboard trên thiết bị này, hãy dùng nút Tải ảnh.',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Compute PC Dashed Crop Guide Box dimensions (% of 16:9 wide mirror frame)
  const pcMirrorAspect = 16 / 9;
  const targetSlotAspect = geom.slotAspect;
  let guideWidthPct = 86;
  let guideHeightPct = 86;
  if (targetSlotAspect > pcMirrorAspect) {
    guideWidthPct = 88;
    guideHeightPct = (88 * pcMirrorAspect) / targetSlotAspect;
  } else {
    guideHeightPct = 86;
    guideWidthPct = (86 * targetSlotAspect) / pcMirrorAspect;
  }

  const filledPhotosCount = photos.filter(Boolean).length;

  return (
    <div className="relative z-10 w-full min-h-screen px-3 sm:px-6 py-4 pb-24 flex flex-col">
      {/* Screen Flash Effect when Shutter Clicks */}
      {screenFlash && (
        <div className="fixed inset-0 z-50 bg-white/90 pointer-events-none animate-out fade-out duration-200" />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-xl border text-xs sm:text-sm font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-[#000080] text-[#7FFFD4] border-[#7FFFD4]'
              : 'bg-red-600 text-white border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#7FFFD4]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={onBackToMirror}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-[#7FFFD4]/60 text-[#000080] border border-[#4299e1]/30 shadow-sm text-xs sm:text-sm font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#3182ce]" />
          <span>Thuần Soi Gương</span>
        </button>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-[#7FFFD4] shadow-sm">
          <Sparkles className="w-4 h-4 text-[#3182ce]" />
          <span className="text-xs sm:text-sm font-extrabold text-[#000080]">
            Photobooth của Nam
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#7FFFD4] text-[#000080]">
            {layoutMeta.name} ({filledPhotosCount}/{geom.totalSlots})
          </span>
        </div>

        {/* Reset All Photos Button */}
        <button
          type="button"
          onClick={() => setPhotos(Array(geom.totalSlots).fill(null))}
          disabled={filledPhotosCount === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 hover:bg-red-50 disabled:opacity-40 text-[#000080] hover:text-red-600 border border-[#000080]/15 text-xs font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Chụp lại từ đầu</span>
        </button>
      </header>

      {/* Main Two-Column Booth Workspace (Left on PC / Top on Mobile = Mirror & Controls; Right on PC / Bottom on Mobile = Photo Strip) */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================= */}
        {/* LEFT COLUMN (PC) / TOP (MOBILE): MIRROR, COUNTDOWN, FILTERS */}
        {/* ======================================================= */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col items-center w-full space-y-4">
          {/* Mirror Container:
              - On Mobile (< md): auto-sizes to match exact aspect ratio of 1 photo slot
              - On PC (>= md): keeps a wide 16:9 mirror frame and renders a dashed crop guide inside matching the exact slot aspect ratio */}
          <div className="w-full flex items-center justify-center">
            <div
              style={
                {
                  '--slot-aspect': `${geom.slotAspect}`,
                } as React.CSSProperties
              }
              className="relative w-full max-w-[680px] aspect-[var(--slot-aspect)] md:aspect-video rounded-[2rem] overflow-hidden bg-[#d8f3fa] border-[5px] border-white/90 ring-2 ring-[#7FFFD4] shadow-[0_18px_50px_rgba(49,130,206,0.18)] flex items-center justify-center transition-all duration-300"
            >
              {/* Live Video Stream (Mirrored scaleX(-1)) with Live Filter Preview */}
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                style={{ filter: activeFilter.cssFilter }}
                className={`w-full h-full object-cover transform -scale-x-100 transition-all duration-200 ${
                  camera.hasCamera && !camera.usingSimulatedCamera
                    ? 'block'
                    : 'hidden'
                }`}
              />

              {/* Live Simulated Mirror Canvas Fallback with Live Filter Preview */}
              <canvas
                ref={camera.fallbackCanvasRef}
                width={1280}
                height={720}
                style={{ filter: activeFilter.cssFilter }}
                className={`w-full h-full object-cover transform -scale-x-100 transition-all duration-200 ${
                  !camera.hasCamera || camera.usingSimulatedCamera
                    ? 'block'
                    : 'hidden'
                }`}
              />

              {/* Live Filter Color Tint Overlay */}
              {activeFilter.overlayColor && (
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{ backgroundColor: activeFilter.overlayColor }}
                />
              )}

              {/* PC DASHED CROP GUIDE (Visible on PC md+ to show exact slot aspect ratio inside wide mirror) */}
              <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-20">
                <div
                  style={{
                    width: `${guideWidthPct}%`,
                    height: `${guideHeightPct}%`,
                  }}
                  className="relative rounded-2xl border-2 border-dashed border-[#7FFFD4] shadow-[0_0_0_9999px_rgba(0,0,40,0.28)] transition-all duration-300 flex items-end justify-center pb-2"
                >
                  {/* Corner Brackets */}
                  <span className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-md" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-md" />
                  <span className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-md" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-md" />

                  <span className="px-2.5 py-0.5 rounded-full bg-[#000080]/70 backdrop-blur-sm text-[#7FFFD4] text-[10px] font-bold tracking-wider">
                    Khung cắt {layoutMeta.name} • Lưu trọn ảnh gốc Full-frame
                  </span>
                </div>
              </div>

              {/* Mobile Aspect Ratio Badge */}
              <div className="md:hidden absolute top-3 left-3 z-20 pointer-events-none">
                <span className="px-2.5 py-1 rounded-full bg-[#000080]/70 backdrop-blur-sm text-[#7FFFD4] text-[10px] font-bold">
                  Khung {layoutMeta.name}
                </span>
              </div>

              {/* Active Countdown Overlay */}
              {remainingCount !== null && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#000080]/20 backdrop-blur-[1px] pointer-events-none">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/85 backdrop-blur-md border-4 border-[#7FFFD4] shadow-[0_0_40px_rgba(127,255,212,0.9)] flex items-center justify-center animate-bounce">
                    <span className="text-5xl sm:text-6xl font-black text-[#000080]">
                      {remainingCount}
                    </span>
                  </div>
                  {activeShootSlotIndex !== null && (
                    <span className="mt-3 px-4 py-1 rounded-full bg-[#000080] text-[#7FFFD4] text-xs font-extrabold shadow-md">
                      Đang chụp Ô #{activeShootSlotIndex + 1} / {geom.totalSlots}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================= */}
          {/* COUNTDOWN & SHOOT CONTROLS BAR                          */}
          {/* ======================================================= */}
          <div className="w-full max-w-[680px] p-3.5 rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_10px_30px_rgba(0,0,128,0.08)] flex flex-wrap items-center justify-between gap-3">
            {/* Countdown Seconds Selector: 3s, 5s, 8s */}
            <div className="flex items-center gap-1.5 bg-[#ebf8ff] p-1 rounded-full border border-[#4299e1]/25">
              <span className="pl-2.5 pr-1 flex items-center gap-1 text-xs font-bold text-[#000080]">
                <Timer className="w-3.5 h-3.5 text-[#3182ce]" />
                <span className="hidden sm:inline">Đếm ngược:</span>
              </span>
              {([3, 5, 8] as CountdownSeconds[]).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={isShooting}
                  onClick={() => setCountdownSec(sec)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                    countdownSec === sec
                      ? 'bg-[#000080] text-[#7FFFD4] shadow-sm'
                      : 'text-[#000080]/75 hover:bg-[#7FFFD4]/40'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Primary Capture Shutter Button (Also supports Spacebar) */}
            <button
              type="button"
              onClick={startShootSequence}
              className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-extrabold shadow-lg transition-all active:scale-95 ${
                isShooting
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-[#000080] hover:bg-[#3182ce] text-white shadow-[0_8px_25px_rgba(0,0,128,0.3)]'
              }`}
              title="Bấm nút này hoặc phím Space để chụp ảnh"
            >
              {isShooting ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Dừng chụp</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-[#7FFFD4]" />
                  <span>
                    {shootMode === 'auto' ? 'Chụp Liên Tiếp' : 'Chụp 1 Tấm'}
                  </span>
                  <span className="hidden md:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-[#7FFFD4]">
                    Phím Space
                  </span>
                </>
              )}
            </button>

            {/* Toggle Switch: Auto-shoot vs Manual single shot */}
            <div className="flex items-center gap-1.5 bg-[#ebf8ff] p-1 rounded-full border border-[#4299e1]/25">
              <button
                type="button"
                disabled={isShooting}
                onClick={() => setShootMode('auto')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                  shootMode === 'auto'
                    ? 'bg-[#7FFFD4] text-[#000080] shadow-sm'
                    : 'text-[#000080]/70 hover:text-[#000080]'
                }`}
                title="Tự động đếm ngược và chụp liên hoàn đến khi đầy dải ảnh"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Liên tiếp</span>
              </button>
              <button
                type="button"
                disabled={isShooting}
                onClick={() => setShootMode('manual')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                  shootMode === 'manual'
                    ? 'bg-[#7FFFD4] text-[#000080] shadow-sm'
                    : 'text-[#000080]/70 hover:text-[#000080]'
                }`}
                title="Bấm 1 lần chỉ chụp 1 tấm vào ô trống đầu tiên"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Từng tấm</span>
              </button>
            </div>
          </div>

          {/* ======================================================= */}
          {/* COLOR FILTERS BAR (DIRECTLY BELOW MIRROR FRAME)         */}
          {/* ======================================================= */}
          <div className="w-full max-w-[680px] p-3.5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_25px_rgba(0,0,128,0.06)]">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#000080] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3182ce]" />
                Bộ Lọc Màu (Live Preview & Áp dụng lên ảnh)
              </span>
              <span className="text-[11px] font-bold text-[#3182ce]">
                Đang chọn: {activeFilter.name}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {FILTERS.map((f) => {
                const selected = activeFilterId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFilter(f.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all ${
                      selected
                        ? 'border-[#000080] bg-[#7FFFD4]/45 shadow-sm scale-[1.02]'
                        : 'border-transparent bg-[#f0fdfa] hover:border-[#4299e1]/40'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full border-2 border-[#000080]/20 mb-1 shadow-inner"
                      style={{
                        backgroundColor: f.badgeColor,
                        filter: f.cssFilter,
                      }}
                    />
                    <span className="text-[11px] font-extrabold text-[#000080] text-center leading-tight">
                      {f.name}
                    </span>
                    <span className="text-[9px] text-[#3182ce] text-center leading-tight mt-0.5 line-clamp-1">
                      {f.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ======================================================= */}
        {/* RIGHT COLUMN (PC) / BOTTOM (MOBILE): PHOTO STRIP & EXPORT */}
        {/* ======================================================= */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col items-center w-full bg-white/65 backdrop-blur-xl rounded-[2rem] p-4 sm:p-5 border border-white shadow-[0_14px_40px_rgba(0,0,128,0.08)]">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#000080]">
                Dải Ảnh Photobooth
              </h2>
              <p className="text-[11px] text-[#3182ce]">
                Bấm vào ô để tải ảnh, kéo thả đổi chỗ hoặc chỉnh góc mặt
              </p>
            </div>
          </div>

          {/* Interactive Photo Strip + Heart '+1?' Button */}
          <PhotoStrip
            config={frameConfig}
            photos={photos}
            stickers={stickers}
            activeShootSlotIndex={activeShootSlotIndex}
            isEditingCustomFrame={isEditingCustomFrame}
            onToggleEditCustomFrame={setIsEditingCustomFrame}
            onDeletePhoto={handleDeletePhoto}
            onUploadPhotoToSlot={handleUploadPhotoToSlot}
            onSwapPhotos={handleSwapPhotos}
            onUpdatePhotoTransform={handleUpdatePhotoTransform}
            onAddExtraSlot={handleAddExtraSlot}
            onRemoveExtraSlot={handleRemoveExtraSlot}
            onUpdateCustomFrame={handleUpdateCustomFrame}
            onUpdateSticker={handleUpdateSticker}
            onDeleteSticker={handleDeleteSticker}
          />

          {/* High-DPI Export Engine Buttons (Download PNG & Copy to Clipboard) */}
          <div className="w-full mt-5 pt-4 border-t border-[#4299e1]/20 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#000080] hover:bg-[#3182ce] disabled:opacity-50 text-white text-xs font-extrabold shadow-[0_6px_20px_rgba(0,0,128,0.22)] transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-[#7FFFD4]" />
              <span>Tải ảnh về máy (PNG)</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleCopyClipboard}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#7FFFD4] hover:bg-[#4299e1] hover:text-white disabled:opacity-50 text-[#000080] border border-[#000080]/20 text-xs font-extrabold shadow-sm transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Sao chép ảnh</span>
            </button>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* BOTTOM-RIGHT FLOATING BUTTON: "TÙY CHỈNH SÂU KHUNG ẢNH"    */}
      {/* ========================================================= */}
      <button
        type="button"
        onClick={() => setIsCustomizerOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#000080] hover:bg-[#3182ce] text-white border-2 border-[#7FFFD4] shadow-[0_12px_35px_rgba(0,0,128,0.35)] transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Sliders className="w-4 h-4 text-[#7FFFD4]" />
        <span className="text-xs sm:text-sm font-extrabold tracking-wide">
          Tùy chỉnh sâu khung ảnh
        </span>
      </button>

      {/* Deep Frame Customizer Drawer */}
      <FrameCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        config={frameConfig}
        stickers={stickers}
        isEditingCustomFrame={isEditingCustomFrame}
        onToggleEditCustomFrame={setIsEditingCustomFrame}
        onUpdateConfig={(updates) =>
          setFrameConfig((prev) => ({ ...prev, ...updates }))
        }
        onSelectLayout={handleSelectLayout}
        onSelectPresetFrame={handleSelectPresetFrame}
        onUploadCustomFrame={handleUploadCustomFrame}
        onUpdateCustomFrame={handleUpdateCustomFrame}
        onRemoveCustomFrame={handleRemoveCustomFrame}
        onAddBuiltinSticker={handleAddBuiltinSticker}
        onUploadCustomSticker={handleUploadCustomSticker}
        onDeleteSticker={handleDeleteSticker}
        onClearAllStickers={() => setStickers([])}
      />
    </div>
  );
};

