// Escena 1 completa en una sola captura continua:
// Inicio -> Nueva rutina -> asistente -> Generar rutina (IA real) -> propuesta (ⓘ, cambiar ejercicio, día siguiente) -> Aceptar.
// SOLO_B=1 PROP=<id>: salta la generación y filma solo la propuesta ya pendiente (otra carpeta).
import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { iniciarCaptura } from "./cast.mjs";

const base = process.env.BASE ?? "http://localhost:3001";
const soloB = process.env.SOLO_B === "1";
const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));
const nombre = soloB ? "e1b" : "e1";
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
const tocar = async (loc, nom, antes = 700, despues = 900) => {
  await pausa(antes);
  await vis(loc).tap();
  marca("toque: " + nom);
  await pausa(despues);
};
const fallar = async (msg) => {
  marca("ERROR: " + msg);
  await pausa(1000);
  await cap.detener();
  guardar();
  await browser.close();
  console.log("FALLÓ:", msg);
  process.exit(2);
};

let propUrl = null;
if (!soloB) {
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Hola, Alex", { timeout: 60000 });
  marca("inicio visible");
  await pausa(2500);
  await tocar(page.getByText("Nueva rutina", { exact: true }), "Nueva rutina");
  await page.waitForSelector("text=¿Cuál es tu objetivo?");
  marca("paso objetivo");
  await tocar(page.getByText("masa", { exact: true }), "masa", 1200, 700);
  await tocar(page.getByRole("button", { name: "Continuar" }), "Continuar (objetivo)", 300, 600);
  await page.waitForSelector("text=¿Cuál es tu nivel?");
  marca("paso nivel");
  await tocar(page.getByText("intermedio", { exact: true }), "intermedio", 1000, 700);
  await tocar(page.getByRole("button", { name: "Continuar" }), "Continuar (nivel)", 300, 600);
  await page.waitForSelector("text=¿Cuántos días por semana?");
  marca("paso días");
  await tocar(page.getByText("4", { exact: true }), "4 días", 1000, 700);
  await tocar(page.getByRole("button", { name: "Continuar" }), "Continuar (días)", 300, 600);
  await page.waitForSelector("text=¿Cómo querés repartir tus entrenamientos?");
  marca("paso estructura");
  await tocar(page.getByText("Torso y pierna", { exact: true }), "Torso y pierna", 1200, 900);
  await tocar(page.getByRole("button", { name: "Generar rutina" }), "Generar rutina", 800, 500);
  marca("generando…");
  const res = await Promise.race([
    page.waitForURL(/\/rutina\/propuesta\//, { timeout: 330000 }).then(() => "ok"),
    page.getByRole("button", { name: /Probar de nuevo/ }).waitFor({ timeout: 330000 }).then(() => "error"),
  ]);
  if (res !== "ok") await fallar("la IA falló (pantalla de error)");
  propUrl = page.url();
  marca("propuesta abierta");
} else {
  propUrl = `${base}/rutina/propuesta/${process.env.PROP}`;
  await page.goto(propUrl, { waitUntil: "domcontentloaded" });
}

// ---- Parte B: la propuesta ----
await page.waitForSelector("text=Torso y pierna", { timeout: 60000 });
marca("propuesta visible");
await pausa(2500);
const primero = (await vis(page.locator("[aria-label^='Más información de ']").first()).getAttribute("aria-label")).replace("Más información de ", "");
await tocar(page.getByRole("button", { name: "Más información de " + primero }), "ⓘ " + primero, 600, 4500);
marca("panel info leído");
await page.keyboard.press("Escape");
await pausa(900);
await tocar(page.getByText(primero, { exact: true }), "desplegar ejercicio", 600, 1100);
await tocar(page.getByRole("button", { name: /Cambiar ejercicio/ }), "Cambiar ejercicio", 400, 1800);
await page.getByRole("radio").first().waitFor({ timeout: 30000 });
await tocar(page.getByRole("radio"), "elegir alternativa", 500, 900);
await tocar(page.getByRole("button", { name: "Cambiar", exact: true }), "Cambiar", 500, 2200);
await tocar(page.getByRole("button", { name: /Día siguiente/ }), "día siguiente", 600, 2800);
await tocar(page.getByRole("button", { name: /Día siguiente/ }), "día siguiente", 300, 2200);
await tocar(page.getByRole("button", { name: "Aceptar", exact: true }), "Aceptar", 800, 800);
await page.getByText("Comenzar entrenamiento", { exact: false }).locator("visible=true").first().waitFor({ timeout: 90000 });
marca("aceptada");
await pausa(3500);
marca("FIN");
await cap.detener();
guardar();
console.log("cuadros:", cap.cuadros(), "carpeta:", out);
await browser.close();
