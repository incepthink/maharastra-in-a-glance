/**
 * Generates the poster artwork referenced by `src/data/articles.ts`:
 *
 *   public/posters/<slug>.svg
 *
 * These are typographic posters built from each article's own kicker, headline
 * and district — they carry no photography and make no claim to be a scan of
 * an official release. When a real poster arrives for an article, point that
 * article's `posterImageUrl` at it and drop its entry from `POSTERS` below.
 *
 * Keep `slug` in step with the article's `slug`; the file name is derived from
 * it, so a rename here without one in the data file breaks the image.
 *
 * Run with:  npm run gen:posters
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postersDir = path.join(root, "public", "posters");

/* ------------------------------------------------------------------ posters */

/**
 * Headlines are wrapped by hand: the SVG has no text layout engine, so a line
 * much past ~16 Devanagari characters overruns the 1200px frame.
 */
const POSTERS = [
  {
    slug: "msme-samanjasya-karar-chakan-bhosari",
    kicker: "उद्योग",
    title: "एमएसएमईंतून\n२,३२० कोटींची\nगुंतवणूक",
    place: "मुंबई",
    date: "२६ ऑगस्ट २०२६",
    hue: { base: "#A1802C", deep: "#6E561A", wash: "#F7F0DD" },
  },
  {
    slug: "digital-arrest-cyber-jagruti-1930",
    kicker: "गृह व सुरक्षा",
    title: "डिजिटल अरेस्ट\nविरोधात जनजागृती",
    place: "मुंबई",
    date: "२६ ऑगस्ट २०२६",
    hue: { base: "#2C6E8A", deep: "#1A4A5E", wash: "#E9F1F5" },
  },
  {
    slug: "nepal-adaklele-paryatak-nanded-madat",
    kicker: "आपत्ती व्यवस्थापन",
    title: "नेपाळमध्ये\nअडकलेल्यांसाठी\nमदत कक्ष",
    place: "नांदेड",
    date: "२६ ऑगस्ट २०२६",
    hue: { base: "#B03A3A", deep: "#7A2323", wash: "#FBECEA" },
  },
  {
    slug: "haffkine-karmchari-pralambit-magnya",
    kicker: "प्रशासन",
    title: "हाफकिन कर्मचारी\nमागण्यांवर चर्चा",
    place: "मुंबई",
    date: "२६ ऑगस्ट २०२६",
    hue: { base: "#1F6B45", deep: "#144A2F", wash: "#E8F3EC" },
  },
  {
    slug: "rajyapal-rakshabandhan-lokbhavan",
    kicker: "सामाजिक",
    title: "राज्यपालांचे\nरक्षाबंधन",
    place: "मुंबई",
    date: "२६ ऑगस्ट २०२६",
    hue: { base: "#8A4C7A", deep: "#5E3151", wash: "#F5ECF3" },
  },
];

const FONT_STACK =
  "'Noto Sans Devanagari','Nirmala UI','Mangal','Noto Sans',sans-serif";

const CREDIT = "महासंवाद — माहिती व जनसंपर्क महासंचालनालय, महाराष्ट्र शासन";

/** Escape the five XML-significant characters. */
function xml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function posterSvg({ kicker, title, place, date, hue }) {
  const width = 1200;
  const height = 1500;
  const lines = title.split(/\r?\n/);

  const titleLines = lines
    .map(
      (line, index) =>
        `<tspan x="96" dy="${index === 0 ? 0 : 118}">${xml(line)}</tspan>`,
    )
    .join("");

  const titleBottom = 330 + (lines.length - 1) * 118;

  // A quiet radial motif echoing the rays of the state seal, bleeding off the
  // right edge so the lower half of the poster carries weight.
  const cx = 960;
  const cy = 1090;
  const rays = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2;
    const inner = 210;
    const outer = i % 3 === 0 ? 430 : 360;
    return `<line x1="${(cx + Math.cos(angle) * inner).toFixed(1)}" y1="${(cy + Math.sin(angle) * inner).toFixed(1)}" x2="${(cx + Math.cos(angle) * outer).toFixed(1)}" y2="${(cy + Math.sin(angle) * outer).toFixed(1)}" />`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#FDFBF7"/>
      <stop offset="55%" stop-color="#FBF7F1"/>
      <stop offset="100%" stop-color="${hue.wash}"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${hue.deep}"/>
      <stop offset="100%" stop-color="${hue.base}"/>
    </linearGradient>
    <clipPath id="frame"><rect width="${width}" height="${height}"/></clipPath>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#paper)"/>

  <g clip-path="url(#frame)">
    <g stroke="${hue.base}" stroke-opacity="0.16" stroke-width="3" stroke-linecap="round">${rays}</g>
    <circle cx="${cx}" cy="${cy}" r="200" fill="${hue.base}" fill-opacity="0.05"/>
    <circle cx="${cx}" cy="${cy}" r="200" fill="none" stroke="${hue.base}" stroke-opacity="0.28" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="168" fill="none" stroke="${hue.base}" stroke-opacity="0.18" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="452" fill="none" stroke="${hue.base}" stroke-opacity="0.12" stroke-width="2"/>
  </g>

  <rect x="0" y="0" width="${width}" height="20" fill="url(#band)"/>

  <!-- Kicker -->
  <text x="96" y="128" font-family="${FONT_STACK}" font-size="36" fill="${hue.deep}" font-weight="600">${xml(kicker)}</text>
  <rect x="96" y="158" width="120" height="6" fill="${hue.base}"/>

  <!-- Headline -->
  <text x="96" y="${330}" font-family="${FONT_STACK}" font-size="98" font-weight="700" fill="#17130E">${titleLines}</text>

  <!-- District -->
  <g transform="translate(96 ${titleBottom + 118})">
    <rect x="0" y="-40" width="7" height="56" fill="${hue.base}"/>
    <text x="30" y="0" font-family="${FONT_STACK}" font-size="44" fill="#4A4139">${xml(place)}</text>
  </g>

  <!-- Long hairline anchoring the lower half -->
  <rect x="96" y="${titleBottom + 208}" width="${width - 192}" height="2" fill="${hue.base}" fill-opacity="0.22"/>

  <!-- Date -->
  <text x="96" y="1318" font-family="${FONT_STACK}" font-size="34" fill="${hue.deep}">${xml(date)}</text>

  <!-- Credit -->
  <text x="96" y="1424" font-family="${FONT_STACK}" font-size="28" fill="#857868">${xml(CREDIT)}</text>
  <rect x="0" y="${height - 16}" width="${width}" height="16" fill="url(#band)"/>
</svg>
`;
}

/* --------------------------------------------------------------------- main */

fs.mkdirSync(postersDir, { recursive: true });

for (const poster of POSTERS) {
  fs.writeFileSync(
    path.join(postersDir, `${poster.slug}.svg`),
    posterSvg(poster),
    "utf8",
  );
}

console.log(`Wrote ${POSTERS.length} posters to public/posters`);
