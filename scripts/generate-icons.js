import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0 ^ -1;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const checksum = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(checksum, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgbaBuffer) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    const srcOffset = y * width * 4;
    rgbaBuffer.copy(rawData, rowOffset + 1, srcOffset, srcOffset + width * 4);
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function shieldDistance(nx, ny) {
  if (ny < -0.84 || ny > 0.88) return 999;
  const topDist = -0.84 - ny;

  let maxWidth = 0.80;
  if (ny > -0.05) {
    const t = (ny - (-0.05)) / 0.93;
    maxWidth = 0.80 * (1 - Math.pow(t, 1.45));
  } else if (ny < -0.68) {
    const t = (-ny - 0.68) / 0.16;
    maxWidth = 0.80 - 0.16 * Math.pow(t, 2);
  }

  const hDist = Math.abs(nx) - maxWidth;
  return Math.max(hDist, topDist, ny - 0.88);
}

function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const samples = 4; // 4x4 supersampling
  const step = 1 / samples;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const subX = px + (sx + 0.5) * step;
          const subY = py + (sy + 0.5) * step;

          const nx = (subX / size) * 2 - 1;
          const ny = (subY / size) * 2 - 1;

          const sd = shieldDistance(nx, ny);

          if (sd <= 0) {
            let r = 9, g = 13, b = 22, a = 255;

            // Background vertical gradient
            const bgGrad = (ny + 1) * 0.5;
            r = Math.round(15 * (1 - bgGrad) + 3 * bgGrad);
            g = Math.round(23 * (1 - bgGrad) + 7 * bgGrad);
            b = Math.round(42 * (1 - bgGrad) + 18 * bgGrad);

            // Outer Shield Border
            const borderWidth = size <= 16 ? 0.22 : 0.11;
            if (sd > -borderWidth) {
              const tGrad = (nx + 1 + (ny + 1)) * 0.25;
              r = Math.round(56 * (1 - tGrad) + 37 * tGrad);
              g = Math.round(189 * (1 - tGrad) + 99 * tGrad);
              b = Math.round(248 * (1 - tGrad) + 235 * tGrad);
            } else {
              // Inner Emblem: X + Privacy Untrack Slash
              // Stem 1: Top-Left to Bottom-Right
              const x1 = -0.42, y1 = -0.46;
              const x2 = 0.42, y2 = 0.38;
              const dStem1 = distToSegment(nx, ny, x1, y1, x2, y2);
              const stem1Width = size <= 16 ? 0.16 : 0.12;

              // Stem 2: Top-Right to Bottom-Left
              const x3 = 0.42, y3 = -0.46;
              const x4 = -0.42, y4 = 0.38;
              const dStem2 = distToSegment(nx, ny, x3, y3, x4, y4);
              const stem2Width = size <= 16 ? 0.14 : 0.09;

              // Untrack Clean Slash (Blade severing tracking parameter at bottom-right)
              const slashX1 = 0.12, slashY1 = 0.46;
              const slashX2 = 0.56, slashY2 = 0.10;
              const dSlash = distToSegment(nx, ny, slashX1, slashY1, slashX2, slashY2);
              const slashWidth = size <= 16 ? 0.12 : 0.07;

              // Severed tracking parameter dot (?s=...&t=...)
              const dotDist = Math.hypot(nx - 0.50, ny - 0.40);
              const dotRadius = size <= 16 ? 0.08 : 0.07;

              let isStem1 = dStem1 <= stem1Width;
              let isStem2 = dStem2 <= stem2Width;
              let isSlash = dSlash <= slashWidth;
              let isDot = dotDist <= dotRadius;

              if (isSlash) {
                // Vibrant Emerald Green (#10b981) - clean link slash
                r = 16;
                g = 185;
                b = 129;
              } else if (isDot && size > 16) {
                // Red stripped tracker telemetry indicator dot
                r = 239;
                g = 68;
                b = 68;
              } else if (isStem1 || isStem2) {
                // In 16x16, make the bottom-right severed segment glowing emerald
                if (size <= 16 && nx > 0.15 && ny > 0.1) {
                  r = 16;
                  g = 185;
                  b = 129;
                } else {
                  // Pure crisp white X
                  r = 255;
                  g = 255;
                  b = 255;
                }
              }
            }

            rSum += r;
            gSum += g;
            bSum += b;
            aSum += a;
          }
        }
      }

      const total = samples * samples;
      const pixelIdx = (py * size + px) * 4;
      buf[pixelIdx] = Math.round(rSum / total);
      buf[pixelIdx + 1] = Math.round(gSum / total);
      buf[pixelIdx + 2] = Math.round(bSum / total);
      buf[pixelIdx + 3] = Math.round(aSum / total);
    }
  }

  return encodePng(size, size, buf);
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = renderIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${size}x${size}, ${png.length} bytes)`);
}

console.log('All descriptive UntrackX icons generated successfully.');
