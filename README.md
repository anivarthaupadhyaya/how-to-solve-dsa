# 📚 How To Solve

[![CI](https://github.com/anivarthaupadhyaya/how-to-solve-dsa/actions/workflows/ci.yml/badge.svg)](https://github.com/anivarthaupadhyaya/how-to-solve-dsa/actions/workflows/ci.yml)

A **spaced-repetition study app** for technical interview prep — DSA, OS, Computer Networks, and DBMS. Built with the **SM-2 algorithm** to schedule reviews at optimal intervals, so you remember more and study less.

---

## ✨ Features

- **Subjects** — Organize study material by topic with custom colours. 
- **Items** — Two types: **Q&A flashcards** (question + answer) and **coding problems** (title, URL, difficulty).
- **Tags** — Label items (e.g. "linked-list", "medium") and filter by tag.
- **SM-2 Spaced Repetition** — Rate each review as _Forgot_, _Shaky_, or _Easy_; the algorithm adjusts the next review date and ease factor automatically.
- **Review Session** — Polished card-flip UI with a running timer, keyboard shortcuts (Space / 1-2-3), and a celebratory finish state.
- **Analytics** — Weakest-tags chart, daily activity heatmap, streak counter, and retention rate.
- **CSV Import** — Bulk-import items from a CSV file with error reporting per row.
- **Auth** — JWT-based registration and login with rate limiting.
- **Dark / Light Theme** — Follows system preference, toggleable, persisted in localStorage.

---

## 🏗️ Architecture

```mermaid
graph LR
    subgraph Frontend
        A[React + Vite SPA]
    end

    subgraph Backend
        B[FastAPI]
        C[SM-2 Scheduler]
    end

    subgraph Database
        D[(MySQL 8)]
    end

    A -- REST / JSON --> B
    B --> C
    B -- SQLAlchemy --> D
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Axios |
| Backend    | FastAPI, SQLAlchemy 2, Alembic, PyJWT, SlowAPI                |
| Database   | MySQL 8.0                                                     |
| Infra      | Docker, Docker Compose, Nginx, GitHub Actions CI              |
| Deployment | Vercel (frontend), Render / Railway (backend)                 |

---

## 🚀 Local Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose **or** Python 3.11+ and Node.js 20+.
- A MySQL 8 instance (Docker Compose provides one).

### Option A: Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/anivarthaupadhyaya/how-to-solve-dsa.git
cd how-to-solve-dsa

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env with your values (see table below)

# 3. Start everything
docker compose up --build
```

The app is available at **http://localhost:3000** and the API at **http://localhost:8000**.

### Option B: Manual

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Seed Data

Populate the database with demo subjects and items:

```bash
cd backend
python scripts/seed.py
```

This creates a demo user (`demo@example.com` / `password123`) with sample OS, CN, and DSA decks. Safe to run multiple times.

---

## 🔑 Environment Variables

| Variable              | Description                             | Example                                                    |
| --------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`        | SQLAlchemy connection string            | `mysql+pymysql://user:pass@localhost:3306/how_to_solve`    |
| `JWT_SECRET`          | Secret key for signing JWT tokens       | `super-secret-key-change-me`                               |
| `CORS_ORIGINS`        | Comma-separated allowed origins         | `http://localhost:3000,http://localhost:5173`               |
| `VITE_API_URL`        | Backend URL for the frontend            | `http://localhost:8000`                                     |
| `MYSQL_ROOT_PASSWORD` | MySQL root password (Docker Compose)    | `rootpass`                                                  |
| `MYSQL_DATABASE`      | MySQL database name (Docker Compose)    | `how_to_solve`                                              |
| `MYSQL_USER`          | MySQL user (Docker Compose)             | `appuser`                                                   |
| `MYSQL_PASSWORD`      | MySQL password (Docker Compose)         | `apppass`                                                    |

---

## 📡 API Overview

All endpoints (except auth) require a `Bearer` token in the `Authorization` header.

| Group        | Endpoints                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| **Auth**     | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                |
| **Subjects** | `GET /subjects`, `POST /subjects`, `PUT /subjects/{id}`, `DELETE /subjects/{id}` |
| **Items**    | `GET /items`, `POST /items`, `GET /items/{id}`, `PUT /items/{id}`, `DELETE /items/{id}`, `POST /items/import` |
| **Tags**     | `GET /subjects/{id}/tags`, `POST /subjects/{id}/tags`, `POST /items/{id}/tags/{tag_id}`, `DELETE /items/{id}/tags/{tag_id}` |
| **Reviews**  | `GET /reviews/today`, `POST /reviews/{user_item_id}`                      |
| **Analytics**| `GET /analytics/tags`, `GET /analytics/activity`, `GET /analytics/summary`|
| **Health**   | `GET /health`                                                             |

Interactive docs available at `/docs` (Swagger UI) and `/redoc`.

---

## 📁 Project Structure

```
how-to-solve-dsa/
├── backend/
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── core/              # Config, DB, deps, security, rate limiter
│   │   ├── models/            # SQLAlchemy models (User, Subject, Item, Tag, Review)
│   │   ├── routers/           # API route handlers
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # SM-2 scheduling algorithm
│   │   └── main.py            # FastAPI application entry point
│   ├── scripts/
│   │   └── seed.py            # Demo data seeder
│   ├── tests/                 # Pytest test suite (49 tests)
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client
│   │   ├── components/
│   │   │   ├── layout/        # AppLayout, Sidebar, TopBar
│   │   │   └── ui/            # Button, Card, Input, Modal, Badge, etc.
│   │   ├── context/           # Auth, Theme, Subjects providers
│   │   └── pages/             # Dashboard, Review, Items, Subjects, Login, Register
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vercel.json
│   └── package.json
├── .github/workflows/ci.yml   # GitHub Actions CI
├── docs/
│   └── DEPLOYMENT.md          # Production deployment guide
├── docker-compose.yml          # Full-stack local development
├── CONTEXT.md                  # Project brief
└── README.md
```

---

## 📸 Screenshots

> _Screenshots coming soon — run the app locally or check the deployment to see it in action!_

| Screen | Description |
| ------ | ----------- |
| Dashboard | Stat cards, weakest-tags chart, activity heatmap, streak counter |
| Review Session | Card-flip animation, timer, rating buttons, progress bar |
| Items | Filterable list with tag chips, difficulty badges, add/edit modal |
| Subjects | Colour-coded cards with item and due counts |

---

## 📄 License

This project is for educational and personal use.
