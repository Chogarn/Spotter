// Captura de cuadros del navegador a 780x1688 que SIGUE después de cada navegación completa.
import fs from "node:fs";

export async function iniciarCaptura(ctx, page, out, { cada = 2, calidad = 90 } = {}) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  let cdp = null;
  let n = 0;
  let activo = true;

  async function arrancar() {
    if (!activo) return;
    try { await cdp?.send("Page.stopScreencast"); } catch {}
    try { await cdp?.detach(); } catch {}
    cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 0, mobile: false });
    const sesion = cdp;
    sesion.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
      fs.writeFileSync(`${out}${metadata.timestamp.toFixed(4)}.jpg`, Buffer.from(data, "base64"));
      n++;
      sesion.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    });
    await sesion.send("Page.startScreencast", { format: "jpeg", quality: calidad, maxWidth: 780, maxHeight: 1688, everyNthFrame: cada });
  }

  await arrancar();
  let reiniciando = false;
  page.on("framenavigated", async (f) => {
    if (f !== page.mainFrame() || reiniciando) return;
    reiniciando = true;
    try { await arrancar(); } catch (e) { console.log("captura: no pude reiniciar:", e.message); }
    reiniciando = false;
  });
  return {
    cuadros: () => n,
    detener: async () => {
      activo = false;
      try { await cdp?.send("Page.stopScreencast"); } catch {}
    },
  };
}
