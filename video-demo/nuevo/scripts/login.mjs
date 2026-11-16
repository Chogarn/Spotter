// Inicia sesión con la cuenta demo (sin grabar) y guarda la sesión en estado.json.
import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const base = process.env.BASE ?? "http://localhost:3001";
const t = fs.readFileSync(fileURLToPath(new URL("../demo_cuenta.txt", import.meta.url)), "utf8");
const email = t.match(/EMAIL=(.*)/)[1].trim();
const clave = t.match(/CLAVE=(.*)/)[1].trim();

const browser = await chromium.launch({ channel: "msedge" });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "es-AR",
});
const page = await ctx.newPage();
await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill(email);
await page.locator("#password").fill(clave);
await page.getByRole("checkbox", { name: /Recordarme/ }).click();
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 });
await page.waitForSelector("text=Hola, Alex", { timeout: 60000 });
await ctx.storageState({ path: fileURLToPath(new URL("./estado.json", import.meta.url)) });
console.log("sesión guardada; url:", page.url());
await browser.close();
