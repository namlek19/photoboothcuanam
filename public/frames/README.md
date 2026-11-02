# Thư mục Khung ảnh có sẵn (`public/frames/`)

Bạn có thể dễ dàng thêm các file khung ảnh `.png` hoặc `.svg` bắt trend (Idol Hàn Quốc, trường học, sự kiện...) vào thư mục `public/frames/` này và khai báo thêm phần tử JSON trong file `src/data/presetFrames.json`:

```json
{
  "id": "ten-khung-moi",
  "name": "Tên hiển thị trên Web",
  "category": "custom_png",
  "description": "Mô tả ngắn",
  "previewColor": "#e0f7fa",
  "accentColor": "#000080",
  "imageUrl": "/frames/ten-file-cua-ban.png",
  "recommendedStyle": {
    "backgroundColor": "#ffffff",
    "bubblePattern": false,
    "padding": 24,
    "gap": 14,
    "borderRadius": 12
  }
}
```

