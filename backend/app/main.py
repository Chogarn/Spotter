import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import profile, proposals, routines, weeks

app = FastAPI(title="Spotter API")

# El navegador (frontend en otro puerto) llama directo a la API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3001").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(proposals.router)
app.include_router(routines.router)
app.include_router(weeks.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
