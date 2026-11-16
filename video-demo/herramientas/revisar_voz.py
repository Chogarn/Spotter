"""Revisa las grabaciones de la voz del video sin escucharlas.

Pasa a texto cada archivo de video-demo/voz/ (escena-0 … escena-5, cualquier formato de audio),
lo compara con la voz de esa escena en docs/video-demo-guion.md y dice:
  - cuánto dura y dónde empieza y termina la voz (para recortar silencios);
  - qué palabras faltan, sobran o cambiaron respecto del guion;
  - si hay frases repetidas (una toma que se repitió por un error), con sus tiempos.
Además deja <archivo>.json con las palabras y sus tiempos, para editar.

Uso (desde la raíz del proyecto):
  docker run --rm -v "%cd%:/trabajo" -v spotter-whisper-modelos:/root/.cache spotter-whisper \
      python video-demo/herramientas/revisar_voz.py [--modelo small]
"""

import argparse
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

from faster_whisper import WhisperModel

RAIZ = Path(__file__).resolve().parents[2]
VOZ = RAIZ / "video-demo" / "voz"
GUION = RAIZ / "docs" / "video-demo-guion.md"
AUDIO = {".m4a", ".mp3", ".wav", ".ogg", ".opus", ".aac", ".flac", ".webm", ".mp4", ".3gp", ".amr"}


def normalizar(texto: str) -> list[str]:
    """Palabras en minúscula, sin tildes ni signos: para comparar, no para mostrar."""
    sin_tildes = "".join(c for c in unicodedata.normalize("NFKD", texto) if not unicodedata.combining(c))
    return re.findall(r"[a-z0-9ñ]+", sin_tildes.lower())


def voces_del_guion() -> dict[int, str]:
    texto = GUION.read_text(encoding="utf-8")
    voces = {}
    for bloque in re.split(r"^## Escena ", texto, flags=re.M)[1:]:
        numero = int(bloque.split(" ", 1)[0])
        m = re.search(r'\*\*Voz:\*\* "(.*?)"', bloque, flags=re.S)
        if m:
            voces[numero] = m.group(1)
    return voces


def repeticiones(palabras: list[dict], largo: int = 4) -> list[str]:
    """Secuencias de `largo` palabras que aparecen dos veces: suele ser una frase regrabada."""
    norm = [normalizar(p["palabra"]) for p in palabras]
    norm = [n[0] if n else "" for n in norm]
    vistos: dict[tuple, int] = {}
    avisos = []
    for i in range(len(norm) - largo + 1):
        clave = tuple(norm[i : i + largo])
        if "" in clave:
            continue
        if clave in vistos and i - vistos[clave] >= largo:
            a, b = palabras[vistos[clave]], palabras[i]
            avisos.append(f'"{" ".join(clave)}" a los {a["inicio"]:.1f} s y otra vez a los {b["inicio"]:.1f} s')
        vistos.setdefault(clave, i)
    return avisos


def revisar(modelo: WhisperModel, archivo: Path, guion: str | None) -> None:
    segmentos, info = modelo.transcribe(str(archivo), language="es", word_timestamps=True, vad_filter=True)
    palabras = [
        {"palabra": w.word.strip(), "inicio": round(w.start, 2), "fin": round(w.end, 2), "seguridad": round(w.probability, 2)}
        for s in segmentos
        for w in (s.words or [])
    ]
    dicho = " ".join(p["palabra"] for p in palabras)
    print(f"\n=== {archivo.name} · {info.duration:.1f} s de audio")
    if not palabras:
        print("  No se entendió ninguna palabra.")
        return
    print(f"  La voz va de {palabras[0]['inicio']:.1f} s a {palabras[-1]['fin']:.1f} s "
          f"({palabras[-1]['fin'] - palabras[0]['inicio']:.1f} s hablando).")
    print(f"  Se entendió: {dicho}")

    dudosas = [p for p in palabras if p["seguridad"] < 0.5]
    if dudosas:
        print("  Palabras poco claras: " + ", ".join(f'"{p["palabra"]}" ({p["inicio"]:.1f} s)' for p in dudosas))
    for aviso in repeticiones(palabras):
        print("  Posible repetición: " + aviso)

    if guion is None:
        print("  (No encontré la voz de esta escena en el guion.)")
    else:
        esperado, obtenido = normalizar(guion), normalizar(dicho)
        parecido = difflib.SequenceMatcher(None, esperado, obtenido).ratio()
        print(f"  Coincidencia con el guion: {parecido:.0%}")
        for op, a1, a2, b1, b2 in difflib.SequenceMatcher(None, esperado, obtenido).get_opcodes():
            if op == "delete":
                print(f'    falta: "{" ".join(esperado[a1:a2])}"')
            elif op == "insert":
                print(f'    sobra: "{" ".join(obtenido[b1:b2])}"')
            elif op == "replace":
                print(f'    cambió: "{" ".join(esperado[a1:a2])}" → "{" ".join(obtenido[b1:b2])}"')

    archivo.with_suffix(archivo.suffix + ".json").write_text(
        json.dumps({"duracion": info.duration, "palabras": palabras}, ensure_ascii=False, indent=1), encoding="utf-8"
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--modelo", default="small", help="tiny, base, small o medium (más grande, más preciso y lento)")
    p.add_argument("archivos", nargs="*", help="por defecto, todo video-demo/voz/")
    args = p.parse_args()

    archivos = [Path(a) for a in args.archivos] or sorted(f for f in VOZ.glob("*") if f.suffix.lower() in AUDIO)
    if not archivos:
        sys.exit(f"No hay audios en {VOZ}")
    voces = voces_del_guion()
    modelo = WhisperModel(args.modelo, device="cpu", compute_type="int8")
    for archivo in archivos:
        m = re.search(r"(\d+)", archivo.stem)
        revisar(modelo, archivo, voces.get(int(m.group(1))) if m else None)


if __name__ == "__main__":
    main()
