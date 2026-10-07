from fastapi import FastAPI

app = FastAPI(title="Spotter API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
