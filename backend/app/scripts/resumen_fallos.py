"""Resumen del registro de generaciones (`generation_logs`), solo para el equipo.

Muestra cuántos intentos hubo, cómo terminaron y qué reglas fallan más, por objetivo, nivel, estructura y
proveedor. Sirve para decidir si conviene ajustar el prompt o una regla.

Uso:

    docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.resumen_fallos
    docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.resumen_fallos --dias 7
"""

import argparse
from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.db import get_sessionmaker
from app.models import GenerationLog


def _tabla(titulo: str, contador: Counter, total: int) -> None:
    print(f"\n{titulo}")
    for clave, n in contador.most_common():
        print(f"  {clave or '(sin dato)':<22} {n:>4}  ({100 * n / total:.0f} %)")


def resumir(filas: list[GenerationLog]) -> None:
    if not filas:
        print("No hay intentos registrados en ese período.")
        return
    total = len(filas)
    print(f"Intentos registrados: {total}")
    _tabla("Resultado de cada intento", Counter(f.outcome for f in filas), total)

    codigos = Counter(c for f in filas for c in set(f.codes or []))
    _tabla("Reglas que fallaron (intentos que la traen)", codigos, total)

    # Lo que vio la persona: una fila por generación (el intento que se mostró) o el fallo.
    mostradas = [f for f in filas if f.shown]
    sin_mostrar = total - len(mostradas)
    print(f"\nRutinas mostradas a la persona: {len(mostradas)} · intentos que no se mostraron: {sin_mostrar}")
    con_aviso = sum(1 for f in mostradas if f.outcome == "ok_con_avisos")
    if mostradas:
        print(f"  con avisos: {con_aviso} ({100 * con_aviso / len(mostradas):.0f} %)")

    for titulo, campo in (
        ("Por objetivo", "goal"), ("Por nivel", "level"), ("Por estructura", "split"),
        ("Por proveedor", "provider"), ("Por tipo", "kind"),
    ):
        por_grupo: dict[str, Counter] = {}
        for f in filas:
            por_grupo.setdefault(getattr(f, campo), Counter())[f.outcome] += 1
        print(f"\n{titulo} (intentos · % que no salió limpio)")
        for grupo, cuenta in sorted(por_grupo.items(), key=lambda x: -sum(x[1].values())):
            n = sum(cuenta.values())
            mal = n - cuenta["ok"]
            print(f"  {grupo or '(sin dato)':<22} {n:>4}  ·  {100 * mal / n:.0f} %")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dias", type=int, default=None, help="solo los últimos N días (por defecto, todo)")
    args = parser.parse_args()
    with get_sessionmaker()() as db:
        consulta = select(GenerationLog).order_by(GenerationLog.created_at)
        if args.dias:
            consulta = consulta.where(
                GenerationLog.created_at >= datetime.now(timezone.utc) - timedelta(days=args.dias)
            )
        resumir(list(db.scalars(consulta)))


if __name__ == "__main__":
    main()
