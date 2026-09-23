/* Stitches the captured scenes into one narrated 1080p MP4 for the listing.
 *
 *   cd kukis-site && node scripts/build-screencast.mjs
 *
 * Captions are PNG overlays, not drawtext: this ffmpeg has no libfreetype, and
 * ImageMagick gives better type anyway.
 *
 * Narration is Kokoro, a locally-run Apache-2.0 neural TTS — the cut is
 * built so a human recording can replace it without re-editing: each segment
 * is sized from its own narration, so swapping the audio keeps every caption
 * and every scene exactly where it is. Record the lines in VOICEOVER order,
 * drop them in scripts/voiceover/, and re-run.
 *
 * The music is generated here rather than downloaded: a listing is a public,
 * commercial use, and an original drone is the only bed whose licence is not
 * in question. It sits ~27dB down and ducks under speech.
 */
import { execFile } from "node:child_process";
import { mkdir, rm, access } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve } from "node:path";

const run = promisify(execFile);
const SCENES = resolve(process.cwd(), "scenes");
const WORK = resolve(process.cwd(), ".screencast-build");
const OUT = resolve(process.cwd(), "screencast");
/** Drop human-recorded lines here as 01.wav, 02.wav … to replace the synthetic voice. */
const HUMAN_VO = resolve(process.cwd(), "scripts/voiceover");

const FONT = "/System/Library/Fonts/Supplemental/Arial.ttf";
const FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
/**
 * Kokoro (Apache 2.0, runs locally, no account) rather than macOS `say`, which
 * sounds synthetic enough to cheapen the listing. VO_VOICE takes any Kokoro
 * voice — af_* are American, bf_* British.
 */
const VOICE = process.env.VO_VOICE || "af_heart";
const VOICE_SPEED = process.env.VO_SPEED || "1.0";
const KOKORO_PY = resolve(process.cwd(), ".venv-tts/bin/python");

const BARK = "#2C1E14";
const CREAM = "#E4D6C6";
const AMBER = "#DEA255";

const LEAD_IN = 0.5; // Silence before a line starts, so a cut never clips speech.
const TAIL = 0.8; // And after it ends, so the next cut does not feel rushed.

/**
 * How much faster footage may run to keep up with its narration.
 *
 * A browser recording is mostly waiting — page loads, network, the pauses the
 * capture script holds for the camera. Rather than pad the narration out to
 * match, the footage is stripped of static frames and then sped up to fit, so
 * navigation reads as a brisk fast-forward instead of a frozen screen. Past
 * about 3x the motion stops being legible.
 */
const MAX_SPEED = 3;

/**
 * The cut, in order. `card` segments are generated title/end frames; the rest
 * play a recorded scene. `say` is the narration and the caption is what a
 * muted viewer reads — they carry the same meaning on purpose.
 */
const SEGMENTS = [
  {
    id: "00-title",
    file: "anim-title.webm",
    animation: true,
    say: "Kukis. Consent-first email capture for Shopify.",
  },
  {
    id: "01-intro",
    file: "01-intro.webm",
    caption: "Shoppers can email themselves a product, a cart, or a wishlist",
    say: "This is Kukis. It lets a shopper email themselves a cart, a product or a wishlist, and it records the marketing consent they give while doing it.",
  },
  {
    id: "02-save-for-later",
    file: "02-save-for-later.webm",
    caption: "The marketing box starts unticked — nothing is pre-selected",
    say: "The shopper asks for the email, so there is no popup and no tracking cookie. The marketing box starts unticked. If they want marketing too, that is a separate, deliberate tick.",
  },
  {
    id: "03-cookie-decline",
    file: "03-cookie-decline.webm",
    caption: "Declined cookies? Kukis offers the one thing that still works",
    say: "This shopper just declined cookies. Instead of losing them, Kukis offers the one thing that still works: an email they ask for. It appears once, and it never covers the page.",
  },
  {
    id: "04-wishlist",
    file: "04-wishlist.webm",
    caption: "The wishlist survives a reload — and needs no account",
    say: "The wishlist works with no account and no login, and it is still there on the next page, and on the next visit.",
  },
  {
    id: "05-cart",
    file: "05-cart.webm",
    caption: "On the cart page: send yourself the cart, come back later",
    say: "On the cart page, the same idea. Send yourself the cart, and come back to it later.",
  },
  {
    id: "06-dashboard",
    file: "anim-dashboard.webm",
    animation: true,
    say: "On the merchant side, the dashboard answers three questions. How many shoppers you can email. What they saved. And what came back as orders.",
  },
  {
    id: "07-rejected-yes",
    file: "anim-rejected-yes.webm",
    animation: true,
    say: "This is the one no other app can show you. Shoppers who declined cookies, and still chose to leave their email. Kukis counts them separately, so you can see exactly what the cookie-free ask recovered.",
  },
  {
    id: "08-consent-log",
    file: "anim-consent-log.webm",
    animation: true,
    say: "Every capture keeps the exact wording the shopper saw, its version and language, the time, and their cookie choice. A no is kept too, because that is proof of refusal rather than a gap in your records.",
  },
  {
    id: "09-exports",
    file: "anim-exports.webm",
    animation: true,
    say: "Exports give you the people you may email, and leave out anyone who has unsubscribed, bounced, or asked to be erased. It downloads as a C S V, ready for your email tool.",
  },
  {
    id: "10-sending-domain",
    file: "anim-sending-domain.webm",
    animation: true,
    say: "And it all sends from your own verified domain. Most apps send from a shared address, where one bad actor hurts everyone. Here, the reputation you build is yours.",
  },
  {
    id: "11-shopify-sync",
    file: "anim-shopify-sync.webm",
    animation: true,
    say: "Consent does not sit in a silo. Kukis can add a shopper to your Shopify customers as an email subscriber, tagged, with the date they agreed. Any email tool that syncs subscribers from your Shopify customer list then picks them up, with no export and no copy-paste.",
  },
  {
    id: "12-price-drop",
    file: "anim-price-drop.webm",
    animation: true,
    say: "And when something they saved drops in price, they hear about it. Only if they ticked the alert box — which is its own yes, asked for separately from marketing email.",
  },
  {
    id: "13-privacy",
    file: "anim-privacy.webm",
    animation: true,
    say: "Shopify's three privacy requests are answered, not forwarded to you. What do you have on me. Delete me. And when you uninstall, the shop's data goes with it. Everything is hosted in the E U, and never used to train anything.",
  },
  {
    id: "14-outro",
    file: "anim-outro.webm",
    animation: true,
    say: "Shoppers get what they asked for. You get a contactable customer, and the consent behind it on record. That is Kukis.",
  },
];

/**
 * Admin stills live here. The Shopify admin is an authenticated, embedded
 * surface, so it cannot be driven by the headless recorder the storefront
 * scenes use. A slow pan across a high-resolution still is the usual answer
 * for UI anyway: it stays legible where a real cursor would dart about.
 */
const ADMIN = resolve(process.cwd(), "shots");

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const duration = async (path) => {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path,
  ]);
  return Number.parseFloat(stdout.trim());
};

/** A transparent caption strip, sat at the bottom of the frame. */
const captionOverlay = async (text, path) =>
  run("magick", [
    "-size", "1920x1080", "xc:none",
    "-fill", "rgba(20,14,10,0.78)",
    "-draw", "roundrectangle 160,916 1760,1020 14,14",
    "-font", FONT, "-pointsize", "42", "-fill", CREAM,
    "-gravity", "north", "-annotate", "+0+938", text,
    path,
  ]);

const cardImage = async ({ top, bottom }, path, accentTop) =>
  run("magick", [
    "-size", "1920x1080", `xc:${BARK}`,
    "-font", FONT_BOLD, "-pointsize", "84",
    "-fill", accentTop ? AMBER : CREAM,
    "-gravity", "center", "-annotate", "+0-60", top,
    "-font", FONT, "-pointsize", "40", "-fill", CREAM,
    "-gravity", "center", "-annotate", "+0+50", bottom,
    path,
  ]);

/** Human recording if one exists, else the synthetic voice. */
const narration = async (segment, index) => {
  const human = `${HUMAN_VO}/${String(index).padStart(2, "0")}.wav`;
  const out = `${WORK}/vo-${segment.id}.wav`;

  if (await exists(human)) {
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", human, "-ar", "48000", "-ac", "2", out]);
    return { path: out, human: true };
  }

  const raw = `${WORK}/vo-${segment.id}-raw.wav`;
  await run(KOKORO_PY, ["scripts/say-kokoro.py", VOICE, VOICE_SPEED, raw, segment.say]);
  // Kokoro writes 24kHz mono; the timeline is 48kHz stereo throughout.
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-ar", "48000", "-ac", "2", out]);
  return { path: out, human: false };
};

await rm(WORK, { recursive: true, force: true });
await mkdir(WORK, { recursive: true });
await mkdir(OUT, { recursive: true });

console.log(`Narration: Kokoro "${VOICE}" at ${VOICE_SPEED}x (drop wavs in scripts/voiceover/ to override)\n`);

const segmentFiles = [];
let usedHuman = 0;

for (const [index, segment] of SEGMENTS.entries()) {
  const vo = await narration(segment, index);
  if (vo.human) usedHuman += 1;
  const voSeconds = await duration(vo.path);

  // The segment is as long as its narration needs, never shorter than the
  // footage it is describing.
  const videoSource = segment.file ? `${SCENES}/${segment.file}` : null;

  const imageSource = segment.image ? `${ADMIN}/${segment.image}` : null;
  if (imageSource && !(await exists(imageSource))) {
    console.log(`  ${segment.id.padEnd(18)} SKIPPED — ${segment.image} not captured yet`);
    continue;
  }

  let footageSeconds = segment.minSeconds ?? 0;
  if (videoSource) {
    // Pass one: normalise, and drop frames identical to their predecessor.
    // That is where the real dead air lives — a page mid-load changes nothing.
    await run("ffmpeg", [
      "-y", "-loglevel", "error", "-i", videoSource,
      "-vf", [
        "scale=1920:1080:force_original_aspect_ratio=decrease",
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        "fps=30",
        ...(segment.animation ? [] : ["mpdecimate=hi=64*12:lo=64*5:frac=0.33", "setpts=N/FRAME_RATE/TB"]),
        "format=yuv420p",
      ].join(","),
      "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
      `${WORK}/base-${segment.id}.mp4`,
    ]);
    footageSeconds = await duration(`${WORK}/base-${segment.id}.mp4`);
  } else if (!imageSource) {
    await cardImage(segment.card, `${WORK}/card-${segment.id}.png`, segment.accentTop);
  }

  const spoken = LEAD_IN + voSeconds + TAIL;
  let target = spoken;
  let speed = 1;

  if (segment.animation) {
    // Authored at a deliberate pace, and already captioned by its own
    // headline — speeding it up or stacking a caption bar on top would fight
    // the design rather than help it.
    target = Math.max(footageSeconds, spoken);
  } else if (videoSource && footageSeconds > spoken) {
    // Pass two: run what is left fast enough to land on the narration.
    speed = Math.min(footageSeconds / spoken, MAX_SPEED);
    const spedUp = footageSeconds / speed;
    // Capped speed can still leave footage over; the tail is the least
    // interesting part of every scene, so that is what gets trimmed.
    target = Math.min(spedUp, spoken);
  } else if (videoSource) {
    target = Math.max(footageSeconds, spoken);
  }

  const videoArgs = videoSource
    ? [
        "-i", `${WORK}/base-${segment.id}.mp4`,
        "-vf", [
          `setpts=PTS/${speed.toFixed(4)}`,
          `tpad=stop_mode=clone:stop_duration=${Math.max(0, target - footageSeconds / speed).toFixed(3)}`,
          `trim=0:${target.toFixed(3)}`,
          "setpts=PTS-STARTPTS",
          "fps=30",
        ].join(","),
      ]
    : imageSource
      ? [
          "-loop", "1", "-t", target.toFixed(3), "-i", imageSource,
          // Upscale first so the pan has pixels to spare, then drift across it.
          // `pan: "bottom"` starts low, for the part of a page below the fold.
          "-vf", [
            "scale=2400:-1",
            segment.pan === "bottom"
              ? `crop=1920:1080:(iw-ow)/2:'(ih-oh)*min(1,0.35+0.65*t/${target.toFixed(3)})'`
              : `crop=1920:1080:(iw-ow)/2:'(ih-oh)*min(1,0.10+0.35*t/${target.toFixed(3)})'`,
            "fps=30",
            "format=yuv420p",
          ].join(","),
        ]
      : [
          "-loop", "1", "-t", target.toFixed(3), "-i", `${WORK}/card-${segment.id}.png`,
          "-vf", "fps=30,format=yuv420p",
        ];

  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    ...videoArgs,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-an",
    `${WORK}/sized-${segment.id}.mp4`,
  ]);

  // Caption burned on, for the scenes that have one.
  let visual = `${WORK}/sized-${segment.id}.mp4`;
  if (segment.caption) {
    await captionOverlay(segment.caption, `${WORK}/cap-${segment.id}.png`);
    await run("ffmpeg", [
      "-y", "-loglevel", "error",
      "-i", visual, "-i", `${WORK}/cap-${segment.id}.png`,
      "-filter_complex", "[0:v][1:v]overlay=0:0[out]",
      "-map", "[out]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-an",
      `${WORK}/capped-${segment.id}.mp4`,
    ]);
    visual = `${WORK}/capped-${segment.id}.mp4`;
  }

  // Narration placed after the lead-in and padded to the segment length.
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", vo.path,
    "-af", `adelay=${Math.round(LEAD_IN * 1000)}|${Math.round(LEAD_IN * 1000)},apad,atrim=0:${target.toFixed(3)}`,
    "-ar", "48000", "-ac", "2", `${WORK}/voice-${segment.id}.wav`,
  ]);

  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", visual, "-i", `${WORK}/voice-${segment.id}.wav`,
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
    `${WORK}/segment-${segment.id}.mp4`,
  ]);

  segmentFiles.push(`${WORK}/segment-${segment.id}.mp4`);
  console.log(
    `  ${segment.id.padEnd(18)} ${target.toFixed(1)}s` +
      `  voice ${voSeconds.toFixed(1)}s` +
      (speed > 1.01 ? `  footage ${footageSeconds.toFixed(1)}s at ${speed.toFixed(1)}x` : "") +
      (vo.human ? "  (human)" : ""),
  );
}

const listFile = `${WORK}/concat.txt`;
await run("bash", [
  "-c",
  `printf "file '%s'\\n" ${segmentFiles.map((f) => `'${f}'`).join(" ")} > '${listFile}'`,
]);

await run("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "concat", "-safe", "0", "-i", listFile,
  "-c", "copy", `${WORK}/cut.mp4`,
]);

const total = await duration(`${WORK}/cut.mp4`);

// An original four-chord piece, generated to the exact length of the cut.
// The earlier ffmpeg drone was a single sustained tone and sounded like one.
console.log("\nComposing the music bed");
await run(KOKORO_PY, ["scripts/make-music.py", total.toFixed(2), `${WORK}/music.wav`]);

const finalPath = `${OUT}/kukis-app-store.mp4`;
await run("ffmpeg", [
  "-y", "-loglevel", "error",
  "-i", `${WORK}/cut.mp4`, "-i", `${WORK}/music.wav`,
  "-filter_complex",
  // Music ducks whenever narration is present, so speech is never fought.
  "[1:a][0:a]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=450[duck];" +
    "[0:a][duck]amix=inputs=2:normalize=0:duration=first[mixed];" +
    "[mixed]loudnorm=I=-16:TP=-1.5:LRA=11[a]",
  "-map", "0:v", "-map", "[a]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
  finalPath,
]);

const { stdout } = await run("ffprobe", [
  "-v", "error", "-show_entries", "format=duration,size",
  "-show_entries", "stream=codec_name,width,height", "-of", "default=nw=1", finalPath,
]);
console.log(`\n${finalPath}\n${stdout.trim()}`);
console.log(usedHuman ? `\n${usedHuman} human-recorded line(s) used.` : "\nAll lines synthetic.");
console.log("\nTo use your own voice: record each line as scripts/voiceover/00.wav … 06.wav, then re-run.");
SEGMENTS.forEach((s, i) => console.log(`  ${String(i).padStart(2, "0")}.wav  ${s.say}`));
