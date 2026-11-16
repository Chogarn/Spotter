"""Arma el video final: escenas 0-5 + voz (por frases, ubicadas en su pantalla) + música.
Uso (dentro de la imagen spotter-whisper, con video-demo montado en /v):  python /v/nuevo/datos/final.py [solo_audio]
Salida: /v/spotter-demo-final.mp4 y /v/nuevo/datos/linea_de_tiempo.json"""
import json, os, sys
import av
import numpy as np

V = "/v"
N = V + "/nuevo"
D = N + "/datos"
MUSICA = [f for f in os.listdir(V) if f.endswith(".mp3")][0]
FPS, XF, SR = 30, 0.5, 44100
XF_ESC = 0.4  # disolvencia interna de montar.py


# ---------- mapa de marcas -> tiempo dentro del mp4 de cada escena ----------
def cargar(n):
    marcas = {m["nombre"]: m["epoch"] for m in json.load(open(f"{D}/marcas_e{n}.json"))}
    segs = json.load(open(f"{D}/segs_e{n}.json"))
    seg = [(marcas[s["desde"][0]] + s["desde"][1], marcas[s["hasta"][0]] + s["hasta"][1], float(s.get("vel", 1.0))) for s in segs]
    dur = [(h - d) / v for d, h, v in seg]
    ini, acum = [], 0.0
    for k, d in enumerate(dur):
        ini.append(acum)
        acum += d - (XF_ESC if k < len(dur) - 1 else 0)
    return marcas, seg, ini, acum


def ot(n, marca, off=0.0):
    marcas, seg, ini, _ = cargar(n)
    t = marcas[marca] + off
    for k, (d, h, v) in enumerate(seg):
        if d <= t <= h:
            return ini[k] + (t - d) / v
    for k, (d, h, v) in enumerate(seg):
        if d > t:
            return ini[k]
    return ini[-1] + (seg[-1][1] - seg[-1][0]) / seg[-1][2]


# ---------- voz ----------
def leer_voz(n):
    c = av.open(f"{N}/e{n}.mp4")
    st = c.streams.audio[0]
    r = av.AudioResampler(format="flt", layout="mono", rate=SR)
    xs = []
    for p in c.demux(st):
        if p.size == 0:
            continue
        try:
            fr = p.decode()
        except Exception:
            continue
        for f in fr:
            for g in r.resample(f):
                xs.append(g.to_ndarray().reshape(-1))
    return np.concatenate(xs).astype(np.float32)


def pieza(voz, a, b):
    x = voz[int(a * SR): int(b * SR)].copy()
    rms = np.sqrt((x ** 2).mean()) + 1e-9
    x *= 0.10 / rms  # que todas las frases suenen parejas
    f = int(0.03 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return np.tanh(x * 1.5) / 1.5


# ---------- plan por escena ----------
# velocidad del video y frases: (voz_desde, voz_hasta, ancla); ancla = segundos (en la escena final) o (marca, desplazamiento) en tiempo del mp4
ESC = {
    0: dict(vel=7.0 / 15.5, frases=[(0.30, 14.95, 0.0)]),
    1: dict(vel=1.0, frases=[
        (0.80, 7.95, ("toque: Nueva rutina", -0.1)),
        (8.60, 22.40, ("toque: Torso y pierna", -1.3)),
        (23.40, 27.95, ("toque: ⓘ Press de banca con barra", -0.2)),
        (28.30, 36.80, ("toque: Cambiar ejercicio", -0.8)),
    ]),
    2: dict(vel=1.15, frases=[
        (0.70, 13.55, ("entrada en calor", 0.0)),
        (14.15, 16.9, ("toque: Iniciar descanso", -1.0)),
        (17.35, 24.7, ("listo el día", -1.0)),
    ]),
    3: dict(vel=1.35, frases=[
        (0.75, 23.85, ("toque: Cerrar semana (botón)", -1.0)),
        (24.0, 29.5, ("toque: pestaña Cambios", -1.0)),
    ]),
    4: dict(vel=1.6, frases=[
        (1.10, 4.45, ("resumenes visible", 0.3)),
        (4.80, 8.9, ("mapa visible", -0.3)),
        (9.40, 11.8, ("evolucion visible", 0.0)),
        (12.15, 13.2, ("cuerpo visible", 0.2)),
        (13.55, 15.0, ("calendario visible", 0.0)),
    ]),
    5: dict(vel=1.0, frases=[(0.0, 23.7, 0.0)]),
}


class Lector:
    def __init__(self, ruta):
        self.c = av.open(ruta)
        self.it = self.c.decode(video=0)
        self.cur = None
        self.nxt = next(self.it, None)
        self.cache = (None, None)

    def get(self, t):
        while self.nxt is not None and (self.cur is None or float(self.nxt.pts * self.nxt.time_base) <= t):
            self.cur = self.nxt
            self.nxt = next(self.it, None)
            self.cache = (None, None)
        if self.cache[0] is not self.cur:
            self.cache = (self.cur, self.cur.to_ndarray(format="rgb24"))
        return self.cache[1]


def main():
    solo_audio = len(sys.argv) > 1
    escenas = []
    for n in range(6):
        marcas, seg, ini, dur = cargar(n)
        # duración real del mp4
        c = av.open(f"{N}/escena{n}.mp4")
        dmp4 = float(c.duration) / 1e6
        c.close()
        escenas.append(dict(n=n, dmp4=dmp4, T=dmp4 / ESC[n]["vel"]))
    inicio = []
    acum = 0.0
    for e in escenas:
        inicio.append(acum)
        acum += e["T"] - XF
    total = acum + XF
    print("duración total %.1f s" % total)

    # voz
    nsm = int((total + 1) * SR)
    voz_pista = np.zeros(nsm, np.float32)
    mascara = np.zeros(nsm, np.float32)
    linea = []
    for e in escenas:
        n = e["n"]
        voz = leer_voz(n)
        ultimo_fin = -9.0
        for (a, b, ancla) in ESC[n]["frases"]:
            if isinstance(ancla, tuple):
                t_local = ot(n, ancla[0], ancla[1]) / ESC[n]["vel"]
            else:
                t_local = ancla
            t = inicio[n] + t_local
            pedido = t
            if t < ultimo_fin + 0.30:
                t = ultimo_fin + 0.30
            x = pieza(voz, a, b)
            i = int(t * SR)
            voz_pista[i: i + len(x)] += x[: nsm - i]
            mascara[i: i + len(x)] = 1.0
            ultimo_fin = t + len(x) / SR
            linea.append(dict(escena=n, desde=round(a, 2), hasta=round(b, 2), pedido=round(pedido, 2), ubicado=round(t, 2),
                              corrida=round(t - pedido, 2), fin=round(ultimo_fin, 2)))
            tope = inicio[n] + e["T"]
            if ultimo_fin > tope + 0.2:
                print("  ¡aviso! escena", n, "la voz termina", round(ultimo_fin - tope, 2), "s después de la escena")
    for l in linea:
        print(l)
    json.dump(dict(total=total, inicio=inicio, escenas=[e["T"] for e in escenas], voz=linea), open(f"{D}/linea_de_tiempo.json", "w"), indent=1)

    # música: se repite con fundido si hace falta, baja bajo la voz
    c = av.open(f"{V}/{MUSICA}")
    r = av.AudioResampler(format="fltp", layout="stereo", rate=SR)
    xs = []
    for f in c.decode(audio=0):
        for g in r.resample(f):
            xs.append(g.to_ndarray())
    m = np.concatenate(xs, axis=1).astype(np.float32)
    xf = 6 * SR
    out = m
    while out.shape[1] < nsm + xf:
        a, b = out[:, -xf:], m[:, :xf]
        w = np.linspace(0, 1, xf, dtype=np.float32)
        out = np.concatenate([out[:, :-xf], a * (1 - w) + b * w, m[:, xf:]], axis=1)
    mus = out[:, :nsm].copy()
    # envolvente: alta sin voz, baja con voz
    def promedio(x, ventana):
        c = np.concatenate([[0.0], np.cumsum(x, dtype=np.float64)])
        h = ventana // 2
        i = np.arange(len(x))
        a, b = np.clip(i - h, 0, len(x)), np.clip(i + h, 0, len(x))
        return ((c[b] - c[a]) / np.maximum(b - a, 1)).astype(np.float32)

    ocupa = np.clip(promedio(mascara, int(1.2 * SR)) * 3, 0, 1)
    g = 0.19 - (0.19 - 0.075) * ocupa
    g = promedio(g, int(0.5 * SR))
    mus *= g
    tt = np.arange(nsm) / SR
    mus *= np.clip(tt / 1.5, 0, 1) * np.clip((total + 0.3 - tt) / 3.0, 0, 1)
    audio = mus + voz_pista[None, :]
    pico = np.abs(audio).max()
    print("pico de audio %.2f" % pico)
    if pico > 0.97:
        audio *= 0.97 / pico
    audio = audio.astype(np.float32)
    if solo_audio:
        return

    # video
    primero = Lector(f"{N}/escena0.mp4").get(0.0)
    H, W, _ = primero.shape
    lect = [Lector(f"{N}/escena{e['n']}.mp4") for e in escenas]
    out = av.open(f"{V}/spotter-demo-final.mp4", "w")
    sv = out.add_stream("libx264", rate=FPS)
    sv.width, sv.height, sv.pix_fmt = W, H - (H % 2), "yuv420p"
    sv.options = {"crf": "18", "preset": "medium"}
    sa = out.add_stream("aac", rate=SR)
    sa.layout = "stereo"
    sa.bit_rate = 192000
    nfr = int(total * FPS)
    pos_a = 0
    for k in range(nfr):
        t = k / FPS
        act = [i for i, e in enumerate(escenas) if inicio[i] <= t < inicio[i] + e["T"]]
        if not act:
            act = [len(escenas) - 1]

        def cuadro(i):
            tl = max(0.0, t - inicio[i])
            fr = lect[i].get(min(tl * ESC[i]["vel"], escenas[i]["dmp4"] - 0.01))
            if fr.shape[0] != H or fr.shape[1] != W:
                fr = np.array(av.VideoFrame.from_ndarray(fr, format="rgb24").reformat(width=W, height=H).to_ndarray())
            return fr

        fr = cuadro(act[0])
        if len(act) > 1:
            a = min(max((t - inicio[act[1]]) / XF, 0.0), 1.0)
            fr = (fr.astype(np.float32) * (1 - a) + cuadro(act[1]).astype(np.float32) * a).astype(np.uint8)
        # fundido a negro al final
        if t > total - 1.2:
            fr = (fr.astype(np.float32) * max(0.0, (total - t) / 1.2)).astype(np.uint8)
        for pkt in sv.encode(av.VideoFrame.from_ndarray(np.ascontiguousarray(fr[: sv.height]), format="rgb24")):
            out.mux(pkt)
        while pos_a + 1024 <= nsm and pos_a / SR <= t + 0.2:
            af = av.AudioFrame.from_ndarray(np.ascontiguousarray(audio[:, pos_a: pos_a + 1024]), format="fltp", layout="stereo")
            af.sample_rate = SR
            af.pts = pos_a
            for pkt in sa.encode(af):
                out.mux(pkt)
            pos_a += 1024
        if k % 600 == 0:
            print("  cuadro", k, "de", nfr, flush=True)
    for pkt in sv.encode():
        out.mux(pkt)
    fin_audio = int(total * SR)
    while pos_a + 1024 <= fin_audio:
        af = av.AudioFrame.from_ndarray(np.ascontiguousarray(audio[:, pos_a: pos_a + 1024]), format="fltp", layout="stereo")
        af.sample_rate = SR
        af.pts = pos_a
        for pkt in sa.encode(af):
            out.mux(pkt)
        pos_a += 1024
    for pkt in sa.encode():
        out.mux(pkt)
    out.close()
    print("listo spotter-demo-final.mp4")


main()
