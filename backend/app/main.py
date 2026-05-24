from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import Base, engine
from .routers import auth, bookings, threads, files, todos

app = FastAPI(title="Holland - Vacation Home")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Lightweight in-place migrations (avoid wiping the DB for additive changes)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE todos ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''"))


app.include_router(auth.router)
app.include_router(bookings.router)
app.include_router(threads.router)
app.include_router(files.router)
app.include_router(todos.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
