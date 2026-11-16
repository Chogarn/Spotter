// Reinicia el día 1 de la semana activa de la cuenda demo (deja el día sin empezar).
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));
const base = "http://localhost:3001";
const semana = process.env.SEMANA ?? "142";
const dia = process.env.DIA ?? "1";

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--force-device-scale-factor=2"] });
const ctx = await browser.newContext({ viewport: null, hasTouch: true, locale: "es-AR", storageState: aqui("./estado.json") });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 0, mobile: false });
await page.goto(`${base}/semanas/${semana}/dia/${dia}/entrenar`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => !document.body.innerText.includes("Cargando..."), null, { timeout: 90000 }).catch(() => {});
await page.getByRole("button", { name: "Reiniciar el día" }).locator("visible=true").first().tap();
await page.waitForTimeout(1500);
const bs = await page.locator("button:visible").evaluateAll((els) => els.map((e) => (e.textContent || "").trim()).filter(Boolean));
console.log("botones del diálogo:", JSON.stringify(bs));
await page.screenshot({ path: aqui("./y_reinicio.png") });
const confirmar = page.getByRole("button", { name: /Reiniciar|Sí|Confirmar/ }).locator("visible=true").last();
await confirmar.tap();
await page.waitForTimeout(4000);
console.log("url:", page.url().replace(base, ""));
await browser.close();
