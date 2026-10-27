# SmartChain – Supply Chain Management System

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen?logo=pytest)](https://docs.pytest.org/)

SmartChain is a full-stack, enterprise-grade college project implementing an integrated **Supply Chain Management (SCM) & Logistics Tracking System**. It is built using **100% free and open-source tools**.

---

## 🌟 Key Features

1. **Product & Inventory Management:** Full catalog CRUD, unique SKU generation, warehouse aisle/bin locations, stock adjustment logs, and price modeling.
2. **Supplier Management:** Track vendor contacts, lead times (in days), and delivery quality ratings (1.0 to 5.0 stars).
3. **Customer Order Fulfillment:** Multi-item order placement with real-time stock verification, atomic inventory decrementing, and automatic restoration upon cancellation.
4. **Live Shipment Tracking:** Unique tracking number generation (`TRK-SC-XXXXXX`), carrier assignment (BlueDart, FedEx, DHL), public tracking lookup, and waypoint status updates.
5. **Automated Low-Stock Alerts:** Safety threshold engine detecting SKUs where `quantity_in_stock <= reorder_threshold` with suggested replenishment calculations and one-click rapid restocking.
6. **Executive Analytics Dashboard:** Real-time KPI tiles (Total Products, Inventory Valuation, Active Orders, Revenue, Alerts, Shipments), category inventory distributions, and recent activity feeds.

---

## 🏗️ System Architecture

```
[ Client Browser ]
        │  (HTTP / JSON REST API)
        ▼
[ React 18 SPA (Vite) ]  ─── Port 3000
        │
        ▼
[ FastAPI Backend ]  ─────── Port 8000
   ├── Pydantic v2 (Input Validation)
   ├── Routers (/products, /suppliers, /orders, /shipments, /dashboard)
   └── SQLAlchemy 2.0 (ORM)
        │
        ├── Primary: [ MySQL 8.4 ] ───────── Port 3306 (Docker / Local)
        └── Fallback: [ SQLite ] ────────── (Auto-enabled when MySQL offline)
```

---

## 📁 Project Structure

```
smartchain/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── config.py         # App settings & auto-fallback logic
│   │   ├── database.py       # SQLAlchemy engine & session maker
│   │   ├── models.py         # Database ORM models
│   │   ├── schemas.py        # Pydantic v2 validation models
│   │   ├── crud.py           # Business logic & queries
│   │   ├── seed_data.py      # Sample data population
│   │   └── routers/          # Modular API routers
│   ├── tests/
│   │   └── test_api.py       # Pytest automated test suite (10 tests)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container definition
├── frontend/                 # React 18 Single Page App
│   ├── src/
│   │   ├── components/       # Reusable UI (Sidebar, Navbar, Modal, etc.)
│   │   ├── pages/            # Feature views (Dashboard, Products, etc.)
│   │   ├── services/api.js   # API client service
│   │   ├── App.jsx           # Root component
│   │   └── index.css         # Modern responsive CSS design system
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile            # Multi-stage Nginx build
├── database/
│   └── init.sql              # MySQL DDL schema and seed data
├── Jenkinsfile               # Windows Jenkins pipeline
├── .env.example              # Safe local Compose configuration template
├── .gitignore                # Excludes local secrets and generated files
├── docs/                     # College Documentation Package
│   ├── SYNOPSIS.md           # Project synopsis document
│   ├── ARCHITECTURE_AND_ER.md# Mermaid diagrams & Data dictionary
│   ├── JIRA_MANAGEMENT.md    # Epics, user stories, sprints & workflow
│   ├── TEST_CASES.md         # Comprehensive test matrix (100% pass)
│   ├── PROJECT_REPORT_OUTLINE.md # 7-chapter university report blueprint
│   └── VIVA_QUESTIONS.md     # 35 in-depth Viva Voce Q&A guide
├── compose.yaml              # Docker Compose orchestration
└── README.md
```

---

## 🚀 Quick Start Instructions

You can run SmartChain using either **Docker Compose** (recommended for production) or **Locally** (ideal for quick code inspection or examiner laptops).

### Run the Application on Windows with Docker Compose

Install and start [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/). In PowerShell, from the project directory:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
docker compose config --quiet
docker compose up --build --detach
docker compose ps
```

In `.env`, replace both example password placeholders with distinct, private passwords. Keep `.env` local; Git ignores it. The app uses MySQL 8.4 in a persistent named volume, FastAPI on port `8000`, and the React UI on port `3000`.

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **FastAPI API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend health:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

To stop the application without removing its database volume, run `docker compose down` (never add `-v` if you want to keep database data). If another application already uses a port, change the corresponding `SMARTCHAIN_*_PORT` value in `.env`. The Jenkins job defaults to ports `13000` (UI), `18000` (API), and `13306` (MySQL), so it can be demonstrated alongside the local app.

### Jenkins Pipeline on Windows

Jenkins should run directly on Windows so its job can use the same Docker Desktop engine that runs the app. This repository's `Jenkinsfile` verifies the Docker daemon, validates Compose, builds both app images, runs the backend tests against isolated SQLite, deploys only after the tests pass, and checks that the deployed API is healthy and actually using MySQL.

1. Start Docker Desktop. Install it from the official [Docker Desktop for Windows instructions](https://docs.docker.com/desktop/setup/install/windows-install/) if needed. Confirm `docker version` and `docker compose version` work in PowerShell.
2. Open Jenkins at [http://localhost:8080](http://localhost:8080) and sign in as an administrator. The initial setup password is stored locally in the Jenkins home directory; do not share it in chat or commit it.
3. Check that the **Pipeline**, **Git**, and **Credentials Binding** plugins are installed.
4. In **Manage Jenkins → Credentials**, add two **Secret text** credentials. Use the IDs `smartchain-mysql-root-password` and `smartchain-mysql-password`. Use the same values as the local `.env` passwords; MySQL does not change existing database-user passwords just because environment variables change.
5. After connecting the repository to GitHub, create a **Pipeline** job using **Pipeline script from SCM**. Set the repository URL, branch (`*/main`), and script path (`Jenkinsfile`). Store private-repository credentials in Jenkins, not in the repository or URL.
6. Run the job with the default ports. The `SIMULATE_TEST_FAILURE` parameter safely demonstrates a failed test; leave it unchecked for a normal build. The deployed CI app is at [http://localhost:13000](http://localhost:13000), its API docs at [http://localhost:18000/docs](http://localhost:18000/docs), and its health endpoint at [http://localhost:18000/api/health](http://localhost:18000/api/health).

The pipeline uses Windows `bat` steps and the Docker Desktop daemon; it is not intended for the old Jenkins-in-Docker/Docker-in-Docker profile. The pipeline's `docker info` check reports whether the Jenkins Windows service can reach Docker Desktop. If it cannot, Jenkins needs to run under a Windows account that has permission to use Docker Desktop; this may require an administrator. Do not change the service account or expose Docker/Jenkins ports without authorization.

Jenkins running on `localhost` cannot receive GitHub webhooks from the public internet. Use the Jenkins **Poll SCM** trigger (the pipeline checks periodically) or build manually. Do not expose Jenkins publicly or create a tunnel for this demo.

The project is prepared for Git locally, but is not connected to or published on GitHub. Create or choose a repository you are allowed to use, then configure its URL and any required private-repository credentials in Jenkins.

### Run Locally without Docker (Development / Fallback)

The backend can fall back to a local SQLite database when MySQL is unavailable. Use one terminal for the backend and another for the frontend:

```powershell
Set-Location backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev
```

The app is then available at [http://localhost:3000](http://localhost:3000). A Docker deployment uses the MySQL database instead.

---

## 🧪 Running Automated Tests

Run the backend tests with a temporary in-memory SQLite connection so the test run does not change the development database:

```powershell
Set-Location backend
$env:DATABASE_URL = "sqlite://"
python -m pytest tests/ -v
```

The Jenkins pipeline runs the tests inside the backend image against a separate SQLite database. Its optional failure demonstration is skipped during normal runs.

---

## 📊 College Project Deliverables Included

| Deliverable | Location | Description |
|---|---|---|
| **Project Synopsis** | [`docs/SYNOPSIS.md`](./docs/SYNOPSIS.md) | Problem statement, objectives, tech stack, and scope |
| **Architecture & ER** | [`docs/ARCHITECTURE_AND_ER.md`](./docs/ARCHITECTURE_AND_ER.md) | Mermaid Architecture, DFD Level 0/1, ER Diagram & Data Dictionary |
| **Jira Management** | [`docs/JIRA_MANAGEMENT.md`](./docs/JIRA_MANAGEMENT.md) | 7 Epics, User Stories with Story Points, Sprints 1–4, and DoD |
| **Test Cases** | [`docs/TEST_CASES.md`](./docs/TEST_CASES.md) | Detailed test cases and automated test execution results |
| **Project Report** | [`docs/PROJECT_REPORT_OUTLINE.md`](./docs/PROJECT_REPORT_OUTLINE.md) | AICTE / IEEE standard 7-chapter college report blueprint |
| **Viva Voce Prep** | [`docs/VIVA_QUESTIONS.md`](./docs/VIVA_QUESTIONS.md) | 35 comprehensive viva questions & answers |
| **DevOps Viva Prep** | [`docs/DEVOPS_VIVA_GUIDE.md`](./docs/DEVOPS_VIVA_GUIDE.md) | CI/CD demo checklist, Windows setup, and Jenkins/Docker viva Q&A |

---

## 📄 License
This project is licensed under the **MIT License** — free to use, modify, and distribute for educational purposes.
