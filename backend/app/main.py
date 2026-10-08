import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import profile

app = FastAPI(title="Spotter API")

# El navegador (frontend en otro puerto) llama directo a la API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3001").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
