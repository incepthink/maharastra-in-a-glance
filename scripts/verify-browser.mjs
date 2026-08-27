/**
 * Drives the running app in Chromium and reports on the main flows.
 *
 * Not part of the shipped product — a verification harness. Start the app
 * first, then:  node scripts/verify-browser.mjs [baseUrl]
 */

import fs from "node:fs";
import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = ".tmp-preview/shots";
fs.mkdirSync(OUT, { recursive: true });

const WIDTHS = [360, 375, 390, 430, 768, 1440];

/* -------------------------------------------------------------- fixtures */

/**
 * Everything below is read off `src/data/articles.ts` by hand -- this script is
 * plain node and cannot resolve the app's `@/` aliases. Re-check these whenever
 * the article list changes; a stale value shows up as a confusing failure.
 */
const ARTICLE_COUNT = 5;
const ARTICLE_COUNT_MR = "५";
/** A district held by exactly one article, and a term from that same article. */
const SOLO_DISTRICT = "नांदेड";
const SOLO_DISTRICT_TERM = "पर्यटक";
/** A query matching some but not all articles. */
const PARTIAL_TERM = "सायबर";
/** A query matching nothing. */
const ABSENT_TERM = "क्रिकेट";
const DEEP_LINK_SLUG = "msme-samanjasya-karar-chakan-bhosari";
/** An article with `articlePdfUrl: null`. */
const NO_PDF_SLUG = "nepal-adaklele-paryatak-nanded-madat";
/** An article with a PDF, or null while no article links one. */
const PDF_SLUG = null;
/** An article with `posterImageUrl: null`, or null while all ship a poster. */
const NO_POSTER_SLUG = null;
/** A sentence from the newest article, which share mode selects first. */
const VERBATIM_SENTENCE =
  "अनेक उत्पादनांच्या आयातीला पर्याय निर्माण करून";

const results = [];
const consoleErrors = [];

function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/** For a check the current article data cannot exercise. Not a failure. */
function skip(name, reason) {
  results.push({ name, passed: true, skipped: true, detail: reason });
  console.log(`SKIP  ${name} — ${reason}`);
}

const browser = await chromium.launch();

/* ------------------------------------------------------- responsive sweep */

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: width < 700 ? 780 : 900 },
    deviceScaleFactor: 2,
    locale: "mr-IN",
    ...(width < 700 ? { hasTouch: true, isMobile: true } : {}),
  });
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${width}px] ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`[${width}px] ${err.message}`));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("article, [role=checkbox]");

  // No horizontal overflow at any width.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`${width}px: no horizontal overflow`, overflow <= 0, `${overflow}px`);

  await page.screenshot({ path: `${OUT}/feed-${width}.png`, fullPage: false });

  // Touch targets on the smallest phone.
  if (width === 360) {
    const tooSmall = await page.evaluate(() => {
      const interactive = [
        ...document.querySelectorAll("button, a[href], input, [role=checkbox]"),
      ];
      return interactive
        .filter((el) => {
          const r = el.getBoundingClientRect();
          // Ignore anything not rendered, and the inline "clear all" text link.
          return r.width > 0 && r.height > 0 && r.height < 34;
        })
        .map((el) => `${el.tagName}.${el.className.toString().slice(0, 40)}`);
    });
    check("360px: no tiny touch targets", tooSmall.length === 0, tooSmall.join(" | "));
  }

  await context.close();
}

/* ------------------------------------------------------------ flow: phone */

const context = await browser.newContext({
  ...devices["Pixel 7"],
  locale: "mr-IN",
});
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(`[flow] ${m.text()}`);
});
page.on("pageerror", (e) => consoleErrors.push(`[flow] ${e.message}`));

await page.goto(BASE, { waitUntil: "networkidle" });

const CARDS = "article, [role=checkbox]";

/** Wait until the feed stops animating, then report a stable card count. */
async function cardCount() {
  let previous = -1;
  for (let i = 0; i < 25; i += 1) {
    const current = await page.locator(CARDS).count();
    if (current === previous) return current;
    previous = current;
    await page.waitForTimeout(120);
  }
  return previous;
}
check(
  "feed renders every article",
  (await cardCount()) === ARTICLE_COUNT,
  `${await cardCount()}`,
);

/* -- search --------------------------------------------------------------- */

const search = page.getByRole("searchbox");
await search.fill(PARTIAL_TERM);
await page.waitForTimeout(300);
check("search narrows the feed", (await cardCount()) < ARTICLE_COUNT, `${await cardCount()} results`);
check("search writes ?q= to the URL", page.url().includes("q="), page.url());
check(
  "search highlights the matched term",
  (await page.locator("mark").count()) > 0,
);
await page.screenshot({ path: `${OUT}/flow-search.png` });

// A query with no matches.
await search.fill(ABSENT_TERM);
await page.waitForTimeout(300);
check("irrelevant query yields no results", (await cardCount()) === 0);
check(
  "empty state offers a reset",
  await page.getByRole("button", { name: "शोध व फिल्टर पूर्ववत करा" }).isVisible(),
);
await page.screenshot({ path: `${OUT}/flow-no-results.png` });

await page.getByRole("button", { name: "शोध व फिल्टर पूर्ववत करा" }).click();
await page.waitForTimeout(300);
check("reset restores the full feed", (await cardCount()) === ARTICLE_COUNT);
check("reset clears the URL", !page.url().includes("q="), page.url());

/* -- filters -------------------------------------------------------------- */

await page.getByRole("button", { name: "फिल्टर उघडा" }).click();
await page.waitForTimeout(400);
const sheet = page.getByRole("dialog");
check("filter sheet opens", await sheet.isVisible());
await page.screenshot({ path: `${OUT}/flow-filters.png` });

// A district name can also exist as a tag, so scope to the first match --
// the sheet lists districts above tags.
await sheet
  .getByRole("button", { name: new RegExp(`^${SOLO_DISTRICT}`) })
  .first()
  .click();
await page.waitForTimeout(200);
await sheet.getByRole("button", { name: /^फिल्टर लागू करा/ }).click();
await page.waitForTimeout(400);
check("district filter applies", (await cardCount()) === 1, `${await cardCount()}`);
check("filter writes to the URL", page.url().includes("district="), page.url());
check(
  "an active filter chip is shown",
  await page.getByRole("button", { name: /हा फिल्टर काढा/ }).first().isVisible(),
);

// Search combined with the filter.
await search.fill(SOLO_DISTRICT_TERM);
await page.waitForTimeout(300);
check(
  "search and filter combine",
  (await cardCount()) === 1 && page.url().includes("district="),
  page.url(),
);

// Refresh survives.
const combinedUrl = page.url();
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(300);
check(
  "search + filter survive a refresh",
  page.url() === combinedUrl && (await cardCount()) === 1,
);

await page.getByRole("button", { name: "सर्व फिल्टर काढा" }).first().click();
await page.waitForTimeout(300);
await search.fill("");
await page.waitForTimeout(300);
check("clear all restores the feed", (await cardCount()) === ARTICLE_COUNT);

/* -- article dialog + URL/back -------------------------------------------- */

await page.getByRole("button", { name: /संपूर्ण सारांश वाचा/ }).first().click();
await page.waitForTimeout(500);
check("article dialog opens", await page.getByRole("dialog").isVisible());
check("dialog syncs ?article= to the URL", page.url().includes("article="), page.url());
await page.screenshot({ path: `${OUT}/flow-article.png` });

if (PDF_SLUG) {
  await page.goto(`${BASE}/?article=${PDF_SLUG}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check(
    "dialog exposes the PDF action",
    await page.getByRole("link", { name: /संपूर्ण लेख \(PDF\)/ }).isVisible(),
  );
  await page.goBack();
  await page.waitForTimeout(300);
} else {
  skip("dialog exposes the PDF action", "no article links a PDF yet");
}

await page.goBack();
await page
  .getByRole("dialog")
  .waitFor({ state: "detached", timeout: 4000 })
  .catch(() => {});
check("browser back closes the dialog", (await page.getByRole("dialog").count()) === 0);
check("back removes ?article=", !page.url().includes("article="), page.url());

// Deep link straight to an article.
await page.goto(`${BASE}/?article=${DEEP_LINK_SLUG}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(600);
check("deep link opens the dialog", await page.getByRole("dialog").isVisible());

// Escape closes it.
await page.keyboard.press("Escape");
await page
  .getByRole("dialog")
  .waitFor({ state: "detached", timeout: 4000 })
  .catch(() => {});
check("Escape closes the dialog", (await page.getByRole("dialog").count()) === 0);

/* -- poster fallback ------------------------------------------------------ */

if (NO_POSTER_SLUG) {
  await page.goto(`${BASE}/?article=${NO_POSTER_SLUG}`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  check(
    "a missing poster falls back to generated artwork",
    (await page.getByRole("img", { name: /पोस्टर उपलब्ध नाही/ }).count()) > 0,
  );
  await page.screenshot({ path: `${OUT}/flow-poster-fallback.png` });
} else {
  skip(
    "a missing poster falls back to generated artwork",
    "every article ships a poster",
  );
}

// The article without a PDF shows the unavailable state, not a dead button.
await page.goto(`${BASE}/?article=${NO_PDF_SLUG}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(600);
check(
  "missing PDF renders an explanation, not a button",
  (await page.getByText("या बातमीसाठी PDF सध्या उपलब्ध नाही").count()) > 0 &&
    (await page.getByRole("link", { name: /संपूर्ण लेख \(PDF\)/ }).count()) === 0,
);

/* -- share mode ----------------------------------------------------------- */

await page.goto(BASE, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /शेअर मोड/ }).click();
await page.waitForTimeout(500);
check(
  "share bar appears",
  await page.getByRole("button", { name: "दिसणाऱ्या सर्व निवडा" }).isVisible(),
);

const checkboxes = page.locator("[role=checkbox]");
check("cards become selectable", (await checkboxes.count()) === ARTICLE_COUNT);

await checkboxes.nth(0).click();
await checkboxes.nth(2).click();
await page.waitForTimeout(300);
check(
  "selecting does not open the article",
  (await page.getByRole("dialog").count()) === 0,
);
check("selected count is announced", await page.getByText("२ बातम्या निवडल्या").isVisible());
await page.screenshot({ path: `${OUT}/flow-share-mode.png` });

// Selections persist across a search.
await search.fill(PARTIAL_TERM);
await page.waitForTimeout(400);
await search.fill("");
await page.waitForTimeout(400);
check(
  "selection survives searching",
  await page.getByText("२ बातम्या निवडल्या").isVisible(),
);

await page.getByRole("button", { name: "दिसणाऱ्या सर्व निवडा" }).click();
await page.waitForTimeout(300);
check("select all visible works", await page.getByText(`${ARTICLE_COUNT_MR} बातम्या निवडल्या`).isVisible());

await page.getByRole("button", { name: "निवड रद्द करा" }).click();
await page.waitForTimeout(300);
await checkboxes.nth(0).click();
await checkboxes.nth(1).click();
await page.waitForTimeout(300);

await page.getByRole("button", { name: "पाठवा", exact: true }).click();
await page.waitForTimeout(600);
check("share preview opens", await page.getByRole("dialog").isVisible());
await page.screenshot({ path: `${OUT}/flow-share-preview.png` });

const message = await page.locator("pre").textContent();
fs.writeFileSync(`${OUT}/share-message.txt`, message, "utf8");

check("message names both articles", message.split("दिनांक:").length - 1 === 2);
if (PDF_SLUG) {
  check("message carries absolute PDF URLs", message.includes(`${BASE}/pdf/`));
} else {
  check(
    "message states the PDF is unavailable",
    message.includes("संपूर्ण लेख (PDF): सध्या उपलब्ध नाही"),
  );
}
check("message uses the rule separator", message.includes("────────────────────"));
check(
  "message is emoji-free",
  !/\p{Extended_Pictographic}/u.test(message),
);
check(
  "message reproduces a full summary",
  message.includes(VERBATIM_SENTENCE),
);

check(
  "WhatsApp action is offered",
  await page.getByRole("button", { name: "WhatsApp वर पाठवा" }).isVisible(),
);

// Copy to clipboard.
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
await page.getByRole("button", { name: "मजकूर कॉपी करा" }).click();
await page.waitForTimeout(500);
const clipboard = await page.evaluate(() => navigator.clipboard.readText());
// Windows rewrites line endings on the way through the clipboard; compare
// the content, not the platform's newline convention.
const sameLines = (a) => a.replace(/\r\n/g, "\n");
check(
  "copy puts the whole message on the clipboard",
  sameLines(clipboard) === sameLines(message),
  `${clipboard.length} vs ${message.length} chars`,
);
check(
  "copy shows Marathi confirmation",
  await page.getByText("मजकूर कॉपी झाला.").isVisible(),
);

/* -- keyboard ------------------------------------------------------------- */

await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await page.goto(BASE, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
const firstFocus = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? `${el.tagName}:${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30)}` : "none";
});
check("tabbing reaches an interactive control", firstFocus !== "none", firstFocus);

/* -- reduced motion ------------------------------------------------------- */

const rmContext = await browser.newContext({
  ...devices["Pixel 7"],
  reducedMotion: "reduce",
});
const rmPage = await rmContext.newPage();
rmPage.on("pageerror", (e) => consoleErrors.push(`[reduced-motion] ${e.message}`));
await rmPage.goto(BASE, { waitUntil: "networkidle" });
await rmPage.getByRole("button", { name: /संपूर्ण सारांश वाचा/ }).first().click();
await rmPage.waitForTimeout(400);
check("reduced motion still opens the dialog", await rmPage.getByRole("dialog").isVisible());
await rmContext.close();

/* -------------------------------------------------------------- console */

check(
  "no console errors",
  consoleErrors.length === 0,
  consoleErrors.slice(0, 5).join(" || "),
);

await context.close();
await browser.close();

const failed = results.filter((r) => !r.passed);
const skipped = results.filter((r) => r.skipped);
const ran = results.length - skipped.length;
console.log(
  `\n${ran - failed.length}/${ran} checks passed` +
    (skipped.length > 0 ? ` (${skipped.length} skipped)` : ""),
);
if (failed.length > 0) process.exitCode = 1;
