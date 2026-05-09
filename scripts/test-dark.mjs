import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLE_GIJIROKU, SAMPLE_TRANSCRIPT } from "./sample-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const OUT = path.join(ROOT, "report-assets");
const URL_BASE = process.env.URL || "http://localhost:57238";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1440, height: 900 },
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      "minuet.theme",
      JSON.stringify({ theme: "dark", density: "regular", layout: "single", accent: "#2563eb" })
    );
  });

  await page.goto(URL_BASE + "/history", { waitUntil: "networkidle2" });

  await page.evaluate(({ gijiroku, transcript }) => {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open("minuet", 1);
      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains("meetings")) db.createObjectStore("meetings", { keyPath: "id" });
        if (!db.objectStoreNames.contains("audio")) db.createObjectStore("audio", { keyPath: "meetingId" });
        if (!db.objectStoreNames.contains("projects")) db.createObjectStore("projects", { keyPath: "id" });
      };
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("meetings", "readwrite");
        tx.objectStore("meetings").put({
          id: "sample-1",
          title: gijiroku.会議名,
          datetime: gijiroku.開催日時,
          gijiroku, transcript,
          contextSnapshot: { title: "", datetime: "", place: "", author: "", attendees: "", agenda: "", terms: "" },
          hasAudio: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      };
      open.onerror = () => reject(open.error);
    });
  }, { gijiroku: SAMPLE_GIJIROKU, transcript: SAMPLE_TRANSCRIPT });

  await page.goto(URL_BASE + "/meetings/sample-1", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2500));

  const state = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      dataTheme: root.dataset.theme,
      rootSurface: getComputedStyle(root).getPropertyValue("--surface").trim(),
      localStorage: localStorage.getItem("minuet.theme"),
    };
  });
  console.log("State at screenshot time:", state);

  await page.screenshot({ path: path.join(OUT, "_test-dark.png"), fullPage: false });
  console.log("Saved _test-dark.png");

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
