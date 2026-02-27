# Setup Guide: Firebase Auth + Supabase (PostgreSQL)

This backend uses **Firebase Authentication** for identity and **Supabase
(PostgreSQL)** for data persistence. If your team later needs to migrate to AWS
RDS (MySQL), see [Switching to AWS RDS](#switching-to-aws-rds) at the bottom of
this guide.

## Architecture

- **Firebase Authentication** — Email/password and Google OAuth sign-in
- **Supabase** — Hosted PostgreSQL database (free tier available)
- **Raw SQL** — Parameterized queries via the `pg` package (connection pool)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

---

### 2. Set Up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create
   a new project.
2. Click on Project Overview -> "Add app" -> Web app (the </> icon) (name it
   something meaningful)
   - Leave "Firebase Hosting" unchecked for now, we will deal with that later
     when we deploy.
   - Click on "register app"
   - See `firebase-config.js` in `js-frontend` to see where to paste vars.
3. Follow copy/paste steps (paste relevant vars into frontend `.env`)
4. In the left sidebar, go to **Build (dropdown) -> Authentication -> "Get
   Started" -> Sign-in method** and enable:
   - **Email/Password (do not enable passwordless sign-in)**
   - **Google** (optional, for OAuth sign-in)
     - "Public-facing name for project": can be anything, just remember it
     - "Support email for project": Whoever is setting up Firebase
5. Generate a service account key:
   - Go to **Project Settings** (gear icon) → **Service Accounts**
   - Click **Generate New Private Key** (ensure Node is selected) and download
     the JSON file
   - You'll paste the contents of this file into your `.env` in the next step

---

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project** and fill in a name, database password, and region (no
   automatic RLS).
3. Once the project is ready, go to **Project Settings → Database**.
4. Click on **Connect** at top w/ plug icon, under **Connection string**, select
   the **URI** tab and copy the connection string. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
   You'll paste this into your `.env` as `DATABASE_URL`.
5. Create the `users` table:
   - In your Supabase project, go to the **SQL Editor** (left sidebar).
   - Paste the contents of `sql/create_tables.sql` and click **Run**.

---

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Paste the entire contents of your Firebase service account JSON (on one line)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'

# Supabase connection string (from Project Settings → Database → URI)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Server config
PORT=5050
FRONTEND_URL=https://your-production-url.com
FRONTEND_URL_DEV=http://localhost:5173
API_URL=http://localhost:5050
NODE_ENV=development
```

---

### 5. Start the Server

```bash
npm run dev
```

Server runs on `http://localhost:5050`.

---

## Database Schema

The default `users` table (`sql/create_tables.sql`):

```sql
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL UNIQUE,
  username     VARCHAR(50)  NOT NULL UNIQUE,
  email        VARCHAR(255) NOT NULL UNIQUE,
  firstname    VARCHAR(100) DEFAULT NULL,
  lastname     VARCHAR(100) DEFAULT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

Edit this schema to fit your project's data model.

---

## API Endpoints

### Sign Up

```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "firstname": "John",
  "lastname": "Doe"
}
```

**Process:** Creates the user in Firebase Auth, then stores their profile in the
database.

---

### Login

```
POST /auth/login
Content-Type: application/json

{
  "idToken": "firebase-id-token-from-frontend"
}
```

**Frontend example** (using Firebase SDK):

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken }),
});
```

---

### Google OAuth Token Sync

```
POST /auth/token
Content-Type: application/json

{
  "idToken": "firebase-id-token-from-google-oauth"
}
```

Called automatically by the frontend after Google sign-in to create or confirm
the user's database record.

**Frontend example**:

```javascript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const idToken = await result.user.getIdToken();

await fetch('/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken }),
});
```

---

### Get Current User

```
GET /auth/me
Authorization: Bearer <firebase-id-token>

# or

GET /auth/profile
Authorization: Bearer <firebase-id-token>
```

---

### Get All Users (Protected)

```
GET /auth/users
Authorization: Bearer <firebase-id-token>
```

---

### Logout

```
POST /auth/logout
```

---

## Project Structure

```
js-backend/
├── sql/
│   ├── create_tables.sql          # Supabase / PostgreSQL schema (default)
│   └── create_tables_mysql.sql    # AWS RDS / MySQL schema (for migration)
├── src/
│   ├── config/
│   │   ├── firebase.js            # Firebase Admin SDK initialization
│   │   └── database.js            # DB connection pool (Supabase default)
│   ├── controllers/
│   │   └── authController.js      # Auth endpoint logic
│   ├── middleware/
│   │   └── authMiddleware.js      # Firebase token verification
│   ├── providers/
│   │   ├── postgresProvider.js    # Supabase / PostgreSQL queries (default)
│   │   └── mysqlProvider.js       # AWS RDS / MySQL queries (for migration)
│   ├── repositories/
│   │   └── userRepository.js      # Adapter — swap providers here
│   ├── routes/
│   │   └── authRoutes.js          # Express route definitions
│   └── server.js                  # Express app + middleware setup
├── .env.example                   # Environment variable template
├── rds-config.ini.example         # AWS RDS config template (for migration)
└── package.json
```

---

## Switching to AWS RDS

When your team is ready to migrate from Supabase to AWS RDS (MySQL), make the
following changes:

### 1. Install the RDS config file

```bash
cp rds-config.ini.example rds-config.ini
```

Fill in your RDS credentials:

```ini
[rds]
endpoint    = your-rds-endpoint.region.rds.amazonaws.com
port_number = 3306
region_name = us-east-2
user_name   = your_username
user_pwd    = your_password
db_name     = your_database_name
```

### 2. Create the MySQL table

Run the MySQL schema against your RDS instance:

```bash
mysql -h <endpoint> -u <user> -p <dbname> < sql/create_tables_mysql.sql
```

Or paste the contents of `sql/create_tables_mysql.sql` into MySQL Workbench.

### 3. Switch the database connection — `src/config/database.js`

The file has two clearly marked sections. Keep the `dotenv` lines at the top
as-is, then comment out the Postgres block and uncomment the MySQL block:

```js
import dotenv from 'dotenv';
// keep this
import pg from 'pg';

// comment this out ↓

// ...

// === AWS RDS / MySQL ===
// import fs from 'fs';      // uncomment these ↓
// import ini from 'ini';
// import mysql2 from 'mysql2/promise';
// ...
// export { pool };
```

### 4. Switch the provider — `src/repositories/userRepository.js`

```js
// Comment out:
// import provider from '../providers/postgresProvider.js';
// Uncomment:
import provider from '../providers/mysqlProvider.js';
```

That's it. The repository, controllers, and routes are all provider-agnostic and
require no other changes.

---

## Troubleshooting

### Supabase connection refused

- Double-check that `DATABASE_URL` in `.env` matches the URI exactly from
  Supabase project settings.
- Make sure you replaced `[YOUR-PASSWORD]` with your actual database password.
- If the password contains special characters, URL-encode them (e.g., `@` →
  `%40`).

### AWS RDS connection refused

- Verify your RDS security group allows inbound traffic on port 3306 from your
  IP.
- Confirm the endpoint and credentials in `rds-config.ini` are correct.
- Make sure the RDS instance is running and publicly accessible (or you're on
  the same VPC).

### Duplicate entry errors

- A unique constraint was violated — email, username, or `firebase_uid` already
  exists in the database.
- PostgreSQL: check for `duplicate key value violates unique constraint`
- MySQL: check for `ER_DUP_ENTRY`

### Firebase errors

- `auth/email-already-exists` — Email is already registered in Firebase.
- Verify `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env` is valid JSON (the whole JSON
  on one line, wrapped in single quotes).

---

## Notes

- A connection pool is shared across all requests (configured for up to 10
  connections).
- All queries use parameterized placeholders to prevent SQL injection.
- Firebase handles authentication; the database stores user profile data.
- Sensitive config files (`.env`, `*.ini`) are gitignored — never commit them.
