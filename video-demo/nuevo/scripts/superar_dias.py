"""Rehace los días 2 a 4 de la semana demo con un poco MÁS que lo planificado (la IA lo lee como "superó")."""
import os
import httpx

week = int(os.environ.get("SEMANA", "142"))
c = httpx.Client(base_url="http://localhost:8000", timeout=30)
print("login", c.post("/auth/login", json={"email": os.environ["EMAIL"], "password": os.environ["CLAVE"], "remember": False}).status_code)
print("reopen semana", c.post(f"/weeks/{week}/reopen").status_code)
for n in (2, 3, 4):
    print("reabrir día", n, c.post(f"/weeks/{week}/days/{n}/reopen").status_code)  # lo deja sin hacer
    d = c.get(f"/weeks/{week}/days/{n}").json()
    print("start", n, c.post(f"/weeks/{week}/days/{n}/start").status_code)
    malas = 0
    for e in d["exercises"]:
        for s in e["sets"]:
            cuerpo = {}
            if s["duration_minutes"]:
                cuerpo["duration_minutes"] = s["duration_minutes"]
            elif s["duration_seconds"]:
                cuerpo["duration_seconds"] = s["duration_seconds"]
            else:
                cuerpo["reps"] = s["reps"] + (0 if s["target_weight_kg"] else 2)
                if s["target_weight_kg"]:
                    cuerpo["weight_kg"] = float(s["target_weight_kg"]) + 2.5
            r = c.put(f"/weeks/{week}/days/{n}/sets/{s['id']}", json=cuerpo)
            if r.status_code != 200:
                malas += 1
                print("serie", s["id"], r.status_code, r.text[:100])
    print("día", n, "series con error", malas, "complete", c.post(f"/weeks/{week}/days/{n}/complete").status_code)
