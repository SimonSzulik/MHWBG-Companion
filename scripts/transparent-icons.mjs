/**
 * Make background black transparent in tier gear / material PNG icons.
 * Only edge-connected near-black pixels are removed so interior outlines stay.
 * Run: npm run icons:transparent
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, "../public/icons");

const SKIP = new Set([
  "camp-tab.png",
  "box-tab.png",
  "forge-tab.png",
  "one-star.png",
  "two-star.png",
  "three-star.png",
  "four-star.png",
]);

const TIER_PREFIX = /^(green|yellow|purple|white)-.+\.png$/i;

/** Pixels with R,G,B all below this are treated as background candidates. */
const BLACK_THRESHOLD = 30;

function isBackgroundPixel(data, width, height, channels, x, y) {
  const i = (y * width + x) * channels;
  return (
    data[i] <= BLACK_THRESHOLD &&
    data[i + 1] <= BLACK_THRESHOLD &&
    data[i + 2] <= BLACK_THRESHOLD
  );
}

function floodBackground(data, width, height, channels) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    if (!isBackgroundPixel(data, width, height, channels, x, y)) return;
    visited[idx] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (visited[y * width + x]) {
        const i = (y * width + x) * channels;
        data[i + 3] = 0;
      }
    }
  }
}

async function transparentize(file) {
  const input = await readFile(file);
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  floodBackground(out, info.width, info.height, info.channels);

  await sharp(out, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toFile(file);
}

const entries = await readdir(iconsDir);
const targets = entries.filter(
  (name) => TIER_PREFIX.test(name) && !SKIP.has(name),
);

for (const name of targets) {
  const file = path.join(iconsDir, name);
  await transparentize(file);
  console.log(`transparent: ${name}`);
}

console.log(`Done — ${targets.length} icons processed.`);
