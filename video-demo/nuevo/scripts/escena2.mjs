// Escena 2: entrenar un día. Inicio -> Empezar -> entrada en calor (cronómetro) -> 1er ejercicio con detalle
// (kilos, Serie hecha, descanso) -> resto rápido -> cardio -> "¡Listo el Día 1!" -> Día completado -> festejo.
import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { iniciarCaptura } from "./cast.mjs";

const base = process.env.BASE ?? "http://localhost:3001";
const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));
const nombre = "e2";
const out = aqui(`./${nombre}/`);

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--force-device-scale-factor=2"] });
const ctx = await browser.newContext({ viewport: null, hasTouch: true, locale: "es-AR", storageState: aqui("./estado.json") });
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
const cdp0 = await ctx.newCDPSession(page); // para fijar el tamaño antes de la captura
await cdp0.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 0, mobile: false });

// Precalentar las pantallas (el servidor de desarrollo compila la primera vez) antes de capturar.
for (const ruta of ["/", "/semanas/142/dia/1/entrenar", "/"]) {
  await page.goto(base + ruta, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !document.body.innerText.includes("Cargando..."), null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(800);
}
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Hola, Alex", { timeout: 60000 });
await page.waitForFunction(() => !document.body.innerText.includes("Cargando..."), null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1200);

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
  await page.screenshot({ path: aqui("./e2_error.png") }).catch(() => {});
  await cap.detener();
  guardar();
  await browser.close();
  console.log("FALLÓ:", msg);
  process.exit(2);
};
const esperar = async (sel, ms = 30000) => page.waitForSelector(sel, { timeout: ms }).catch(() => fallar("no apareció " + sel));

marca("inicio visible");
await pausa(2500);
await tocar(page.getByRole("button", { name: /Empezar/ }).or(page.getByRole("link", { name: /Empezar/ })), "Empezar (Hoy te toca)", 300, 300);
await esperar("text=Entrada en calor", 60000);
marca("entrada en calor");
await pausa(1500);
await tocar(page.getByRole("button", { name: "Empezar", exact: true }), "▶ Empezar cronómetro", 300, 5500);
await tocar(page.getByRole("button", { name: /Finalizar/ }), "✓ Finalizar", 300, 1800);

// ---- 1er ejercicio, con detalle ----
await esperar("text=Aperturas en máquina");
marca("ejercicio 1");
await pausa(1500);
await tocar(page.getByText(/Series · kilos y reps/), "abrir Series · kilos y reps", 400, 1000);
const kilos = (n) => page.getByLabel(`Serie ${n}: kilos`, { exact: true });
await vis(kilos(1)).tap();
await vis(kilos(1)).pressSequentially("35", { delay: 220 });
marca("kilos serie 1 escritos");
await pausa(700);
await tocar(page.getByRole("button", { name: "Serie hecha" }), "Serie hecha (1)", 300, 1600);
await tocar(page.getByRole("button", { name: /Iniciar descanso/ }), "Iniciar descanso", 300, 3800);
marca("descanso a la vista");
await tocar(page.getByRole("button", { name: /Saltar descanso/ }), "Saltar descanso", 200, 1100);
for (const n of [2, 3]) {
  await vis(kilos(n)).fill("35");
  await tocar(page.getByRole("button", { name: "Serie hecha" }), `Serie hecha (${n})`, 400, n === 3 ? 2200 : 1500);
}
marca("ejercicio 1 hecho");

// ---- ejercicios 2 a 6, toques rápidos (se acelera en el montaje) ----
marca("rapidos desde");
for (let e = 2; e <= 6; e++) {
  for (let s = 1; s <= 3; s++) {
    await tocar(page.getByRole("button", { name: "Serie hecha" }), `rápida ${e}.${s}`, 150, 1100);
  }
  // Comprobar que la app pasó al ejercicio siguiente; si se perdió un toque, repetir.
  for (let intento = 0; intento < 3; intento++) {
    const paso = await page.waitForSelector(`text=ejercicio ${e + 1} de 7`, { timeout: 5000 }).then(() => true).catch(() => false);
    if (paso) break;
    marca(`reintento ejercicio ${e}`);
    await tocar(page.getByRole("button", { name: "Serie hecha" }), `rápida ${e}.extra`, 150, 1100);
  }
}
marca("rapidos hasta");

// ---- cardio (último paso) ----
await esperar("text=ejercicio 7 de 7");
marca("cardio");
await pausa(1500);
await tocar(page.getByRole("button", { name: "Empezar", exact: true }), "▶ Empezar cardio", 300, 4500);
await tocar(page.getByRole("button", { name: /Finalizar/ }), "✓ Finalizar cardio", 300, 1500);

// ---- cierre del día ----
await esperar("text=¡Listo el Día 1!", 30000);
marca("listo el día");
await pausa(3500);
await tocar(page.getByRole("button", { name: "Día completado" }), "Día completado", 300, 500);
await esperar("text=Día 1 completado", 30000);
marca("festejo");
await pausa(4500);
marca("FIN");
await cap.detener();
guardar();
console.log("cuadros:", cap.cuadros());
await browser.close();
