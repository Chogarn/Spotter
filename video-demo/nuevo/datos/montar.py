"""Monta una escena con segmentos de una captura (JPEG con hora), velocidades y disolvencias.
Uso: python montar.py <marcas.json> <carpeta_cuadros> <salida.mp4> <segmentos.json>
segmentos.json: [{"desde": ["marca", segundos], "hasta": ["marca", segundos], "vel": 1.0}, ...]
Cada segmento se disuelve (0.4 s) con el siguiente: los últimos 0.4 s de uno se mezclan con los primeros del otro."""
import glob, json, os, sys
import av
import numpy as np

marcas_json, carpeta, salida, segs_json = sys.argv[1:5]
FPS = 30
XF = 0.4

marcas = {m["nombre"]: m["epoch"] for m in json.load(open(marcas_json))}
cuadros = sorted((float(os.path.basename(p)[:-4]), p) for p in glob.glob(os.path.join(carpeta, "*.jpg")))


def miniatura(ruta):
    with av.open(ruta) as c:
        for f in c.decode(video=0):
            return f.to_ndarray(format="rgb24")[::24, ::24].astype(np.int16)


# Saca los cuadros "rotos" sueltos de la captura (la pantalla a medio redimensionar, estirada): un cuadro muy
# distinto de sus dos vecinos, que entre sí casi no cambian.
if os.environ.get("SIN_FILTRO") != "1" and len(cuadros) > 3:
    mini = [miniatura(p) for _, p in cuadros]
    formas = [m.shape for m in mini]
    comun = max(set(formas), key=formas.count)
    buenos = [f == comun for f in formas]  # un cuadro de otro tamaño es uno roto
    for i in range(1, len(cuadros) - 1):
        if not (buenos[i] and buenos[i - 1] and buenos[i + 1]):
            continue
        a = np.abs(mini[i] - mini[i - 1]).mean()
        b = np.abs(mini[i] - mini[i + 1]).mean()
        v = np.abs(mini[i - 1] - mini[i + 1]).mean()
        if a > 40 and b > 40 and v < min(a, b) * 0.5:
            buenos[i] = False
    quitados = [cuadros[i][0] for i, ok in enumerate(buenos) if not ok]
    print("cuadros rotos quitados:", len(quitados))
    cuadros = [c for c, ok in zip(cuadros, buenos) if ok]
ts = np.array([t for t, _ in cuadros])
rutas = [p for _, p in cuadros]
cache = {}


def leer(i):
    if i not in cache:
        if len(cache) > 12:
            cache.pop(next(iter(cache)))
        with av.open(rutas[i]) as c:
            for f in c.decode(video=0):
                cache[i] = f.to_ndarray(format="rgb24")
                break
    return cache[i]


def en(t):
    i = int(np.searchsorted(ts, t, side="right")) - 1
    return leer(max(i, 0))


def tiempo(spec):
    nombre, off = spec
    return marcas[nombre] + off


SEG = [(tiempo(s["desde"]), tiempo(s["hasta"]), float(s.get("vel", 1.0))) for s in json.load(open(segs_json))]
dur = [(h - d) / v for d, h, v in SEG]  # duración en el video final
inicio = []
acum = 0.0
for k, d in enumerate(dur):
    inicio.append(acum)
    acum += d - (XF if k < len(dur) - 1 else 0)
total = acum
n_total = int(total * FPS) + 1
print("segmentos (s en video):", [round(x, 1) for x in dur], "total %.1f s" % total)

h, w, _ = en(SEG[0][0]).shape
out = av.open(salida, "w")
s = out.add_stream("libx264", rate=FPS)
s.width, s.height, s.pix_fmt = w, h - (h % 2), "yuv420p"
s.options = {"crf": "17", "preset": "medium"}


def cuadro(k, t):
    d, h_, v = SEG[k]
    return en(min(d + (t - inicio[k]) * v, h_))


for n in range(n_total):
    t = n / FPS
    activos = [i for i, io in enumerate(inicio) if io <= t < io + dur[i] or (i == len(dur) - 1 and t >= io)]
    fr = cuadro(activos[0], t)
    if len(activos) > 1:
        a = min(max((t - inicio[activos[1]]) / XF, 0.0), 1.0)
        fr2 = cuadro(activos[1], t)
        fr = (fr.astype(np.float32) * (1 - a) + fr2.astype(np.float32) * a).astype(np.uint8)
    for pkt in s.encode(av.VideoFrame.from_ndarray(fr[: s.height], format="rgb24")):
        out.mux(pkt)
for pkt in s.encode():
    out.mux(pkt)
out.close()
print("listo", salida, n_total, "cuadros")
