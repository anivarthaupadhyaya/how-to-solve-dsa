PROJECT: <AppName>, a spaced-repetition study app. Users create subjects (DSA, OS, CN, DBMS...), add items (cards) to each subject, review due items on an SM-2 schedule, and see weak-tag analytics.

STACK
- Backend: FastAPI, SQLAlchemy 2.x, Alembic, MySQL 8 (PyMySQL driver), JWT auth (PyJWT + passlib bcrypt), slowapi, pytest.
- Frontend: React + Vite (JavaScript/JSX), Tailwind CSS, React Router, axios, Recharts, framer-motion, lucide-react, sonner (toasts).
- Local dev: Docker Compose for MySQL. All config via environment variables, never hardcoded.

SCHEMA 
- users(id, email, password_hash, created_at)
- subjects(id, user_id, name, color)
- items(id, subject_id, type['problem'|'qa'], title, prompt, answer, url, difficulty)
- tags(id, subject_id, name); item_tags(item_id, tag_id)
- user_items(id, user_id, item_id, ease_factor default 2.5, interval_days default 0, repetitions default 0, next_review_date, notes)
- review_logs(id, user_item_id, rating['forgot'|'shaky'|'easy'], time_taken_seconds, reviewed_at). Append-only.
Creating an item also creates its user_items row (next_review_date = today).

CONVENTIONS
- Backend layout: app/core, app/models, app/schemas, app/routers, app/services; tests in backend/tests.
- Type hints and short docstrings. Keep SM-2 logic pure and separate from the web layer.
- Conventional commit messages (feat, fix, test, docs, chore, style, build, ci).
- Every user-owned resource must check ownership.
