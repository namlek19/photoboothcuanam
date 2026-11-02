# Gương & Photobooth Online — Minimalist Ocean Bubble 🫧

Ứng dụng web **Soi Gương & Chụp Photobooth Trực Tuyến** hoạt động **100% ở phía Client-side** (không backend, không database, bảo mật quyền riêng tư tuyệt đối) và tối ưu hóa sẵn cấu hình để deploy trực tiếp lên **Vercel**.

## Tính năng nổi bật

1. **Chế độ "Thuần Soi Gương" (Mirror Mode - Mặc định)**:
   - Hiển thị camera lật gương (`scaleX(-1)`) trong khung bo góc lớn, ẩn toàn bộ nút bên trong mặt gương.
   - **Sương mù kính (Fog Effect)**: Phủ hơi nước mờ đục lên mặt gương, dùng chuột (PC) hoặc ngón tay (Mobile) quệt trực tiếp để lau sương (`globalCompositeOperation = 'destination-out'`).
2. **Chế độ "Chụp Photobooth" (Booth Mode)**:
   - **Khung căn chỉnh tỷ lệ**: Đường viền nét đứt (`dashed crop guide`) trên PC tự động co giãn theo đúng tỷ lệ ô ảnh của Layout; trên Mobile tự động căn khung gương khớp tỷ lệ 1 bức ảnh.
   - **Lưu ảnh gốc Full-frame (Non-destructive Capture)**: Lưu toàn bộ khung hình gốc để người dùng tự do kéo (`pan`) hoặc phóng to/thu nhỏ (`zoom`) bên trong từng ô ngay cả sau khi chụp xong.
   - **Đếm ngược (`3s`, `5s`, `8s`) & 2 Chế độ chụp**: Chụp liên tiếp (Auto-shoot) hoặc Chụp từng tấm (Manual) + phím tắt `Space` + tiếng màn trập cơ học Web Audio API.
   - **6 Bộ lọc màu (Live Preview & Hậu kỳ)**: *Bình Thường*, *Mono (Retro)*, *Đen Trắng*, *Mềm Mại*, *Dazz Classic*, *Dazz Instant*.
   - **Dải ảnh tương tác & Nút trái tim `+1?`**: Xóa ảnh từng ô (`X`), tải ảnh từ máy lên từng ô, kéo thả đổi thứ tự ảnh, và bấm nút trái tim `+1?` để thêm ô ảnh mới vào cuối dải.
   - **Tùy chỉnh sâu khung ảnh**:
     - 4 Layout gốc: `1x4`, `2x2`, `2x3`, `Polaroid`.
     - Đổi màu nền khung, họa tiết bong bóng, độ dày viền (`padding`), khoảng cách ô (`gap`), độ bo góc (`border-radius`).
     - Kho khung có sẵn (`src/data/presetFrames.json` & `public/frames/`) + **Tải lên khung của bạn** (căn chỉnh vị trí/tỷ lệ trực tiếp trên khung, chọn lớp đè lên trên hoặc làm nền dưới ảnh).
     - Kho Sticker & tải thêm sticker từ máy lên (kéo, xoay, phóng to/thu nhỏ, xóa trực tiếp).
3. **Export Engine (High-DPI 3x Offscreen Canvas)**:
   - **Tải ảnh về máy (Download PNG)** sắc nét.
   - **Sao chép ảnh (Copy to Clipboard)** qua `ClipboardItem` kèm thông báo xác nhận.

## Chạy dự án ở máy cục bộ

```bash
npm install
npm run dev
```

## Build & Deploy lên Vercel

```bash
npm run build
```
Dự án đã có sẵn file cấu hình `vercel.json` tương thích hoàn toàn với Vercel.

