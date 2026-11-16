// Escena 3: cerrar la semana y armar la siguiente. Entrenar -> Cerrar semana (comentario) -> semana siguiente
// (días, estructura) -> IA (espera) -> propuesta (resumen, Cambios con antes/después) -> Aceptar.
import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { iniciarCaptura } from "./cast.mjs";

const base = process.env.BASE ?? "http://localhost:3001";
const SEMANA = process.env.SEMANA ?? "142";
const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));
const nombre = "e3";
const out = aqui(`./${nombre}/`);

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--force-device-scale-factor=2"] });
const ctx = await browser.newContext({ viewport: null, hasTouch: true, locale: "es-AR", storageState: aqui("./estado.json") });
await ctx.addInitScript(() => { try { localStorage.setItem("spotter:sin-avisos-dev", "1"); } catch {} }); // sin el panel de avisos de desarrollo
await ctx.addInitScript(() => {
  const poner = (x, y) => {
    const d = document.createElement("div");
    d.style.cssText =
      "position:fixed;z-index:2147483647;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;" +
      "border-radius:50%;background:rgba(23,32,51,.28);border:2px solid rgba(23,32,51,.45);" +
      `left:${x}px;top:${y}px;transform:scale(.4);opacity:1;transition:transform .45s ease-out,opacity .45s ease-out`;
    document.documentElement.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transform = "scale(1.15)"; d.style.opacity = "0"; }));
    setTimeout(() => d.remove(), 700);
  };
  addEventListener("pointerdown", (e) => poner(e.clientX, e.clientY), true);
});
const page = await ctx.newPage();
const cdp0 = await ctx.newCDPSession(page);
await cdp0.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 0, mobile: false });

const quieto = async () => {
  await page.waitForFunction(() => !document.body.innerText.includes("Cargando..."), null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(800);
};
// Reabrir la semana (si quedó cerrada de un ensayo) y precalentar las pantallas.
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await quieto();
const r = await page.evaluate(async (id) => {
  const x = await fetch(`http://localhost:8000/weeks/${id}/reopen`, { method: "POST", credentials: "include" });
  return x.status;
}, SEMANA);
console.log("reabrir semana:", r);
for (const ruta of ["/entrenar", "/"]) {
  await page.goto(base + ruta, { waitUntil: "domcontentloaded" });
  await quieto();
}
await page.goto(base + "/entrenar", { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Cerrar semana", { timeout: 60000 });
await quieto();
await page.waitForTimeout(800);

const cap = await iniciarCaptura(ctx, page, out);
const t0 = Date.now();
const marcas = [];
const marca = (nom) => {
  const s = (Date.now() - t0) / 1000;
  marcas.push({ nombre: nom, s: Math.round(s * 100) / 100, epoch: Date.now() / 1000 });
  console.log(s.toFixed(1).padStart(6), nom);
};
const guardar = () => fs.writeFileSync(aqui(`./marcas_${nombre}.json`), JSON.stringify(marcas, null, 2));
const pausa = (ms) => page.waitForTimeout(ms);
const vis = (loc) => loc.locator("visible=true").first();
const tocar = async (loc, nom, antes = 600, despues = 900) => {
  await pausa(antes);
  await vis(loc).tap();
  marca("toque: " + nom);
  await pausa(despues);
};
const fallar = async (msg) => {
  marca("ERROR: " + msg);
  await page.screenshot({ path: aqui("./e3_error.png") }).catch(() => {});
  await cap.detener();
  guardar();
  await browser.close();
  console.log("FALLÓ:", msg);
  process.exit(2);
};
const esperar = async (sel, ms = 30000) => page.waitForSelector(sel, { timeout: ms }).catch(() => fallar("no apareció " + sel));

marca("entrenar visible");
await pausa(2500);
// Bajar hasta el botón "Cerrar semana" con un deslizamiento.
const cerrar = vis(page.getByRole("button", { name: /Cerrar semana/ }));
await cerrar.scrollIntoViewIfNeeded();
await pausa(1200);
await tocar(page.getByRole("button", { name: /Cerrar semana/ }), "Cerrar semana (botón)", 200, 500);
await esperar("text=¿Terminaste la semana?");
marca("recuadro cerrar");
await pausa(3000);
await tocar(page.getByText(/¿Cómo te sentiste\?/), "¿Cómo te sentiste?", 300, 900);
await vis(page.locator("textarea")).tap();
await vis(page.locator("textarea")).pressSequentially("Me sentí bien, pude completar los cuatro días.", { delay: 55 });
marca("comentario escrito");
await pausa(1800);
await pausa(200);
await page.getByRole("alertdialog").getByRole("button", { name: "Cerrar semana" }).tap();
marca("toque: Cerrar semana (confirmar)");
await esperar("text=Semana 1 completada", 60000);
await pausa(300);
await quieto();
marca("semana cerrada");
await pausa(2500);
await tocar(page.getByRole("button", { name: /semana siguiente/ }).or(page.getByRole("link", { name: /semana siguiente/ })), "Generar la semana siguiente", 300, 1200);
await esperar("text=¿Cuántos días por semana?");
marca("paso días");
await pausa(2200);
await tocar(page.getByRole("button", { name: "Continuar", exact: true }), "Continuar (días)", 200, 1500);
marca("paso estructura");
await pausa(2200);
console.log("botones paso 2:", await page.locator("button:visible").allInnerTexts());
await tocar(page.getByRole("button", { name: /^Generar/ }).or(page.getByRole("button", { name: "Continuar", exact: true })), "Generar", 200, 500);
marca("generando…");

const res = await Promise.race([
  page.waitForURL(/\/rutina\/propuesta\//, { timeout: 300000 }).then(() => "ok"),
  page.waitForSelector("text=Probar de nuevo", { timeout: 300000 }).then(() => "error"),
]).catch(() => "timeout");
if (res !== "ok") await fallar("la IA no devolvió propuesta: " + res);
await quieto();
marca("propuesta visible");
console.log("url propuesta:", page.url());
await pausa(3500);
// Pestaña Cambios (antes y después)
await tocar(page.getByRole("tab", { name: /Cambios/ }).or(page.getByRole("button", { name: /^Cambios/ })), "pestaña Cambios", 300, 4500);
marca("cambios a la vista");
await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
await pausa(2500);
await tocar(page.getByRole("tab", { name: /Semana/ }).or(page.getByRole("button", { name: /^Semana/ })), "pestaña Semana", 300, 2500);
await tocar(page.getByRole("button", { name: /Aceptar/ }), "Aceptar", 400, 500);
await esperar("text=Comenzar entrenamiento", 60000);
marca("aceptada");
await pausa(3000);
marca("FIN");
await cap.detener();
guardar();
console.log("cuadros:", cap.cuadros());
await browser.close();
