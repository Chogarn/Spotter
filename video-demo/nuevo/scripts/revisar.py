import struct, sys, zlib
import av
import numpy as np

ruta = sys.argv[1]
tiempos = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else []


def png(path, arr):
    h, w, _ = arr.shape
    raw = b"".join(b"\x00" + arr[y].tobytes() for y in range(h))

    def chunk(t, d):
        x = struct.pack(">I", len(d)) + t + d
        return x + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    open(path, "wb").write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                           + chunk(b"IDAT", zlib.compress(raw, 3)) + chunk(b"IEND", b""))


c = av.open(ruta)
v = c.streams.video[0]
print("size", v.codec_context.width, v.codec_context.height, "fps", v.average_rate, "dur", float(c.duration) / 1e6)
prev = None
saltos = []
quiero = {t: False for t in tiempos}
n = 0
for f in c.decode(video=0):
    t = float(f.pts * v.time_base)
    rgb = f.to_ndarray(format="rgb24")
    g = rgb[::6, ::6].astype(np.int16)
    if prev is not None:
        d = float(np.abs(g - prev).mean())
        saltos.append((round(t, 2), round(d, 1)))
    prev = g
    for k in list(quiero):
        if not quiero[k] and t >= k:
            png(f"/s/pw/r_{k:06.2f}.png", rgb[::2, ::2])
            quiero[k] = True
    n += 1
print("cuadros", n)
grandes = sorted(saltos, key=lambda x: -x[1])[:12]
print("mayores cambios entre cuadros consecutivos (t, cambio medio 0-255):", grandes)
