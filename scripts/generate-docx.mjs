/**
 * Renders the full-article Word documents referenced by `src/data/articles.ts`:
 *
 *   public/docs/<slug>.docx
 *
 * The DOCX is the editable sibling of the PDF written by `npm run gen:pdfs`:
 * same masthead, same headline, same full article text, same credit block — so
 * a recipient who needs to quote or re-lay-out an article gets the text rather
 * than a page image.
 *
 * Where the PDF script prints the app's own `/print/<slug>` route and therefore
 * needs the dev server running, this one imports `src/data/articles.ts`
 * directly (Node strips the types; the data file's only import is a type) and
 * lays the article out with the `docx` package. The article text still lives in
 * exactly one place — a wording fix reaches the DOCX by re-running this script.
 *
 *   npm run gen:docx                  # writes every article
 *   npm run gen:docx -- --only=<slug> # one article
 *
 * Requires Node >= 22.18 for TypeScript type stripping.
 *
 * SVG posters are rasterised through Chromium (already installed for
 * `gen:pdfs`): Word's SVG support is uneven, and a PNG renders identically in
 * every version. Remote posters (absolute URLs) are left out rather than
 * fetched, so the document never depends on a third-party host being up.
 */

import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The app's `@/` alias is a tsconfig path, which Node knows nothing about, so
 * teach the resolver the one rule it needs before pulling in the article data.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(root, "src", specifier.slice(2));
      return { url: pathToFileURL(target).href + ".ts", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { articles } = await import("../src/data/articles.ts");
const { formatMarathiDateLong } = await import("../src/lib/date.ts");
const { t } = await import("../src/lib/copy.ts");

const docsDir = path.join(root, "public", "docs");
const publicDir = path.join(root, "public");

const only = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--only="))
  ?.slice(7);

/* ------------------------------------------------------------------ units */

/** Word measures pages in twips. Mirrors the millimetres in `print.css`. */
const mm = (value) => Math.round(value * 56.6929);
/** Font sizes are half-points; `print.css` is written in points. */
const pt = (value) => Math.round(value * 2);
/** Vertical spacing in twips, from the points `print.css` uses. */
const ptSpace = (value) => Math.round(value * 20);
/** Images are placed in CSS pixels at 96 dpi. */
const mmToPx = (value) => (value / 25.4) * 96;

/**
 * One font name, not a stack: Word picks no fallback of its own. Nirmala UI
 * ships with Windows and covers Devanagari, so the document opens correctly on
 * the machines these files are forwarded to; elsewhere the reader substitutes.
 */
const FONT = "Nirmala UI";

/* Palette lifted from `src/app/print/[slug]/print.css`. */
const INK = "17130E";
const MUTED = "857868";
const BODY_MUTED = "4A4139";
const ACCENT = "98470F";
const RULE_ORANGE = "C05F1C";
const RULE_SAND = "E6DCCC";

const CONTENT_WIDTH_MM = 180; // A4 (210mm) minus the left and right margins.
const POSTER_MAX_WIDTH_PX = mmToPx(CONTENT_WIDTH_MM * 0.78);
const POSTER_MAX_HEIGHT_PX = mmToPx(95);

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

/** A run carrying the Devanagari font on both the Latin and complex-script slots. */
function run(text, options = {}) {
  const { size, ...rest } = options;
  return new TextRun({
    text,
    font: { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT },
    language: { value: "mr-IN", bidirectional: "mr-IN" },
    ...(size === undefined
      ? {}
      : { size: pt(size), sizeComplexScript: pt(size) }),
    ...(rest.bold ? { boldComplexScript: true } : {}),
    ...rest,
  });
}

/* ------------------------------------------------------------------ images */

/** Intrinsic pixel size, read from the file header — no image library needed. */
function readImageSize(buffer, type) {
  if (type === "png") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // JPEG: walk the marker chain to the start-of-frame, which carries the size.
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("no JPEG start-of-frame marker found");
}

let browserPromise = null;

/** Chromium is launched once, and only if some poster actually needs it. */
async function getBrowser() {
  if (!browserPromise) {
    const { chromium } = await import("playwright");
    browserPromise = chromium.launch();
  }
  return browserPromise;
}

/** The intrinsic size an SVG declares, used to plan the raster before drawing it. */
function readSvgSize(svgPath) {
  const source = fs.readFileSync(svgPath, "utf8");
  return {
    width: Number(/\bwidth="(\d+)"/.exec(source)?.[1] ?? 1200),
    height: Number(/\bheight="(\d+)"/.exec(source)?.[1] ?? 1500),
  };
}

/** Draw an SVG at exactly the pixel size the page will show it at. */
async function rasteriseSvg(svgPath, size) {
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: size });
  const page = await context.newPage();
  try {
    await page.goto(`file://${svgPath}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    return await page.screenshot({ type: "png" });
  } finally {
    await context.close();
  }
}

/**
 * Re-encode an oversized photo down to the pixels the page uses.
 *
 * A released poster can be several megabytes, and a document that size is
 * awkward to mail or forward — the reader sees no more detail for it, because
 * the image is drawn a third of its width. JPEG on white: posters are opaque,
 * and the flattening keeps a stray alpha channel from turning black.
 */
async function downscale(buffer, mimeType, size) {
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const encoded = await page.evaluate(
      async ([source, width, height]) => {
        const image = new Image();
        image.src = source;
        await image.decode();

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", 0.86).split(",")[1];
      },
      [dataUrl, size.width, size.height],
    );
    return Buffer.from(encoded, "base64");
  } finally {
    await context.close();
  }
}

/**
 * The poster, scaled into the same box the print sheet gives it.
 * Returns `null` when the article has no local poster to embed.
 */
async function posterParagraph(article) {
  const url = article.posterImageUrl;
  if (!url || !url.startsWith("/")) return null;

  const file = path.join(publicDir, url.replace(/^\/+/, ""));
  if (!fs.existsSync(file)) {
    console.warn(`  ! ${article.slug} — poster ${url} not found, skipping it`);
    return null;
  }

  const extension = path.extname(file).toLowerCase();
  const isSvg = extension === ".svg";
  const sourceType = extension === ".png" ? "png" : "jpg";

  const intrinsic = isSvg
    ? readSvgSize(file)
    : readImageSize(fs.readFileSync(file), sourceType);

  // The size the poster occupies on the page, letterboxed into the print
  // sheet's box, and the pixels behind it: twice that, which is the detail a
  // 300 dpi print can still show and the point past which the file only grows.
  const scale = Math.min(
    POSTER_MAX_WIDTH_PX / intrinsic.width,
    POSTER_MAX_HEIGHT_PX / intrinsic.height,
    1,
  );
  const placed = {
    width: Math.round(intrinsic.width * scale),
    height: Math.round(intrinsic.height * scale),
  };
  const raster = { width: placed.width * 2, height: placed.height * 2 };

  let data;
  let type;
  if (isSvg) {
    data = await rasteriseSvg(file, raster);
    type = "png";
  } else if (intrinsic.width > raster.width) {
    data = await downscale(
      fs.readFileSync(file),
      sourceType === "png" ? "image/png" : "image/jpeg",
      raster,
    );
    type = "jpg";
  } else {
    data = fs.readFileSync(file);
    type = sourceType;
  }

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: mm(12) },
    children: [
      new ImageRun({
        data,
        type,
        transformation: placed,
        altText: { name: "poster", title: "poster", description: article.title },
      }),
    ],
  });
}

/* -------------------------------------------------------------- components */

/** Site name on the left, issuing office on the right, under an orange rule. */
function masthead(article) {
  const cell = (children, alignment) =>
    new TableCell({
      children: [new Paragraph({ alignment, children })],
      borders: {
        ...NO_BORDERS,
        bottom: { style: BorderStyle.SINGLE, size: 16, color: RULE_ORANGE },
      },
      margins: { top: 0, bottom: mm(2), left: 0, right: 0 },
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    columnWidths: [mm(110), mm(70)],
    rows: [
      new TableRow({
        children: [
          cell([run("महाराष्ट्र एका नजरेत", { size: 15, color: INK })]),
          cell(
            [
              run(article.source, { size: 8.5, color: MUTED }),
              run("", { break: 1 }),
              run(article.author ?? "माहिती व जनसंपर्क महासंचालनालय", {
                size: 8.5,
                color: MUTED,
              }),
            ],
            AlignmentType.RIGHT,
          ),
        ],
      }),
    ],
  });
}

/** The two-column credit block under the article body. */
function metaTable(article) {
  const entries = [
    [t.district, article.district],
    [t.category, article.category],
    [t.source, article.source],
    ...(article.author ? [[t.author, article.author]] : []),
  ];

  const cell = (label, value) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            run(label, { size: 8, color: MUTED, characterSpacing: 12 }),
          ],
        }),
        new Paragraph({
          spacing: { before: mm(1) },
          children: [run(value, { size: 10, color: INK })],
        }),
      ],
      borders: NO_BORDERS,
      margins: { top: mm(1.5), bottom: mm(1.5), left: 0, right: mm(10) },
    });

  const rows = [];
  for (let index = 0; index < entries.length; index += 2) {
    const pair = entries.slice(index, index + 2);
    rows.push(
      new TableRow({
        children: [
          cell(...pair[0]),
          pair[1]
            ? cell(...pair[1])
            : new TableCell({
                children: [new Paragraph({})],
                borders: NO_BORDERS,
              }),
        ],
      }),
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    columnWidths: [mm(90), mm(90)],
    rows,
  });
}

/** A hairline the width of the text column, drawn as an empty bordered line. */
function rule({ before, after, color = RULE_SAND }) {
  return new Paragraph({
    spacing: { before, after },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
    children: [run("")],
  });
}

/* ---------------------------------------------------------------- document */

async function buildDocument(article) {
  const paragraphs = article.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const poster = await posterParagraph(article);

  const children = [
    masthead(article),

    new Paragraph({
      spacing: { before: mm(5) },
      children: [
        run(article.category, {
          size: 8.5,
          bold: true,
          color: ACCENT,
          characterSpacing: 14,
        }),
      ],
    }),

    new Paragraph({
      outlineLevel: 0,
      spacing: {
        before: ptSpace(6),
        line: Math.round(1.42 * 240),
        lineRule: LineRuleType.AUTO,
      },
      keepNext: true,
      children: [run(article.title, { size: 19, bold: true, color: INK })],
    }),

    new Paragraph({
      spacing: { before: ptSpace(6) },
      keepNext: true,
      children: [
        run(`${formatMarathiDateLong(article.date)} · ${article.district}`, {
          size: 9.5,
          color: BODY_MUTED,
        }),
      ],
    }),

    ...(poster ? [poster] : []),

    rule({ before: mm(10), after: mm(8) }),

    ...paragraphs.map(
      (paragraph) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            after: mm(5),
            line: Math.round(1.85 * 240),
            lineRule: LineRuleType.AUTO,
          },
          children: [run(paragraph, { size: 11, color: INK })],
        }),
    ),

    rule({ before: mm(8), after: mm(6) }),
    metaTable(article),
  ];

  if (article.tags.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: mm(6) },
        children: [
          run(`${t.tags}: ${article.tags.join(" · ")}`, {
            size: 9.5,
            color: BODY_MUTED,
          }),
        ],
      }),
    );
  }

  children.push(
    rule({ before: mm(10), after: mm(4) }),
    new Paragraph({
      children: [
        run("महासंवाद — माहिती व जनसंपर्क महासंचालनालय, महाराष्ट्र शासन.", {
          size: 8.5,
          color: MUTED,
        }),
        run("", { break: 1 }),
        run("हा लेख ‘महाराष्ट्र एका नजरेत’ या संकेतस्थळावरून घेतला आहे.", {
          size: 8.5,
          color: MUTED,
        }),
      ],
    }),
  );

  return new Document({
    title: article.title,
    description: article.summary.slice(0, 180),
    creator: article.author ?? article.source,
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT },
            size: pt(11),
            sizeComplexScript: pt(11),
            color: INK,
          },
          paragraph: {
            spacing: {
              after: 0,
              line: Math.round(1.5 * 240),
              // Explicit: a missing rule is read as a fixed line height by
              // some readers, which crops anything taller than one line.
              lineRule: LineRuleType.AUTO,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: mm(210), height: mm(297) },
            margin: {
              top: mm(16),
              right: mm(15),
              bottom: mm(18),
              left: mm(15),
            },
          },
        },
        children,
      },
    ],
  });
}

/* -------------------------------------------------------------------- main */

async function main() {
  const selected = articles.filter((article) => !only || article.slug === only);
  if (selected.length === 0) {
    throw new Error(`No article matches --only=${only}`);
  }

  fs.mkdirSync(docsDir, { recursive: true });

  try {
    for (const article of selected) {
      const file = path.join(docsDir, `${article.slug}.docx`);
      const buffer = await Packer.toBuffer(await buildDocument(article));
      fs.writeFileSync(file, buffer);

      const kb = Math.round(buffer.length / 1024);
      console.log(`  ✓ public/docs/${article.slug}.docx  (${kb} KB)`);
    }
  } finally {
    if (browserPromise) await (await browserPromise).close();
  }

  console.log(`\n${selected.length} DOCX file(s) written to public/docs/`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
