import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(root, "public", "icons");
const src = join(root, "public", "icon.png");
const bg = { r: 18, g: 122, b: 82 };

async function write(name, size) {
  const out = join(iconsDir, name);
  await sharp(src).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}

await write("icon-192.png", 192);
await write("icon-512.png", 512);
await write("apple-touch-icon.png", 180);

const padded = await sharp(src).resize(400, 400).toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 3, background: bg },
})
  .composite([{ input: padded, left: 56, top: 56 }])
  .png()
  .toFile(join(iconsDir, "icon-maskable-512.png"));
console.log("wrote", join(iconsDir, "icon-maskable-512.png"));
