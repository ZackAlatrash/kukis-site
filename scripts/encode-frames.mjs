/* Regenerates the hero frame sets from the source JPEGs.
   Run by hand, output committed — the build already pays for Chromium and has
   no business shelling out to cwebp on every deploy.

   Two sets because the decode path already downscales to 760 on phones: the
   1600 set was 4x the pixels for a picture the phone throws away.

   Usage: node scripts/encode-frames.mjs <src-dir-of-jpgs> */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const src = resolve(process.argv[2] ?? "");
const out = resolve("public/cookie");
const QUALITY = 78;
const SETS = [
  { dir: "760", width: 760 },
  { dir: "1600", width: 1600 },
];

const frames = readdirSync(src).filter((f) => /^f_\d{3}\.jpg$/.test(f)).sort();
if (frames.length === 0) throw new Error(`no f_###.jpg frames in ${src}`);

for (const { dir, width } of SETS) {
  const target = join(out, dir);
  mkdirSync(target, { recursive: true });
  for (const f of frames) {
    execFileSync("cwebp", [
      "-q", String(QUALITY),
      "-resize", String(width), "0",
      "-quiet",
      join(src, f),
      "-o", join(target, f.replace(/\.jpg$/, ".webp")),
    ]);
  }
  console.log(`${dir}: ${frames.length} frames`);
}
