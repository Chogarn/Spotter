"""Deja hechos (como estaba planificado) los días 2 a 4 de la semana de la cuenta demo, sin filmar."""
import os
import httpx

base = "http://localhost:8000"
week = int(os.environ.get("SEMANA", "142"))
c = httpx.Client(base_url=base, timeout=30)
r = c.post("/auth/login", json={"email": os.environ["EMAIL"], "password": os.environ["CLAVE"], "remember": False})
print("login", r.status_code)
r = c.post(f"/weeks/{week}/reopen")
print("reopen", r.status_code)
for n in (2, 3, 4):
    d = c.get(f"/weeks/{week}/days/{n}").json()
    if n == 2:
        print("claves del día:", list(d.keys()))
        print("claves ejercicio:", list(d["exercises"][0].keys()))
        print("claves serie:", list(d["exercises"][0]["sets"][0].keys()))
    print("start", n, c.post(f"/weeks/{week}/days/{n}/start").status_code)
    hechas = 0
    for e in d["exercises"]:
        for s in e["sets"]:
            rr = c.post(f"/weeks/{week}/days/{n}/sets/{s['id']}/done")
            if rr.status_code == 200:
                hechas += 1
            else:
                print("serie", s["id"], rr.status_code, rr.text[:120])
    print("día", n, "series hechas", hechas, "complete", c.post(f"/weeks/{week}/days/{n}/complete").status_code)
