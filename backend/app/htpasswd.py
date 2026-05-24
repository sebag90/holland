"""Minimal htpasswd reader supporting bcrypt entries (htpasswd -B)."""
from pathlib import Path
import bcrypt
from .config import settings


def _load() -> dict[str, str]:
    path = Path(settings.htpasswd_file)
    if not path.exists():
        return {}
    out: dict[str, str] = {}
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        user, _, hashed = line.partition(":")
        out[user.strip()] = hashed.strip()
    return out


def list_usernames() -> list[str]:
    return sorted(_load().keys())


def verify(username: str, password: str) -> bool:
    entries = _load()
    hashed = entries.get(username)
    if not hashed:
        return False
    # Apache writes bcrypt with $2y$; bcrypt module accepts $2a$/$2b$.
    if hashed.startswith("$2y$"):
        hashed = "$2b$" + hashed[4:]
    if not hashed.startswith(("$2a$", "$2b$")):
        # Unsupported hash format — require bcrypt (htpasswd -B).
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except ValueError:
        return False
