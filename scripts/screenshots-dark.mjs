import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLE_GIJIROKU, SAMPLE_TRANSCRIPT } from "./sample-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const OUT = path.join(ROOT, "report-assets");
const URL_BASE = process.env.URL || "http://localhost:57238";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function hideDevOverlay(page) {
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] { display: none !important; }",
  });
}

async function shoot(page, name) {
  await hideDevOverlay(page);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function seedAndDark(page) {
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      "minuet.theme",
      JSON.stringify({
        theme: "dark",
        density: "regular",
        layout: "single",
        accent: "#2563eb",
      })
    );
  });
}

async function forceDark(page) {
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
}

async function seedDb(page, gijiroku, transcript) {
  await page.evaluate(
    ({ gijiroku, transcript }) => {
      return new Promise((resolve, reject) => {
        const open = indexedDB.open("minuet", 1);
        open.onupgradeneeded = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("meetings"))
            db.createObjectStore("meetings", { keyPath: "id" });
          if (!db.objectStoreNames.contains("audio"))
            db.createObjectStore("audio", { keyPath: "meetingId" });
          if (!db.objectStoreNames.contains("projects"))
            db.createObjectStore("projects", { keyPath: "id" });
        };
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("meetings", "readwrite");
          const ms = tx.objectStore("meetings");
          const now = Date.now();
          const ctxSnapshot = {
            title: "",
            datetime: "",
            place: "",
            author: "",
            attendees: "",
            agenda: "",
            terms: "",
          };
          ms.put({
            id: "sample-1",
            title: gijiroku.会議名,
            datetime: gijiroku.開催日時,
            gijiroku,
            transcript,
            contextSnapshot: ctxSnapshot,
            audioFilename: "Q3定例.m4a",
            hasAudio: true,
            createdAt: now - 1000 * 60 * 30,
            updatedAt: now - 1000 * 60 * 30,
          });
          ms.put({
            id: "sample-2",
            title: "新規取引先 商談キックオフ",
            datetime: "2026/04/22 10:00〜11:30",
            gijiroku: {
              ...gijiroku,
              会議名: "新規取引先 商談キックオフ",
              開催日時: "2026/04/22 10:00〜11:30",
            },
            transcript,
            contextSnapshot: ctxSnapshot,
            hasAudio: false,
            createdAt: now - 1000 * 60 * 60 * 24 * 3,
            updatedAt: now - 1000 * 60 * 60 * 24 * 3,
          });
          ms.put({
            id: "sample-3",
            title: "マーケティング部 週次定例",
            datetime: "2026/04/15 09:00〜09:45",
            gijiroku: {
              ...gijiroku,
              会議名: "マーケティング部 週次定例",
              開催日時: "2026/04/15 09:00〜09:45",
            },
            transcript,
            contextSnapshot: ctxSnapshot,
            hasAudio: false,
            createdAt: now - 1000 * 60 * 60 * 24 * 10,
            updatedAt: now - 1000 * 60 * 60 * 24 * 10,
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { gijiroku, transcript }
  );
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1440, height: 900 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    console.log("\n— Dark theme (re-shoot) —");
    const page = await browser.newPage();
    await seedAndDark(page);
    await page.goto(URL_BASE, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));
    await forceDark(page);
    await new Promise((r) => setTimeout(r, 400));
    await shoot(page, "13-dark-upload");

    await seedDb(page, SAMPLE_GIJIROKU, SAMPLE_TRANSCRIPT);
    await page.goto(URL_BASE + "/history", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    await forceDark(page);
    await new Promise((r) => setTimeout(r, 400));
    await shoot(page, "14-dark-history");

    await page.goto(URL_BASE + "/meetings/sample-1", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));
    await forceDark(page);
    await new Promise((r) => setTimeout(r, 400));
    await shoot(page, "15-dark-meeting");

    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
