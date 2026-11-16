// Escena 4: Progreso. Inicio -> Resúmenes (semana) -> Estadísticas: Mapa, Radar, Evolución, Cuerpo y peso -> Inicio -> Calendario.
// Sin IA.
import { chromium } from "playwright";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { iniciarCaptura } from "./cast.mjs";

const base = process.env.BASE ?? "http://localhost:3001";
const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));
const nombre = "e4";
const out = aqui(`./${nombre}/`);

const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--force-device-scale-factor=2"] });
const ctx = await browser.newContext({ viewport: null, hasTouch: true, locale: "es-AR", storageState: aqui("./estado.json") });
await ctx.addInitScript(() => { try { localStorage.setItem("spotter:sin-avisos-dev", "1"); } catch {} });
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

const quieto = async (extra = 800) => {
  await page.waitForFunction(() => !document.body.innerText.includes("Cargando"), null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(extra);
};
// Precalentar: que cada pantalla ya esté compilada y con sus datos.
for (const ruta of ["/", "/progreso/resumenes", "/progreso", "/progreso/mapa", "/progreso/musculos", "/progreso/ejercicios", "/progreso/cuerpo", "/progreso/calendario"]) {
  await page.goto(base + ruta, { waitUntil: "domcontentloaded" });
  await quieto(1500);
}
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("text=Resúmenes", { timeout: 60000 });
await quieto(1200);

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
  await page.screenshot({ path: aqui("./e4_error.png") }).catch(() => {});
  await cap.detener();
  guardar();
  await browser.close();
  console.log("FALLÓ:", msg);
  process.exit(2);
};
const esperar = async (sel, ms = 30000) => page.waitForSelector(sel, { timeout: ms }).catch(() => fallar("no apareció " + sel));
const volver = () => tocar(page.getByRole("link", { name: /Volver/ }).or(page.getByRole("button", { name: /Volver/ })), "Volver", 400, 700);

marca("inicio visible");
await pausa(2500);

// 1) Resúmenes de la semana
await tocar(page.getByRole("link", { name: /Resúmenes/ }), "Resúmenes", 300, 600);
await esperar("text=Series hechas por día");
await quieto(600);
marca("resumenes visible");
await pausa(3000);
await page.touchscreen.tap(91, 330); // una barra: el detalle del día
marca("toque: barra del día");
await pausa(3200);
await volver();
await esperar("text=Tu progreso");
await pausa(900);

// 2) Estadísticas: mapa, radar, evolución, cuerpo
await tocar(page.getByRole("link", { name: /Estadísticas/ }), "Estadísticas", 300, 700);
await esperar("text=Mapa muscular");
marca("estadisticas visible");
await pausa(1500);
await tocar(page.getByRole("link", { name: /Mapa muscular/ }), "Mapa muscular", 300, 600);
await esperar("text=Semana");
await quieto(900);
marca("mapa visible");
await pausa(3800);
await volver();
await esperar("text=Radar de músculos");
await pausa(500);
await tocar(page.getByRole("link", { name: /Radar de músculos/ }), "Radar de músculos", 300, 600);
await quieto(1200);
marca("radar visible");
await pausa(3800);
await volver();
await esperar("text=Evolución por ejercicio");
await pausa(500);
await tocar(page.getByRole("link", { name: /Evolución por ejercicio/ }), "Evolución por ejercicio", 300, 600);
await esperar("text=Récord");
await quieto(900);
marca("evolucion visible");
await pausa(4000);
await volver();
await esperar("text=Cuerpo y peso");
await pausa(500);
await tocar(page.getByRole("link", { name: /Cuerpo y peso/ }), "Cuerpo y peso", 300, 600);
await esperar("text=Peso actual");
await quieto(900);
marca("cuerpo visible");
await pausa(4000);
await volver(); // a Progreso
await esperar("text=Radar de músculos");
await pausa(400);
await volver(); // a Inicio
await esperar("text=Tu progreso");
await pausa(700);

// 3) Calendario
await tocar(page.getByRole("link", { name: /Calendario/ }), "Calendario", 300, 600);
await esperar("text=Noviembre de 2026");
await quieto(900);
marca("calendario visible");
await pausa(3500);
marca("FIN");
await cap.detener();
guardar();
console.log("cuadros:", cap.cuadros());
await browser.close();
