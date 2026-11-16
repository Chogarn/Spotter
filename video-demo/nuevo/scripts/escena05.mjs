// Escenas 0 (Bienvenida, sin sesión) y 5 (placa de cierre). Uso: node escena05.mjs 0|5
import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { iniciarCaptura } from "./cast.mjs";
const cual = process.argv[2];
const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));
const nombre = "e" + cual;
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--force-device-scale-factor=2"] });
const ctx = await browser.newContext({ viewport: null, hasTouch: true, locale: "es-AR" });
const page = await ctx.newPage();
const cdp0 = await ctx.newCDPSession(page);
await cdp0.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 0, mobile: false });
const url = cual === "0" ? "http://localhost:3001/bienvenida" : pathToFileURL(aqui("./placa5.html")).href;
await page.goto(url, { waitUntil: "load" });
await page.addStyleTag({ content: "@keyframes lat{from{opacity:.02}to{opacity:.04}}.latido{position:fixed;left:0;top:0;width:2px;height:2px;background:#888;animation:lat .15s infinite alternate;z-index:99999}" });
await page.evaluate(() => { const d = document.createElement("div"); d.className = "latido"; document.body.appendChild(d); });
await page.waitForTimeout(2500);
if (cual === "5") await page.evaluate(() => window.__listo);
const cap = await iniciarCaptura(ctx, page, aqui(`./${nombre}/`));
const marcas = [];
const t0 = Date.now();
const marca = (n) => { marcas.push({ nombre: n, s: (Date.now() - t0) / 1000, epoch: Date.now() / 1000 }); console.log(n); };
marca("INICIO");
if (cual === "5") { await page.evaluate(() => window.arrancar([0.7, 4.4, 6.3, 8.8, 19.4, 21.2], 22.8)); await page.waitForTimeout(26000); }
else { await page.waitForTimeout(7000); }
marca("FIN");
await cap.detener();
fs.writeFileSync(aqui(`./marcas_${nombre}.json`), JSON.stringify(marcas, null, 2));
console.log("cuadros", cap.cuadros());
await browser.close();
