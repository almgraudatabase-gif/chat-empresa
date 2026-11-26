// Genera iconos PWA y 12 stickers WebP de ejemplo. Uso: npm run assets
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const bubble = (size, pad = 0, bg = '#075e54') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${bg}"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <path d="M256 96c-88 0-160 62-160 140 0 44 22 83 58 109l-14 64 70-34c15 3 30 5 46 5 88 0 160-62 160-140S344 96 256 96z" fill="#fff"/>
    <circle cx="196" cy="236" r="18" fill="${bg}"/><circle cx="256" cy="236" r="18" fill="${bg}"/><circle cx="316" cy="236" r="18" fill="${bg}"/>
  </g>
</svg>`;

await sharp(Buffer.from(bubble(192, 0))).png().toFile('public/icons/icon-192.png');
await sharp(Buffer.from(bubble(512, 0))).png().toFile('public/icons/icon-512.png');
await sharp(Buffer.from(bubble(512, 70))).png().toFile('public/icons/maskable-512.png');
writeFileSync('public/favicon.svg', bubble(64, 0).replace('width="64" height="64"', 'width="64" height="64"'));

const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="14" fill="#333"/>`;
const faces = {
  feliz: `${eye(180, 210)}${eye(332, 210)}<path d="M160 290q96 110 192 0" stroke="#333" stroke-width="16" fill="none" stroke-linecap="round"/>`,
  risa: `<path d="M150 215q30-30 60 0M302 215q30-30 60 0" stroke="#333" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M150 285h212q-10 110-106 110t-106-110z" fill="#7a1f1f"/>`,
  guino: `${eye(180, 210)}<path d="M302 212h60" stroke="#333" stroke-width="14" stroke-linecap="round"/><path d="M160 290q96 100 192 0" stroke="#333" stroke-width="16" fill="none" stroke-linecap="round"/>`,
  amor: `<path d="M180 240l-34-34a24 24 0 0 1 34-34 24 24 0 0 1 34 34zM332 240l-34-34a24 24 0 0 1 34-34 24 24 0 0 1 34 34z" fill="#e0245e"/><path d="M160 295q96 100 192 0" stroke="#333" stroke-width="16" fill="none" stroke-linecap="round"/>`,
  genial: `<rect x="130" y="185" width="110" height="60" rx="20" fill="#222"/><rect x="272" y="185" width="110" height="60" rx="20" fill="#222"/><path d="M240 205h32" stroke="#222" stroke-width="12"/><path d="M165 300q91 70 182 0" stroke="#333" stroke-width="16" fill="none" stroke-linecap="round"/>`,
  triste: `${eye(180, 220)}${eye(332, 220)}<path d="M170 360q86-70 172 0" stroke="#333" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M180 250q-10 40 0 60" stroke="#4aa3ff" stroke-width="14" fill="none" stroke-linecap="round"/>`,
  enojado: `<path d="M140 170l80 30M372 170l-80 30" stroke="#333" stroke-width="16" stroke-linecap="round"/>${eye(180, 235)}${eye(332, 235)}<path d="M180 360q76-60 152 0" stroke="#333" stroke-width="16" fill="none" stroke-linecap="round"/>`,
  sorpresa: `${eye(180, 205)}${eye(332, 205)}<ellipse cx="256" cy="330" rx="38" ry="52" fill="#333"/>`,
  sueno: `<path d="M150 215q30 25 60 0M302 215q30 25 60 0" stroke="#333" stroke-width="14" fill="none" stroke-linecap="round"/><ellipse cx="256" cy="320" rx="28" ry="22" fill="#333"/><text x="380" y="130" font-size="70" font-family="Arial" font-weight="bold" fill="#3b6fd6">Z</text>`,
  ok: `<circle cx="256" cy="256" r="150" fill="#2fb344"/><path d="M180 262l55 55 100-110" stroke="#fff" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  estrella: `<polygon points="256,80 305,200 435,210 335,295 367,425 256,355 145,425 177,295 77,210 207,200" fill="#ffb300" stroke="#e08a00" stroke-width="10" stroke-linejoin="round"/>`,
  corazon: `<path d="M256 420L110 280a85 85 0 0 1 146-90 85 85 0 0 1 146 90z" fill="#e0245e"/>`,
};
const noFace = new Set(['ok', 'estrella', 'corazon']);
for (const [name, body] of Object.entries(faces)) {
  const base = noFace.has(name) ? '' : `<circle cx="256" cy="256" r="220" fill="#ffd43b" stroke="#e8a900" stroke-width="12"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${base}${body}</svg>`;
  await sharp(Buffer.from(svg)).resize(256, 256).webp({ quality: 90 }).toFile(`public/stickers/${name}.webp`);
}
console.log('Iconos y stickers generados.');
