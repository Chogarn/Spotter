import os, httpx
week = 145
c = httpx.Client(base_url="http://localhost:8000", timeout=30)
print("login", c.post("/auth/login", json={"email": os.environ["EMAIL"], "password": os.environ["CLAVE"], "remember": False}).status_code)
for n in (3, 4):
    d = c.get(f"/weeks/{week}/days/{n}").json()
    print("start", n, c.post(f"/weeks/{week}/days/{n}/start").status_code)
    malas = 0
    for e in d["exercises"]:
        for s in e["sets"]:
            r = c.post(f"/weeks/{week}/days/{n}/sets/{s['id']}/done")
            if r.status_code != 200:
                malas += 1
    print("día", n, "errores", malas, "complete", c.post(f"/weeks/{week}/days/{n}/complete").status_code)
