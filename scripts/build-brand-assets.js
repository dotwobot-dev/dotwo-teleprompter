const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function readPng(filePath) {
  const input = fs.readFileSync(filePath);
  if (!input.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error(`${filePath} is not a PNG`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset < input.length) {
    const length = input.readUInt32BE(offset);
    const type = input.toString("ascii", offset + 4, offset + 8);
    const data = input.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG format in ${filePath}`);
  }

  const bpp = colorType === 6 ? 4 : 3;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const rgba = Buffer.alloc(width * height * 4);
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    inflated.copy(current, 0, sourceOffset, sourceOffset + stride);
    sourceOffset += stride;

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bpp ? current[x - bpp] : 0;
      const up = previous[x] || 0;
      const upLeft = x >= bpp ? previous[x - bpp] || 0 : 0;
      let value = current[x];

      if (filter === 1) value = (value + left) & 0xff;
      if (filter === 2) value = (value + up) & 0xff;
      if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 0xff;
      if (filter === 4) value = (value + paeth(left, up, upLeft)) & 0xff;

      current[x] = value;
    }

    for (let x = 0; x < width; x += 1) {
      const src = x * bpp;
      const dst = (y * width + x) * 4;
      rgba[dst] = current[src];
      rgba[dst + 1] = current[src + 1];
      rgba[dst + 2] = current[src + 2];
      rgba[dst + 3] = colorType === 6 ? current[src + 3] : 255;
    }

    current.copy(previous);
  }

  return { width, height, data: rgba };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function writePng(filePath, image) {
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const rowStart = y * (image.width * 4 + 1);
    raw[rowStart] = 0;
    image.data.copy(raw, rowStart + 1, y * image.width * 4, (y + 1) * image.width * 4);
  }

  const chunks = [
    makeChunk("IHDR", makeIHDR(image.width, image.height)),
    makeChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    makeChunk("IEND", Buffer.alloc(0))
  ];

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.concat([PNG_SIG, ...chunks]));
}

function makeIHDR(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function makeChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return chunk;
}

function removeLightBackground(image) {
  const { width, height, data } = image;
  const bg = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (bg[p]) return;
    const i = p * 4;
    if (!isBackgroundLike(data[i], data[i + 1], data[i + 2], data[i + 3])) return;
    bg[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  for (let q = 0; q < queue.length; q += 1) {
    const p = queue[q];
    const x = p % width;
    const y = Math.floor(p / width);
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const out = Buffer.from(data);
  for (let p = 0; p < width * height; p += 1) {
    const i = p * 4;
    if (bg[p] || isWhiteCutout(out[i], out[i + 1], out[i + 2])) {
      out[i + 3] = 0;
    }
  }

  removeTransparentFringe(out, width, height);

  return trimTransparent({ width, height, data: out }, 8);
}

function isBackgroundLike(r, g, b, a) {
  if (a < 12) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (lum > 136 && sat < 86) || (r > 178 && g > 178 && b > 178);
}

function isWhiteCutout(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 188 && sat < 82;
}

function removeTransparentFringe(data, width, height) {
  for (let pass = 0; pass < 8; pass += 1) {
    const toClear = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const p = y * width + x;
        const i = p * 4;
        if (data[i + 3] <= 8) continue;
        if (!isNeutralFringe(data[i], data[i + 1], data[i + 2])) continue;

        const hasTransparentNeighbor =
          data[((y - 1) * width + x) * 4 + 3] <= 8 ||
          data[((y + 1) * width + x) * 4 + 3] <= 8 ||
          data[(y * width + x - 1) * 4 + 3] <= 8 ||
          data[(y * width + x + 1) * 4 + 3] <= 8;

        if (hasTransparentNeighbor) toClear.push(i);
      }
    }

    if (!toClear.length) break;
    for (const i of toClear) {
      data[i + 3] = 0;
    }
  }
}

function isNeutralFringe(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return sat < 52 && lum > 42;
}

function trimTransparent(image, margin) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.data[(y * image.width + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return image;

  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(image.width - 1, maxX + margin);
  maxY = Math.min(image.height - 1, maxY + margin);

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const src = ((minY + y) * image.width + minX) * 4;
    image.data.copy(data, y * width * 4, src, src + width * 4);
  }
  return { width, height, data };
}

function resize(image, width, height) {
  const data = Buffer.alloc(width * height * 4);
  const scaleX = image.width / width;
  const scaleY = image.height / height;

  for (let y = 0; y < height; y += 1) {
    const sy = (y + 0.5) * scaleY - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(image.height - 1, y0 + 1);
    const fy = sy - y0;

    for (let x = 0; x < width; x += 1) {
      const sx = (x + 0.5) * scaleX - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(image.width - 1, x0 + 1);
      const fx = sx - x0;
      const dst = (y * width + x) * 4;

      for (let c = 0; c < 4; c += 1) {
        const p00 = image.data[(y0 * image.width + x0) * 4 + c];
        const p10 = image.data[(y0 * image.width + x1) * 4 + c];
        const p01 = image.data[(y1 * image.width + x0) * 4 + c];
        const p11 = image.data[(y1 * image.width + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bottom = p01 + (p11 - p01) * fx;
        data[dst + c] = Math.round(top + (bottom - top) * fy);
      }
    }
  }

  return { width, height, data };
}

function roundedRectMask(width, height, radius, x, y) {
  const rx = Math.min(x, width - 1 - x);
  const ry = Math.min(y, height - 1 - y);
  if (rx >= radius || ry >= radius) return 1;
  const dx = radius - rx;
  const dy = radius - ry;
  return dx * dx + dy * dy <= radius * radius ? 1 : 0;
}

function makeSolid(width, height, color, roundedRadius = 0) {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const mask = roundedRadius ? roundedRectMask(width, height, roundedRadius, x, y) : 1;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = Math.round(color[3] * mask);
    }
  }
  return { width, height, data };
}

function addGlow(canvas, image, x, y, radius, color) {
  const alpha = new Float32Array(canvas.width * canvas.height);
  for (let sy = 0; sy < image.height; sy += 1) {
    for (let sx = 0; sx < image.width; sx += 1) {
      const a = image.data[(sy * image.width + sx) * 4 + 3] / 255;
      if (a <= 0) continue;
      const cx = x + sx;
      const cy = y + sy;
      if (cx >= 0 && cy >= 0 && cx < canvas.width && cy < canvas.height) {
        alpha[cy * canvas.width + cx] = Math.max(alpha[cy * canvas.width + cx], a);
      }
    }
  }

  const blurred = boxBlur(alpha, canvas.width, canvas.height, radius);
  for (let p = 0; p < blurred.length; p += 1) {
    const glowAlpha = Math.min(0.55, blurred[p] * color[3]);
    if (glowAlpha <= 0.003) continue;
    const i = p * 4;
    blendPixel(canvas.data, i, color[0], color[1], color[2], glowAlpha * 255);
  }
}

function boxBlur(input, width, height, radius) {
  let tmp = new Float32Array(input.length);
  let out = new Float32Array(input.length);
  const size = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let x = -radius; x <= radius; x += 1) {
      sum += input[y * width + clamp(x, 0, width - 1)];
    }
    for (let x = 0; x < width; x += 1) {
      tmp[y * width + x] = sum / size;
      sum -= input[y * width + clamp(x - radius, 0, width - 1)];
      sum += input[y * width + clamp(x + radius + 1, 0, width - 1)];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = -radius; y <= radius; y += 1) {
      sum += tmp[clamp(y, 0, height - 1) * width + x];
    }
    for (let y = 0; y < height; y += 1) {
      out[y * width + x] = sum / size;
      sum -= tmp[clamp(y - radius, 0, height - 1) * width + x];
      sum += tmp[clamp(y + radius + 1, 0, height - 1) * width + x];
    }
  }

  return out;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function composite(canvas, image, x, y) {
  for (let sy = 0; sy < image.height; sy += 1) {
    for (let sx = 0; sx < image.width; sx += 1) {
      const dx = x + sx;
      const dy = y + sy;
      if (dx < 0 || dy < 0 || dx >= canvas.width || dy >= canvas.height) continue;
      const src = (sy * image.width + sx) * 4;
      const dst = (dy * canvas.width + dx) * 4;
      blendPixel(canvas.data, dst, image.data[src], image.data[src + 1], image.data[src + 2], image.data[src + 3]);
    }
  }
}

function blendPixel(data, i, r, g, b, a) {
  const sa = a / 255;
  const da = data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  data[i] = Math.round((r * sa + data[i] * da * (1 - sa)) / oa);
  data[i + 1] = Math.round((g * sa + data[i + 1] * da * (1 - sa)) / oa);
  data[i + 2] = Math.round((b * sa + data[i + 2] * da * (1 - sa)) / oa);
  data[i + 3] = Math.round(oa * 255);
}

function buildTransparentWithGlow(source, margin, glowRadius, glowColor) {
  const clean = removeLightBackground(source);
  const canvas = makeSolid(clean.width + margin * 2, clean.height + margin * 2, [0, 0, 0, 0]);
  addGlow(canvas, clean, margin, margin, glowRadius, glowColor);
  composite(canvas, clean, margin, margin);
  return canvas;
}

function enhanceLogoForDarkBg(image) {
  const data = Buffer.from(image.data);
  const lowerBandStart = Math.floor(image.height * 0.68);

  for (let y = lowerBandStart; y < image.height; y += 1) {
    const bandStrength = (y - lowerBandStart) / Math.max(1, image.height - lowerBandStart);
    for (let x = 0; x < image.width; x += 1) {
      const i = (y * image.width + x) * 4;
      if (data[i + 3] < 80) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const blueBias = Math.max(0, b - Math.max(r, g));
      const strength = 0.22 + bandStrength * 0.16 + Math.min(0.22, blueBias / 255);

      data[i] = Math.min(255, Math.round(r + 18 * strength));
      data[i + 1] = Math.min(255, Math.round(g + 42 * strength));
      data[i + 2] = Math.min(255, Math.round(b + 78 * strength));
    }
  }

  return { width: image.width, height: image.height, data };
}

function buildLogo(source) {
  const clean = enhanceLogoForDarkBg(removeLightBackground(source));
  const margin = 8;
  const canvas = makeSolid(clean.width + margin * 2, clean.height + margin * 2, [0, 0, 0, 0]);
  addGlow(canvas, clean, margin, margin, 4, [74, 178, 255, 0.1]);
  composite(canvas, clean, margin, margin);
  return canvas;
}

function buildAppIcon(source) {
  const clean = removeLightBackground(source);
  const size = 1024;
  const background = [15, 19, 26, 255];
  const canvas = makeSolid(size, size, background, 220);
  const targetWidth = 860;
  const targetHeight = Math.round(clean.height * (targetWidth / clean.width));
  const scaled = resize(clean, targetWidth, targetHeight);
  const x = Math.round((size - scaled.width) / 2);
  const y = Math.round((size - scaled.height) / 2 + 8);

  addGlow(canvas, scaled, x, y, 16, [72, 184, 255, 0.38]);
  addGlow(canvas, scaled, x, y, 7, [104, 255, 185, 0.14]);
  restoreInternalCutouts(canvas, scaled, x, y, background);
  composite(canvas, scaled, x, y);
  return canvas;
}

function restoreInternalCutouts(canvas, image, x, y, color) {
  const transparent = new Uint8Array(image.width * image.height);
  const exterior = new Uint8Array(image.width * image.height);
  const queue = [];

  const push = (px, py) => {
    if (px < 0 || py < 0 || px >= image.width || py >= image.height) return;
    const p = py * image.width + px;
    if (!transparent[p] || exterior[p]) return;
    exterior[p] = 1;
    queue.push(p);
  };

  for (let py = 0; py < image.height; py += 1) {
    for (let px = 0; px < image.width; px += 1) {
      const p = py * image.width + px;
      const alpha = image.data[p * 4 + 3];
      const i = p * 4;
      if (alpha <= 8 || isCutoutShadow(image.data[i], image.data[i + 1], image.data[i + 2], alpha)) {
        transparent[p] = 1;
      }
    }
  }

  for (let px = 0; px < image.width; px += 1) {
    push(px, 0);
    push(px, image.height - 1);
  }
  for (let py = 0; py < image.height; py += 1) {
    push(0, py);
    push(image.width - 1, py);
  }

  for (let q = 0; q < queue.length; q += 1) {
    const p = queue[q];
    const px = p % image.width;
    const py = Math.floor(p / image.width);
    push(px + 1, py);
    push(px - 1, py);
    push(px, py + 1);
    push(px, py - 1);
  }

  for (let py = 0; py < image.height; py += 1) {
    for (let px = 0; px < image.width; px += 1) {
      const p = py * image.width + px;
      if (!transparent[p] || exterior[p]) continue;
      const dx = x + px;
      const dy = y + py;
      if (dx < 0 || dy < 0 || dx >= canvas.width || dy >= canvas.height) continue;
      const i = (dy * canvas.width + dx) * 4;
      canvas.data[i] = color[0];
      canvas.data[i + 1] = color[1];
      canvas.data[i + 2] = color[2];
      canvas.data[i + 3] = color[3];
    }
  }
}

function isCutoutShadow(r, g, b, a) {
  if (a <= 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return sat < 72 && lum < 170;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const iconSource = readPng(path.join(root, "build/brand/dotwo-teleprompter-icon-candidate.png"));
  const logoSource = readPng(path.join(root, "build/brand/dotwo-teleprompter-logo-candidate.png"));

  const transparentIcon = buildTransparentWithGlow(iconSource, 20, 10, [74, 178, 255, 0.24]);
  const appIcon = buildAppIcon(iconSource);
  const logo = buildLogo(logoSource);

  writePng(path.join(root, "build/brand/dotwo-teleprompter-icon-transparent.png"), transparentIcon);
  writePng(path.join(root, "build/icons/app-icon.png"), appIcon);
  writePng(path.join(root, "build/brand/dotwo-teleprompter-logo-transparent.png"), logo);
  writePng(path.join(root, "src/assets/dotwo-teleprompter-logo.png"), logo);
}

main();
