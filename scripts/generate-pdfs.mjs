/**
 * Renders the full-article PDFs referenced by `src/data/articles.ts`:
 *
 *   public/pdfs/<slug>.pdf
 *
 * Each PDF is a print of the app's own `/print/<slug>` route, so the article
 * text has exactly one source — the data file — and a wording fix reaches the
 * PDF by re-running this script rather than by editing a second copy.
 *
 * The app must already be running, because the route is what gets printed:
 *
 *   npm run dev                       # serves http://localhost:3001
 *   npm run gen:pdfs                  # prints every article
 *   npm run gen:pdfs -- http://localhost:3000 --only=<slug>
 *
 * Paper size and margins live in `src/app/print/[slug]/print.css` under
 * `@page`; `preferCSSPageSize` below hands that stylesheet the final say.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pdfDir = path.join(root, "public", "pdfs");
const dataFile = path.join(root, "src", "data", "articles.ts");

const args = process.argv.slice(2);
const baseUrl = (
  args.find((arg) => /^https?:\/\//.test(arg)) ??
  process.env.PDF_BASE_URL ??
  "http://localhost:3001"
).replace(/\/+$/, "");
const only = args.find((arg) => arg.startsWith("--only="))?.slice(7);

/**
 * Slugs are read straight out of the data file rather than imported: this is
 * plain Node, which resolves neither TypeScript nor the app's `@/` alias. The
 * pattern matches the `slug:` field of each article literal, so adding an
 * article is picked up with no change here.
 */
function readSlugs() {
  const source = fs.readFileSync(dataFile, "utf8");
  const slugs = [...source.matchAll(/^\s{4}slug:\s*"([^"]+)",$/gm)].map(
    (match) => match[1],
  );

  if (slugs.length === 0) {
    throw new Error(
      `No slugs found in ${path.relative(root, dataFile)} — has the shape of the article literals changed?`,
    );
  }
  return slugs;
}

/** Fail loudly on a server that is not up, rather than printing 404 sheets. */
async function assertServerIsUp() {
  try {
    const response = await fetch(baseUrl, { redirect: "manual" });
    if (response.status >= 500) {
      throw new Error(`responded ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `Cannot reach ${baseUrl} (${error.message}). Start the app first: npm run dev`,
    );
  }
}

async function main() {
  const slugs = readSlugs().filter((slug) => !only || slug === only);
  if (slugs.length === 0) {
    throw new Error(`No article matches --only=${only}`);
  }

  await assertServerIsUp();
  fs.mkdirSync(pdfDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  let failures = 0;

  try {
    for (const slug of slugs) {
      const url = `${baseUrl}/print/${slug}`;
      const response = await page.goto(url, { waitUntil: "networkidle" });

      if (!response || !response.ok()) {
        console.error(`  ✗ ${slug} — ${url} returned ${response?.status()}`);
        failures += 1;
        continue;
      }

      // Devanagari is served by next/font; printing before the faces load
      // silently falls back to a Latin face and drops the conjuncts.
      await page.evaluate(() => document.fonts.ready);

      const file = path.join(pdfDir, `${slug}.pdf`);
      await page.pdf({
        path: file,
        printBackground: true,
        preferCSSPageSize: true,
      });

      const kb = Math.round(fs.statSync(file).size / 1024);
      console.log(`  ✓ public/pdfs/${slug}.pdf  (${kb} KB)`);
    }
  } finally {
    await browser.close();
  }

  if (failures > 0) {
    throw new Error(`${failures} article(s) failed to render`);
  }
  console.log(`\n${slugs.length} PDF(s) written from ${baseUrl}/print/`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
