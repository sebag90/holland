# Holland - Vacation home management
# Development justfile

set dotenv-load := true

NETWORK := "holland-net"
DB_NAME := "holland-db"
BACKEND_NAME := "holland-backend"
FRONTEND_NAME := "holland-frontend"

POSTGRES_USER := env_var_or_default("POSTGRES_USER", "holland")
POSTGRES_PASSWORD := env_var_or_default("POSTGRES_PASSWORD", "holland")
POSTGRES_DB := env_var_or_default("POSTGRES_DB", "holland")
JWT_SECRET := env_var_or_default("JWT_SECRET", "dev-secret-change-me")
HTPASSWD_FILE := env_var_or_default("HTPASSWD_FILE", justfile_directory() + "/backend/htpasswd")

default:
    @just --list

_network:
    @podman network exists {{NETWORK}} || podman network create {{NETWORK}}

_htpasswd:
    @if [ ! -f "{{HTPASSWD_FILE}}" ]; then \
        echo "No htpasswd at {{HTPASSWD_FILE}} - copying example."; \
        cp backend/htpasswd.example {{HTPASSWD_FILE}}; \
    fi

# Add or update a user in the htpasswd file (uses podman httpd image, no host htpasswd needed)
htpasswd-add user:
    @touch {{HTPASSWD_FILE}}
    podman run --rm -i -v {{HTPASSWD_FILE}}:/htpasswd:Z \
        docker.io/httpd:2.4-alpine htpasswd -B /htpasswd {{user}}
    @echo "Updated {{HTPASSWD_FILE}}"

# Deploy a postgres instance
db: _network
    -podman rm -f {{DB_NAME}}
    podman volume exists holland-pgdata || podman volume create holland-pgdata
    podman run -d --name {{DB_NAME}} \
        --network {{NETWORK}} \
        -e POSTGRES_USER={{POSTGRES_USER}} \
        -e POSTGRES_PASSWORD={{POSTGRES_PASSWORD}} \
        -e POSTGRES_DB={{POSTGRES_DB}} \
        -p 5432:5432 \
        -v holland-pgdata:/var/lib/postgresql/data \
        docker.io/library/postgres:16
    @echo "Waiting for postgres..."
    @sleep 3

# Build and deploy the backend container
backend: _network _htpasswd
    podman build -t holland-backend:dev ./backend
    -podman rm -f {{BACKEND_NAME}}
    podman volume exists holland-uploads || podman volume create holland-uploads
    podman run -d --name {{BACKEND_NAME}} \
        --network {{NETWORK}} \
        -e DATABASE_URL=postgresql+psycopg://{{POSTGRES_USER}}:{{POSTGRES_PASSWORD}}@{{DB_NAME}}:5432/{{POSTGRES_DB}} \
        -e JWT_SECRET={{JWT_SECRET}} \
        -e UPLOAD_DIR=/data/uploads \
        -e HTPASSWD_FILE=/etc/holland/htpasswd \
        -p 8000:8000 \
        -v holland-uploads:/data/uploads \
        -v {{HTPASSWD_FILE}}:/etc/holland/htpasswd:ro,Z \
        holland-backend:dev

# Build and deploy the frontend container
frontend: _network
    podman build -t holland-frontend:dev ./frontend
    -podman rm -f {{FRONTEND_NAME}}
    podman run -d --name {{FRONTEND_NAME}} \
        --network {{NETWORK}} \
        -p 8080:80 \
        holland-frontend:dev

logs name:
    podman logs -f {{name}}

# Drop the postgres volume (schema changed in revision 1 - wipe to recreate)
reset-db:
    -podman rm -f {{DB_NAME}}
    -podman volume rm holland-pgdata

# Stop everything
down:
    -podman rm -f {{FRONTEND_NAME}} {{BACKEND_NAME}} {{DB_NAME}}
