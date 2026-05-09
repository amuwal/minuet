import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const OUT = path.join(ROOT, "report-assets");
const URL_BASE = process.env.URL || "http://localhost:51394";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SAMPLE_MP3 = path.join(OUT, "_sample-silent.mp3");

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1440, height: 900 },
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(URL_BASE, { waitUntil: "networkidle2" });

  const [chooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click(".dropzone"),
  ]);
  await chooser.accept([SAMPLE_MP3]);
  await new Promise((r) => setTimeout(r, 1500));

  await page.click("button.btn-lg.btn-primary");
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const gen = btns.find((b) => b.textContent?.includes("議事録を生成"));
    gen?.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  await page
    .addStyleTag({ content: "nextjs-portal { display: none !important; }" })
    .catch(() => {});

  await page.screenshot({
    path: path.join(OUT, "19-auth-modal.png"),
    fullPage: false,
  });
  console.log("✓ 19-auth-modal.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
