import { StickerDefinition } from '../types/photobooth';

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const BUILTIN_STICKERS: StickerDefinition[] = [
  {
    id: 'bubble-cluster',
    name: 'Chùm Bong Bóng',
    category: 'ocean',
    defaultWidth: 68,
    defaultHeight: 68,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
        <circle cx="34" cy="42" r="24" fill="#7FFFD4" fill-opacity="0.55" stroke="#000080" stroke-width="2.5"/>
        <ellipse cx="25" cy="31" rx="7" ry="4" transform="rotate(-28 25 31)" fill="#ffffff" fill-opacity="0.9"/>
        <circle cx="58" cy="24" r="13" fill="#4299e1" fill-opacity="0.55" stroke="#000080" stroke-width="2.2"/>
        <circle cx="54" cy="19" r="3.5" fill="#ffffff" fill-opacity="0.9"/>
        <circle cx="56" cy="58" r="9" fill="#ffffff" fill-opacity="0.75" stroke="#000080" stroke-width="2"/>
      </svg>
    `),
  },
  {
    id: 'aqua-heart',
    name: 'Tim Ngọc Biển',
    category: 'cute',
    defaultWidth: 60,
    defaultHeight: 60,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
        <path d="M40 68C40 68 12 49 12 28C12 17.5 20.5 10 30 10C35.8 10 38.8 13.2 40 16C41.2 13.2 44.2 10 50 10C59.5 10 68 17.5 68 28C68 49 40 68 40 68Z" fill="#7FFFD4" stroke="#000080" stroke-width="3" stroke-linejoin="round"/>
        <path d="M23 23C20 26 19 31 20 34" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'cute-ribbon',
    name: 'Nơ Xanh Thủy Thủ',
    category: 'cute',
    defaultWidth: 72,
    defaultHeight: 58,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 72" fill="none">
        <path d="M38 34L12 14C7 11 4 16 6 24L12 42C14 48 20 49 26 45L38 36Z" fill="#4299e1" stroke="#000080" stroke-width="3" stroke-linejoin="round"/>
        <path d="M52 34L78 14C83 11 86 16 84 24L78 42C76 48 70 49 64 45L52 36Z" fill="#4299e1" stroke="#000080" stroke-width="3" stroke-linejoin="round"/>
        <path d="M39 40L24 64L34 60L42 44" fill="#7FFFD4" stroke="#000080" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M51 40L66 64L56 60L48 44" fill="#7FFFD4" stroke="#000080" stroke-width="2.8" stroke-linejoin="round"/>
        <rect x="36" y="26" width="18" height="16" rx="6" fill="#7FFFD4" stroke="#000080" stroke-width="3"/>
      </svg>
    `),
  },
  {
    id: 'sea-star',
    name: 'Sao Biển Lấp Lánh',
    category: 'ocean',
    defaultWidth: 64,
    defaultHeight: 64,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
        <path d="M40 8L49 27L70 30L54 45L58 66L40 55L22 66L26 45L10 30L31 27L40 8Z" fill="#7FFFD4" stroke="#000080" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="34" cy="36" r="2.5" fill="#000080"/>
        <circle cx="46" cy="36" r="2.5" fill="#000080"/>
        <path d="M36 43C38 45 42 45 44 43" stroke="#000080" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'sparkle-duo',
    name: 'Ánh Sao Ngọc',
    category: 'cute',
    defaultWidth: 64,
    defaultHeight: 64,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
        <path d="M34 8C34 24 22 34 6 34C22 34 34 44 34 60C34 44 46 34 62 34C46 34 34 24 34 8Z" fill="#7FFFD4" stroke="#000080" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M60 44C60 52 54 58 46 58C54 58 60 64 60 72C60 64 66 58 74 58C66 58 60 52 60 44Z" fill="#ffffff" stroke="#000080" stroke-width="2.4" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'seashell-pearl',
    name: 'Vỏ Sò Ngọc Trai',
    category: 'ocean',
    defaultWidth: 66,
    defaultHeight: 62,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
        <path d="M14 48C10 28 24 14 40 14C56 14 70 28 66 48L54 62H26L14 48Z" fill="#4299e1" fill-opacity="0.7" stroke="#000080" stroke-width="3" stroke-linejoin="round"/>
        <path d="M40 14V62M26 18L33 62M54 18L47 62" stroke="#000080" stroke-width="2" stroke-linecap="round"/>
        <circle cx="40" cy="48" r="9" fill="#ffffff" stroke="#000080" stroke-width="2.5"/>
      </svg>
    `),
  },
  {
    id: 'jellyfish-cute',
    name: 'Sứa Nhỏ Trong Veo',
    category: 'ocean',
    defaultWidth: 64,
    defaultHeight: 72,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90" fill="none">
        <path d="M16 42C16 24 26 14 40 14C54 14 64 24 64 42C56 46 48 42 40 45C32 42 24 46 16 42Z" fill="#7FFFD4" fill-opacity="0.85" stroke="#000080" stroke-width="3" stroke-linejoin="round"/>
        <path d="M26 46C23 56 29 64 25 74" stroke="#000080" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M40 46C38 58 43 66 39 78" stroke="#4299e1" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M54 46C57 56 51 64 55 74" stroke="#000080" stroke-width="2.8" stroke-linecap="round"/>
        <circle cx="33" cy="31" r="2.5" fill="#000080"/>
        <circle cx="47" cy="31" r="2.5" fill="#000080"/>
      </svg>
    `),
  },
  {
    id: 'text-ocean-vibe',
    name: 'Chữ Ocean Vibe',
    category: 'text',
    defaultWidth: 112,
    defaultHeight: 44,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 56" fill="none">
        <rect x="4" y="8" width="142" height="40" rx="20" fill="#7FFFD4" stroke="#000080" stroke-width="3"/>
        <text x="75" y="34" text-anchor="middle" fill="#000080" font-family="sans-serif" font-weight="800" font-size="18">OCEAN VIBE ✧</text>
      </svg>
    `),
  },
  {
    id: 'text-besties',
    name: 'Chữ Besties ♡',
    category: 'text',
    defaultWidth: 105,
    defaultHeight: 44,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 56" fill="none">
        <rect x="4" y="8" width="132" height="40" rx="20" fill="#ffffff" stroke="#000080" stroke-width="3"/>
        <text x="70" y="34" text-anchor="middle" fill="#000080" font-family="sans-serif" font-weight="800" font-size="19">Besties ♡</text>
      </svg>
    `),
  },
  {
    id: 'text-smile',
    name: 'Chữ Smile ~',
    category: 'text',
    defaultWidth: 96,
    defaultHeight: 44,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 56" fill="none">
        <rect x="4" y="8" width="122" height="40" rx="12" fill="#4299e1" stroke="#000080" stroke-width="3"/>
        <text x="65" y="34" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="800" font-size="19">SMILE ~ ★</text>
      </svg>
    `),
  },
  {
    id: 'text-cute',
    name: 'Chữ So Cute!',
    category: 'text',
    defaultWidth: 98,
    defaultHeight: 44,
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 56" fill="none">
        <rect x="4" y="8" width="122" height="40" rx="20" fill="#000080" stroke="#7FFFD4" stroke-width="3"/>
        <text x="65" y="34" text-anchor="middle" fill="#7FFFD4" font-family="sans-serif" font-weight="800" font-size="18">SO CUTE !!</text>
      </svg>
    `),
  },
];

