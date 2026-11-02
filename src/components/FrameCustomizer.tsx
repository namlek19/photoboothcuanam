import React, { useRef, useState } from 'react';
import {
  X,
  LayoutGrid,
  Frame,
  Sparkles,
  Upload,
  Trash2,
  Move,
  RotateCcw,
  Layers,
  Check,
  Sliders,
} from 'lucide-react';
import {
  FrameConfig,
  LayoutId,
  PlacedSticker,
  PresetFrameItem,
  StickerDefinition,
} from '../types/photobooth';
import { LAYOUTS } from '../utils/stripGeometry';
import { BUILTIN_STICKERS } from '../data/stickers';
import presetFramesData from '../data/presetFrames.json';

const PRESET_FRAMES = presetFramesData as PresetFrameItem[];

const OCEAN_COLOR_SWATCHES = [
  { name: 'Trắng Ngọc', color: '#ffffff' },
  { name: 'Sương Biển', color: '#f0fdfa' },
  { name: 'Aquamarine', color: '#7FFFD4' },
  { name: 'Xanh Băng', color: '#e0f2fe' },
  { name: 'Xanh Dương Sáng', color: '#4299e1' },
  { name: 'Xanh Biển Đậm', color: '#3182ce' },
  { name: 'Xanh Nước Biển', color: '#0000FF' },
  { name: 'Navy Hải Quân', color: '#000080' },
  { name: 'Hồng San Hô', color: '#fdf2f8' },
  { name: 'Đen Film 35mm', color: '#0f172a' },
];

interface FrameCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  config: FrameConfig;
  stickers: PlacedSticker[];
  isEditingCustomFrame: boolean;
  onToggleEditCustomFrame: (editing: boolean) => void;
  onUpdateConfig: (updates: Partial<FrameConfig>) => void;
  onSelectLayout: (layoutId: LayoutId) => void;
  onSelectPresetFrame: (preset: PresetFrameItem) => void;
  onUploadCustomFrame: (file: File) => void;
  onUpdateCustomFrame: (
    updates: Partial<NonNullable<FrameConfig['customFrame']>>
  ) => void;
  onRemoveCustomFrame: () => void;
  onAddBuiltinSticker: (sticker: StickerDefinition) => void;
  onUploadCustomSticker: (file: File) => void;
  onDeleteSticker: (stickerId: string) => void;
  onClearAllStickers: () => void;
}

type CustomizerTab = 'layout' | 'frames' | 'stickers';

export const FrameCustomizer: React.FC<FrameCustomizerProps> = ({
  isOpen,
  onClose,
  config,
  stickers,
  isEditingCustomFrame,
  onToggleEditCustomFrame,
  onUpdateConfig,
  onSelectLayout,
  onSelectPresetFrame,
  onUploadCustomFrame,
  onUpdateCustomFrame,
  onRemoveCustomFrame,
  onAddBuiltinSticker,
  onUploadCustomSticker,
  onDeleteSticker,
  onClearAllStickers,
}) => {
  const [activeTab, setActiveTab] = useState<CustomizerTab>('layout');
  const customFrameInputRef = useRef<HTMLInputElement | null>(null);
  const customStickerInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex justify-end md:justify-start">
      {/* Subtle backdrop on mobile only so desktop users can see and interact with the PhotoStrip on the right */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#000080]/20 backdrop-blur-[1px] pointer-events-auto md:bg-transparent md:backdrop-blur-none md:pointer-events-none"
      />

      {/* Drawer Panel */}
      <aside className="relative z-50 pointer-events-auto w-full max-w-md h-full bg-white/95 backdrop-blur-2xl border-r border-l border-[#7FFFD4] shadow-[0_20px_70px_rgba(0,0,128,0.22)] flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#ebf8ff] via-[#e6fffa] to-white border-b border-[#4299e1]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#000080] text-[#7FFFD4] flex items-center justify-center shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#000080]">
                Tùy Chỉnh Sâu Khung Ảnh
              </h2>
              <p className="text-[11px] text-[#3182ce] font-medium">
                Thay đổi áp dụng trực tiếp lên dải ảnh bên cạnh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-[#7FFFD4]/40 text-[#000080] border border-[#000080]/10 transition-colors"
            title="Đóng bảng tùy chỉnh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-[#f0fdfa] border-b border-[#4299e1]/20">
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'layout'
                ? 'bg-[#000080] text-white shadow-sm'
                : 'text-[#000080]/75 hover:bg-[#7FFFD4]/35'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Layout & Viền</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('frames')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'frames'
                ? 'bg-[#000080] text-white shadow-sm'
                : 'text-[#000080]/75 hover:bg-[#7FFFD4]/35'
            }`}
          >
            <Frame className="w-3.5 h-3.5" />
            <span>Kho Khung</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stickers'
                ? 'bg-[#000080] text-white shadow-sm'
                : 'text-[#000080]/75 hover:bg-[#7FFFD4]/35'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sticker ({stickers.length})</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ===================================================== */}
          {/* TAB 1: LAYOUT GỐC & THÔNG SỐ KHUNG                    */}
          {/* ===================================================== */}
          {activeTab === 'layout' && (
            <>
              {/* 1. Chọn Layout gốc */}
              <section>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#000080] mb-2.5">
                  1. Chọn Layout Gốc
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {LAYOUTS.map((layout) => {
                    const selected = config.layoutId === layout.id;
                    return (
                      <button
                        key={layout.id}
                        type="button"
                        onClick={() => onSelectLayout(layout.id)}
                        className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left transition-all ${
                          selected
                            ? 'border-[#000080] bg-[#7FFFD4]/35 shadow-sm'
                            : 'border-[#4299e1]/25 bg-white hover:border-[#4299e1]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-extrabold text-[#000080]">
                            {layout.name}
                          </span>
                          {selected && (
                            <span className="w-4 h-4 rounded-full bg-[#000080] text-[#7FFFD4] flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#3182ce] mt-0.5">
                          {layout.shortDesc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 2. Đổi màu nền khung & Họa tiết bong bóng */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#000080]">
                    2. Màu Nền Khung
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3182ce] cursor-pointer">
                    <span>Màu tự chọn:</span>
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) =>
                        onUpdateConfig({ backgroundColor: e.target.value })
                      }
                      className="w-6 h-6 rounded-lg border border-[#000080]/30 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {OCEAN_COLOR_SWATCHES.map((swatch) => {
                    const active =
                      config.backgroundColor.toLowerCase() ===
                      swatch.color.toLowerCase();
                    return (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() =>
                          onUpdateConfig({ backgroundColor: swatch.color })
                        }
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all ${
                          active
                            ? 'border-[#000080] ring-2 ring-[#7FFFD4] bg-[#f0fdfa]'
                            : 'border-slate-200 hover:border-[#4299e1]'
                        }`}
                        title={swatch.name}
                      >
                        <span
                          className="w-7 h-7 rounded-full border border-black/15 shadow-inner"
                          style={{ backgroundColor: swatch.color }}
                        />
                        <span className="text-[10px] font-semibold text-[#000080] truncate w-full text-center">
                          {swatch.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Họa tiết bong bóng toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f0fdfa] border border-[#7FFFD4]">
                  <div>
                    <p className="text-xs font-bold text-[#000080]">
                      Họa tiết bong bóng biển
                    </p>
                    <p className="text-[11px] text-[#3182ce]">
                      Điểm xuyết bong bóng nước trong suốt trên nền khung
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({ bubblePattern: !config.bubblePattern })
                    }
                    className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                      config.bubblePattern ? 'bg-[#000080]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-[#7FFFD4] transition-transform ${
                        config.bubblePattern ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </section>

              {/* 3. Sliders: Padding, Gap, Border-Radius */}
              <section className="space-y-4">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#000080]">
                  3. Thông Số Kích Thước Khung
                </label>

                {/* Độ dày viền (Padding) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#000080]">
                    <span>Độ dày viền khung (Padding)</span>
                    <span className="text-[#3182ce]">{config.padding} px</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={44}
                    value={config.padding}
                    onChange={(e) =>
                      onUpdateConfig({ padding: Number(e.target.value) })
                    }
                    className="w-full accent-[#000080] cursor-pointer"
                  />
                </div>

                {/* Khoảng cách giữa các ô (Gap) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#000080]">
                    <span>Khoảng cách giữa các ô (Gap)</span>
                    <span className="text-[#3182ce]">{config.gap} px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={32}
                    value={config.gap}
                    onChange={(e) =>
                      onUpdateConfig({ gap: Number(e.target.value) })
                    }
                    className="w-full accent-[#000080] cursor-pointer"
                  />
                </div>

                {/* Độ bo góc ô ảnh (Border-Radius) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#000080]">
                    <span>Độ bo góc ô ảnh (Border Radius)</span>
                    <span className="text-[#3182ce]">{config.borderRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    value={config.borderRadius}
                    onChange={(e) =>
                      onUpdateConfig({ borderRadius: Number(e.target.value) })
                    }
                    className="w-full accent-[#000080] cursor-pointer"
                  />
                </div>
              </section>

              {/* 4. Dòng chữ kỷ niệm & Ngày chụp */}
              <section className="space-y-2.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#000080]">
                  4. Chữ Ký Chân Khung Ảnh
                </label>
                <input
                  type="text"
                  maxLength={36}
                  value={config.footerText}
                  onChange={(e) =>
                    onUpdateConfig({ footerText: e.target.value })
                  }
                  placeholder="Nhập chữ ký dưới khung ảnh..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#4299e1]/40 focus:border-[#000080] outline-none text-xs font-semibold text-[#000080]"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-[#000080] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showDate}
                    onChange={(e) =>
                      onUpdateConfig({ showDate: e.target.checked })
                    }
                    className="rounded accent-[#000080] w-4 h-4"
                  />
                  <span>Hiển thị ngày chụp tự động dưới chân khung</span>
                </label>
              </section>
            </>
          )}

          {/* ===================================================== */}
          {/* TAB 2: KHO KHUNG CÓ SẴN & TẢI LÊN KHUNG CỦA BẠN       */}
          {/* ===================================================== */}
          {activeTab === 'frames' && (
            <>
              {/* Tính năng "Tải lên khung của bạn" */}
              <section className="p-4 rounded-2xl bg-gradient-to-br from-[#ebf8ff] to-[#e6fffa] border-2 border-[#4299e1]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#000080]">
                      Tải Lên Khung Của Bạn
                    </h3>
                    <p className="text-[11px] text-[#3182ce]">
                      Hỗ trợ PNG trong suốt hoặc JPG, căn chỉnh tự do trực tiếp
                    </p>
                  </div>

                  <input
                    ref={customFrameInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadCustomFrame(file);
                      }
                      e.target.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => customFrameInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#000080] hover:bg-[#3182ce] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#7FFFD4]" />
                    <span>{config.customFrame ? 'Đổi khung' : 'Tải khung lên'}</span>
                  </button>
                </div>

                {/* Controls when Custom Frame is uploaded */}
                {config.customFrame && (
                  <div className="pt-2 border-t border-[#4299e1]/25 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#000080] truncate">
                        Đã tải: {config.customFrame.name}
                      </span>
                      <button
                        type="button"
                        onClick={onRemoveCustomFrame}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa khung</span>
                      </button>
                    </div>

                    {/* Layer Toggle: Đè lên trên vs Nền phía dưới */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#000080] flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#3182ce]" />
                        Thứ tự lớp khung tải lên:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCustomFrame({ layer: 'overlay' })
                          }
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                            config.customFrame.layer === 'overlay'
                              ? 'bg-[#000080] text-white border-[#000080]'
                              : 'bg-white text-[#000080] border-[#4299e1]/30'
                          }`}
                        >
                          Đè lên trên ảnh
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCustomFrame({ layer: 'background' })
                          }
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                            config.customFrame.layer === 'background'
                              ? 'bg-[#000080] text-white border-[#000080]'
                              : 'bg-white text-[#000080] border-[#4299e1]/30'
                          }`}
                        >
                          Làm nền dưới ảnh
                        </button>
                      </div>
                    </div>

                    {/* Direct Drag on Web Strip Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        onToggleEditCustomFrame(!isEditingCustomFrame)
                      }
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                        isEditingCustomFrame
                          ? 'bg-[#7FFFD4] text-[#000080] ring-2 ring-[#000080]'
                          : 'bg-white hover:bg-[#7FFFD4]/40 text-[#000080] border border-[#000080]/20'
                      }`}
                    >
                      <Move className="w-4 h-4" />
                      <span>
                        {isEditingCustomFrame
                          ? 'Đang bật kéo trực tiếp trên khung (Bấm để khóa)'
                          : 'Bật kéo vị trí trực tiếp trên khung ảnh'}
                      </span>
                    </button>

                    {/* Scale / Position Sliders */}
                    <div className="space-y-2 bg-white/80 p-3 rounded-xl border border-[#4299e1]/20">
                      <div className="flex justify-between text-[11px] font-bold text-[#000080]">
                        <span>Phóng to / Thu nhỏ khung</span>
                        <span>{Math.round(config.customFrame.scale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.3}
                        max={2.5}
                        step={0.02}
                        value={config.customFrame.scale}
                        onChange={(e) =>
                          onUpdateCustomFrame({
                            scale: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-[#000080]"
                      />

                      <div className="flex justify-between text-[11px] font-bold text-[#000080] pt-1">
                        <span>Độ đậm (Opacity)</span>
                        <span>
                          {Math.round((config.customFrame.opacity ?? 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.2}
                        max={1}
                        step={0.05}
                        value={config.customFrame.opacity ?? 1}
                        onChange={(e) =>
                          onUpdateCustomFrame({
                            opacity: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-[#000080]"
                      />

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateCustomFrame({
                              x: 0,
                              y: 0,
                              scale: 1,
                              opacity: 1,
                            })
                          }
                          className="flex items-center gap-1 text-[11px] font-bold text-[#3182ce] hover:text-[#000080]"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Căn giữa chuẩn (Reset)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Kho Khung Ảnh Có Sẵn (JSON-driven) */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#000080]">
                    Kho Khung Ảnh Có Sẵn
                  </label>
                  <span className="text-[10px] font-semibold text-[#3182ce]">
                    public/frames/ JSON
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {PRESET_FRAMES.map((preset) => {
                    const isSelected = config.presetFrameId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onSelectPresetFrame(preset)}
                        className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[#000080] bg-[#7FFFD4]/35 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-[#4299e1]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span
                            className="w-6 h-6 rounded-lg border border-black/15 shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: preset.previewColor }}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: preset.accentColor }}
                            />
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-[#000080] text-[#7FFFD4] text-[10px] font-bold">
                              Đang dùng
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-extrabold text-[#000080]">
                          {preset.name}
                        </p>
                        <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* ===================================================== */}
          {/* TAB 3: STICKER & TRANG TRÍ TỰ DO                      */}
          {/* ===================================================== */}
          {activeTab === 'stickers' && (
            <>
              {/* Upload Custom Sticker from Device */}
              <section className="p-4 rounded-2xl bg-[#f0fdfa] border-2 border-[#7FFFD4] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#000080]">
                    Tải Thêm Sticker Từ Máy Lên
                  </h3>
                  <p className="text-[11px] text-[#3182ce]">
                    Chọn ảnh PNG/JPG bất kỳ làm sticker trang trí
                  </p>
                </div>

                <input
                  ref={customStickerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadCustomSticker(file);
                    }
                    e.target.value = '';
                  }}
                />

                <button
                  type="button"
                  onClick={() => customStickerInputRef.current?.click()}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#000080] hover:bg-[#3182ce] text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-[#7FFFD4]" />
                  <span>Tải Sticker</span>
                </button>
              </section>

              {/* Builtin Sticker Catalog */}
              <section className="space-y-2.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#000080]">
                  Kho Sticker Dễ Thương (Bấm để thêm vào khung)
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  {BUILTIN_STICKERS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onAddBuiltinSticker(st)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white hover:bg-[#7FFFD4]/30 border border-slate-200 hover:border-[#4299e1] transition-all group"
                    >
                      <img
                        src={st.imageUrl}
                        alt={st.name}
                        className="w-11 h-11 object-contain group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] font-bold text-[#000080] mt-1.5 truncate w-full text-center">
                        {st.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* List of Active Stickers on Strip */}
              {stickers.length > 0 && (
                <section className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#000080]">
                      Sticker đang gắn ({stickers.length})
                    </span>
                    <button
                      type="button"
                      onClick={onClearAllStickers}
                      className="text-[11px] font-bold text-red-600 hover:underline"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <p className="text-[11px] text-[#3182ce]">
                    Mẹo: Kéo thả trực tiếp sticker trên dải ảnh để di chuyển, xoay hoặc phóng to/thu nhỏ.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {stickers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#ebf8ff] border border-[#4299e1]/30 text-[11px] font-bold text-[#000080]"
                      >
                        <span className="truncate max-w-[100px]">{s.name}</span>
                        <button
                          type="button"
                          onClick={() => onDeleteSticker(s.id)}
                          className="p-0.5 rounded-full hover:bg-red-100 text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-[#f0fdfa] border-t border-[#4299e1]/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#000080] hover:bg-[#3182ce] text-white text-xs font-extrabold shadow-md transition-all"
          >
            Hoàn Tất Tùy Chỉnh
          </button>
        </div>
      </aside>
    </div>
  );
};

