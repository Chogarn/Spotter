import os, httpx
c = httpx.Client(base_url="http://localhost:8000", timeout=30)
print("login", c.post("/auth/login", json={"email": os.environ["EMAIL"], "password": os.environ["CLAVE"], "remember": False}).status_code)
for f, p, g in [("2026-10-19", 84.2, 22.5), ("2026-10-26", 83.6, 22.1), ("2026-11-02", 83.1, 21.8), ("2026-11-09", 82.5, 21.4), ("2026-11-15", 82.0, 21.0)]:
    r = c.post("/measurements", json={"weight_kg": p, "body_fat_pct": g, "measured_on": f})
    print(f, r.status_code, r.text[:80])
print(c.get("/profile").json().get("height_cm"))
