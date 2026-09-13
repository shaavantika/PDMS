# ProjectSync

Project delivery management system — track projects from requirement to delivery.

## Structure

- `backend/` — Flask REST API + PostgreSQL
- `frontend/` — React + Vite SPA

## Dev setup

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL / JWT_SECRET_KEY
createdb pdms_dev       # on this machine Postgres runs on port 5433 (5432 is taken by another install) — see .env

# Option A: apply the SQL schema directly (creates the "pdms" schema — all tables/types live there, not "public")
psql -d pdms_dev -f schema.sql

# Option B: use Flask-Migrate instead (equivalent — schema.sql is a dump of this same migration)
export FLASK_APP=wsgi.py
flask db upgrade
python seed.py          # creates an initial admin user
flask run --port 5050   # port 5000 is taken by macOS AirPlay Receiver on this machine
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs on http://localhost:5173 and proxies `/api` and `/auth` to the Flask API on :5050.

### Notes

- All app tables/enums live in the `pdms` Postgres schema (not `public`). SQLAlchemy is configured to use it automatically; if you connect manually with `psql`, either qualify names (`select * from pdms.users`) or run `SET search_path TO pdms;` first.
- `schema.sql` is for a **fresh** database — it already contains every column. If you have an **existing** database created before a given change, run `db_updates.sql` instead, which only contains the incremental `ALTER`/`UPDATE` statements needed to bring it up to date.
