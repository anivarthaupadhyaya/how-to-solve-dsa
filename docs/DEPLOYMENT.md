# Deployment Guide

This guide covers deploying **How To Solve** to production with:

- **Frontend** → Vercel
- **Backend** → Render or Railway
- **Database** → Hosted MySQL (PlanetScale, Railway, or AWS RDS)

---

## 1. Database — Hosted MySQL

You need a MySQL 8-compatible database. Choose one:

| Provider     | Free Tier | Notes                          |
| ------------ | --------- | ------------------------------ |
| Railway      | \$5 trial | One-click MySQL, easy setup    |
| PlanetScale  | Hobby     | Serverless MySQL, branch model |
| AWS RDS      | 12 months | Full control, more config      |

After provisioning, note the connection string:

```
mysql+pymysql://<user>:<password>@<host>:<port>/<database>
```

---

## 2. Backend — Render or Railway

### Option A: Render

1. Go to [render.com](https://render.com) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Root Directory**: `backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
4. Set environment variables:

   | Variable       | Value                                         |
   | -------------- | --------------------------------------------- |
   | `DATABASE_URL` | Your hosted MySQL connection string            |
   | `JWT_SECRET`   | A strong random string (32+ characters)        |
   | `CORS_ORIGINS` | Your frontend URL (e.g. `https://your-app.vercel.app`) |
   | `PORT`         | `8000` (Render sets this automatically)        |

5. Deploy. The entrypoint script will run `alembic upgrade head` automatically on startup.

### Option B: Railway

1. Go to [railway.app](https://railway.app) and create a new project.
2. Add a service from your GitHub repo.
3. Configure:
   - **Root Directory**: `backend`
   - **Builder**: Dockerfile
4. Set the same environment variables as above.
5. Railway auto-assigns a `PORT`; the entrypoint script respects the `PORT` variable.

### Run Migrations

Migrations run automatically on each deploy via `entrypoint.sh`. To run manually:

```bash
# SSH or Railway shell
cd /app && alembic upgrade head
```

### Seed Demo Data

After the first deploy, run the seed script to populate sample data:

```bash
# In the Render shell or Railway shell
cd /app && python scripts/seed.py
```

This creates:
- Demo user: `demo@example.com` / `password123`
- Sample subjects: Operating Systems, Computer Networks, DSA
- ~38 items with tags

---

## 3. Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository.
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
3. Set environment variables:

   | Variable       | Value                                           |
   | -------------- | ----------------------------------------------- |
   | `VITE_API_URL` | Your backend URL (e.g. `https://your-api.onrender.com`) |

4. Deploy. Vercel will build the SPA and serve it with the rewrites defined in `vercel.json`.

> **Note**: `VITE_API_URL` is baked into the frontend at build time. If you change your backend URL, you need to redeploy the frontend.

---

## 4. Post-Deployment Checklist

- [ ] Verify the backend health endpoint: `GET https://your-api.com/health`
- [ ] Verify Swagger docs load: `https://your-api.com/docs`
- [ ] Register a new user on the frontend
- [ ] Run a review session to confirm SM-2 scheduling works
- [ ] Check CORS: the frontend should be able to reach the API without errors
- [ ] Run the seed script if you want demo data

---

## 5. Environment Variables Reference

| Variable              | Where           | Required | Description                                  |
| --------------------- | --------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`        | Backend         | ✅       | SQLAlchemy MySQL connection string            |
| `JWT_SECRET`          | Backend         | ✅       | Secret for signing JWT tokens                 |
| `CORS_ORIGINS`        | Backend         | ✅       | Comma-separated allowed frontend origins      |
| `PORT`                | Backend         | ❌       | Server port (default 8000)                    |
| `VITE_API_URL`        | Frontend (build)| ✅       | Backend API base URL                          |

---

## 6. Troubleshooting

### CORS errors

Make sure `CORS_ORIGINS` on the backend includes your exact frontend URL (with `https://`, no trailing slash).

### Database connection refused

- Ensure the database allows connections from your backend's IP.
- Check that the `DATABASE_URL` uses the correct host, port, username, and password.
- For Railway/Render, use the internal or private networking URL if both services are on the same platform.

### Migrations fail

- Check that the database exists and the user has DDL privileges.
- Run `alembic upgrade head` manually to see detailed error output.

### Frontend shows blank page

- Check browser console for errors.
- Verify `VITE_API_URL` was set correctly at build time.
- Ensure the Vercel rewrites in `vercel.json` are active (SPA routing).
