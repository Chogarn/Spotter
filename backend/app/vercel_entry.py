"""Entrada del backend en Vercel (Services).

Vercel manda `/api/*` al backend SIN quitar el prefijo (docs: "Services routing": el servicio recibe
la ruta original). Las rutas de la app son `/auth/login`, `/weeks/...`, etc., sin prefijo; en vez de
cambiar cada una, se monta la app entera bajo `/api`. En desarrollo y con Docker no se usa: ahí
corre `app.main:app` directo.
"""

from fastapi import FastAPI

from app.main import app as api

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", api)
