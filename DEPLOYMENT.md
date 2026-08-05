# Deployment & Operations Guide

This guide is designed for reviewers running the application locally on a clean machine.

## Prerequisites
Ensure your local environment meets the following baseline requirements:
* **Docker:** Version 24.0 or higher.
* **Docker Compose:** Version 2.0 or higher.
* **Ports:** Ensure ports `80`, `3000`, and `5434` are available on your host machine.

## Quick Start (Local Grading)
The repository is configured to boot instantly using fallback environment variables. 

1. Clone the repository:
   `git clone https://github.com/Staggered95/propel-assignment.git`
2. Navigate into the directory:
   `cd propel-assignment`
3. Build and launch the stack in detached mode:
   `docker compose up -d --build`

## Environment Variables
The application uses the following variables. For local deployment, Docker will automatically fall back to the safe defaults listed below if a `.env` file is not present. A `.env.example` file is included in the repository.

* `DB_USER`: PostgreSQL username. Required. (Default: `kspdb_admin`)
* `DB_PASSWORD`: PostgreSQL password. Required. (Default: `kspdb@admin`)
* `DB_HOST`: Database host address. Required. (Default: `db`)
* `DB_PORT`: Database port. Required. (Default: `5432`)
* `DB_NAME`: Target database name. Required. (Default: `kspdb`)
* `GROQ_API_KEY`: API key for the AI Dispatch Brief generation. Optional for core localization features, required for the AI summary button. (Default: None)

## Verification
Wait approximately 10 seconds for the database to finish its seeding script, then open your browser:
* **URL:** `http://localhost:80` or simply `http://localhost`
* **Expected Output:** The KSPDB Operator Console will load, displaying a map populated with green grid assets and a completely empty Active Incident Queue.

---

## Troubleshooting Failure Modes

### Port 5432 Collision
**Symptom:** The `docker compose up` command fails, stating port `5432` is already in use.
**Fix:** If you are running a local instance of PostgreSQL (common on Arch Linux and Ubuntu), the default host port is occupied. Open `docker-compose.yml` and modify the `db` service ports mapping from `"5432:5432"` to `"5434:5432"`. 

### Nginx SSL Crash Loop
**Symptom:** The `frontend` container exits immediately with status `1`. The logs show: `cannot load certificate "/etc/letsencrypt/...": No such file or directory`.
**Fix:** You accidentally ran the production compose file. The local machine does not have Certbot SSL certificates. Run the stack using only the base file: `docker compose up -d --build` (do not append `-f docker-compose.prod.yml`).

### Empty Map / Missing API Data
**Symptom:** The frontend UI loads successfully, but the map is blank and the console throws a `Connection reset by peer` or CORS error.
**Fix:** The Vite development server might be running instead of Nginx, or the Nginx reverse proxy cannot reach the backend. Ensure you are accessing the site over `http://localhost:80` (not port 5173). Check the Nginx configuration to ensure the `/api/` block is proxying to `http://backend:3000/`.



---

## Resetting to a Clean State
To completely wipe the database, clear the cached topology, and start fresh:

1. Bring down the containers and destroy the attached database volumes:
   `docker compose down -v`
2. Rebuild the stack:
   `docker compose up -d --build`