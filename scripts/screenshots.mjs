import puppeteer from "puppeteer-core";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SAMPLE_GIJIROKU, SAMPLE_TRANSCRIPT, PROGRESS_EVENTS } from "./sample-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const OUT = path.join(ROOT, "report-assets");
const URL_BASE = process.env.URL || "http://localhost:57238";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SAMPLE_MP3 = path.join(OUT, "_sample-silent.mp3");
if (!fs.existsSync(SAMPLE_MP3)) {
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=16000:cl=mono -t 2 -b:a 16k -loglevel quiet "${SAMPLE_MP3}"`
  );
}

const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };

async function hideDevOverlay(page) {
  await page
    .addStyleTag({
      content:
        "nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] { display: none !important; }",
    })
    .catch(() => {});
}

async function shoot(page, name) {
  await hideDevOverlay(page);
  await new Promise((r) => setTimeout(r, 350));
  const file = path.join(OUT, name + ".png");
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function shootFull(page, name) {
  await hideDevOverlay(page);
  await new Promise((r) => setTimeout(r, 350));
  const file = path.join(OUT, name + ".png");
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ✓ ${name}.png (full)`);
}

async function seedDb(page) {
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
          const tx = db.transaction(["meetings", "projects"], "readwrite");
          const meetings = tx.objectStore("meetings");
          const projects = tx.objectStore("projects");
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
          meetings.put({
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
          meetings.put({
            id: "sample-2",
            title: "新規取引先 商談キックオフ",
            datetime: "2026/04/22 10:00〜11:30",
            gijiroku: {
              ...gijiroku,
              会議名: "新規取引先 商談キックオフ",
              開催日時: "2026/04/22 10:00〜11:30",
              決定事項: [
                "提案書のドラフトを来週水曜までに作成",
                "次回打合せは5月初旬に設定",
                "技術担当の同席を依頼",
              ],
              ToDo: [
                { 担当者: "田中", 内容: "提案書ドラフト作成", 期限: "2026/04/29" },
                { 担当者: "鈴木", 内容: "技術担当の調整", 期限: "2026/04/24" },
              ],
            },
            transcript,
            contextSnapshot: ctxSnapshot,
            hasAudio: false,
            createdAt: now - 1000 * 60 * 60 * 24 * 3,
            updatedAt: now - 1000 * 60 * 60 * 24 * 3,
          });
          meetings.put({
            id: "sample-3",
            title: "マーケティング部 週次定例",
            datetime: "2026/04/15 09:00〜09:45",
            gijiroku: {
              ...gijiroku,
              会議名: "マーケティング部 週次定例",
              開催日時: "2026/04/15 09:00〜09:45",
              決定事項: [
                "今週のキャンペーン施策を確定",
                "バナー A/Bテスト開始日を決定",
              ],
              ToDo: [
                { 担当者: "佐藤", 内容: "A/Bテスト設計書を作成", 期限: "2026/04/17" },
                { 担当者: "中村", 内容: "クリエイティブ素材を準備", 期限: "2026/04/18" },
              ],
            },
            transcript,
            contextSnapshot: ctxSnapshot,
            hasAudio: false,
            createdAt: now - 1000 * 60 * 60 * 24 * 10,
            updatedAt: now - 1000 * 60 * 60 * 24 * 10,
          });
          projects.put({
            id: "proj-1",
            name: "商品企画部 定例",
            attendees: "田中 真一 / 商品企画部\n佐藤 由美子 / マーケティング部\n中村 葵 / 商品企画部",
            terms: "ホスピタリティ・プラス\nARPU\nリテンション率",
            place: "本社 A-301",
            author: "中村 葵",
            createdAt: now,
            updatedAt: now,
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { gijiroku: SAMPLE_GIJIROKU, transcript: SAMPLE_TRANSCRIPT }
  );
}

async function installFetchMock(page, events, finalGijiroku, finalTranscript) {
  await page.evaluateOnNewDocument(
    (events, finalGijiroku, finalTranscript) => {
      const orig = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/process")) {
          const enc = new TextEncoder();
          const all = [
            ...events,
            { type: "progress", pct: 75 },
            { type: "phase", phase: "summarize" },
            { type: "log", ts: "14:22:35", lvl: "info", msg: "Claude: tool=create_gijiroku で構造化" },
            { type: "progress", pct: 92 },
            {
              type: "log",
              ts: "14:23:18",
              lvl: "ok",
              msg: "構造化完了: 決定事項 5 件 · ToDo 5 件",
            },
            { type: "phase", phase: "format" },
            { type: "progress", pct: 100 },
            { type: "log", ts: "14:23:24", lvl: "ok", msg: "議事録の生成が完了しました" },
            {
              type: "result",
              gijiroku: finalGijiroku,
              transcript: finalTranscript,
              context: {},
            },
          ];
          const stream = new ReadableStream({
            async start(controller) {
              for (const e of all) {
                controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
                await new Promise((r) => setTimeout(r, 240));
              }
              controller.close();
            },
          });
          return new Response(stream, {
            status: 200,
            headers: { "Content-Type": "application/x-ndjson" },
          });
        }
        return orig(input, init);
      };
    },
    events,
    finalGijiroku,
    finalTranscript
  );
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: VIEWPORT_DESKTOP,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    console.log("\n— Desktop · Light theme —");
    const page = await browser.newPage();
    await installFetchMock(page, PROGRESS_EVENTS, SAMPLE_GIJIROKU, SAMPLE_TRANSCRIPT);

    // 01. Upload empty
    await page.goto(URL_BASE, { waitUntil: "networkidle2" });
    await shoot(page, "01-upload-empty");

    // 02. Upload with file
    const [chooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click(".dropzone"),
    ]);
    await chooser.accept([SAMPLE_MP3]);
    await new Promise((r) => setTimeout(r, 1500));
    await shoot(page, "02-upload-filled");

    // 03. Context form (empty after navigation, with sample loaded)
    await page.click("button.btn-lg.btn-primary"); // Next
    await new Promise((r) => setTimeout(r, 500));
    await shoot(page, "03-context-empty");

    // 04. Click "load sample"
    const sampleBtn = await page.$("button.btn.btn-sm");
    // Find the right button by text
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const loadBtn = btns.find((b) => b.textContent?.includes("サンプルを読み込む"));
      loadBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await shoot(page, "04-context-filled");

    // 05. Click "generate" — kicks off mocked pipeline
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const genBtn = btns.find((b) => b.textContent?.includes("議事録を生成"));
      genBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 1800));
    await shoot(page, "05-progress-mid");

    // wait for pipeline to finish
    await new Promise((r) => setTimeout(r, 6000));
    await shoot(page, "06-preview-single");

    // 07. Toggle layout to split
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".doc-toolbar button"));
      const splitBtn = btns.find((b) => b.textContent?.includes("分割"));
      splitBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await shoot(page, "07-preview-split");

    // 08. Toggle edit mode
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".doc-toolbar button"));
      const editBtn = btns.find((b) => b.textContent?.includes("編集モード"));
      editBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await shoot(page, "08-preview-edit");

    // exit edit mode (so toast doesn't linger)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".doc-toolbar button"));
      const editBtn = btns.find((b) => b.textContent?.includes("編集を終了"));
      editBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // 09. Export modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".doc-toolbar button"));
      const exportBtn = btns.find((b) => b.textContent?.includes("エクスポート"));
      exportBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await shoot(page, "09-export-modal");

    // close modal
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 300));

    await page.close();

    // 10. History page (with seeded data)
    console.log("\n— History pages —");
    const histPage = await browser.newPage();
    await histPage.goto(URL_BASE + "/history", { waitUntil: "networkidle2" });
    await shoot(histPage, "10-history-empty");
    await seedDb(histPage);
    await histPage.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 600));
    await shoot(histPage, "11-history-list");
    await histPage.close();

    // 11. Meeting detail page
    const detailPage = await browser.newPage();
    await detailPage.goto(URL_BASE + "/history", { waitUntil: "networkidle2" });
    await seedDb(detailPage);
    await detailPage.goto(URL_BASE + "/meetings/sample-1", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    await shoot(detailPage, "12-meeting-detail");
    await shootFull(detailPage, "12-meeting-detail-full");
    await detailPage.close();

    // 12. Dark mode
    console.log("\n— Dark theme —");
    const darkPage = await browser.newPage();
    await darkPage.goto(URL_BASE, { waitUntil: "networkidle2" });
    await darkPage.evaluate(() => {
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
    await darkPage.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 500));
    await shoot(darkPage, "13-dark-upload");

    await seedDb(darkPage);
    await darkPage.goto(URL_BASE + "/history", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 600));
    await shoot(darkPage, "14-dark-history");

    await darkPage.goto(URL_BASE + "/meetings/sample-1", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    await shoot(darkPage, "15-dark-meeting");
    await darkPage.close();

    // 13. Mobile
    console.log("\n— Mobile —");
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport(VIEWPORT_MOBILE);
    await mobilePage.goto(URL_BASE, { waitUntil: "networkidle2" });
    await shoot(mobilePage, "16-mobile-upload");

    await seedDb(mobilePage);
    await mobilePage.goto(URL_BASE + "/history", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 500));
    await shoot(mobilePage, "17-mobile-history");

    await mobilePage.goto(URL_BASE + "/meetings/sample-1", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    await shoot(mobilePage, "18-mobile-meeting");
    await mobilePage.close();

    console.log("\nDone.");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
