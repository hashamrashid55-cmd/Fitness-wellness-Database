<<<<<<< HEAD
# FitCore — Fitness Management System

## Project Structure
```
database_updated/
├── schema_mysql.sql          ← Run this in MySQL Workbench first
├── server/                   ← Node.js + Express API (port 5000)
│   ├── .env                  ← ⚠️ Edit DB credentials here
│   ├── index.js
│   ├── db.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       └── api.js
└── frontend/                 ← React + Vite app (port 5173)
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── AdminDashboard.jsx
        │   ├── TrainerDashboard.jsx
        │   └── MemberDashboard.jsx
        └── components/
            ├── Navbar.jsx
            ├── StatCard.jsx
            └── DataTable.jsx
```

## Setup Steps

### Step 1 — MySQL Database
1. Open **MySQL Workbench**
2. Open `schema_mysql.sql`
3. Run the entire script (Ctrl+Shift+Enter)
4. Verify the `fitness_db` database and all tables are created

### Step 2 — Backend (.env)
Edit `server/.env` and set your MySQL password:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_PASSWORD
DB_NAME=fitness_db
JWT_SECRET=fitness_super_secret_jwt_key_2024
PORT=5000
```

### Step 3 — Start Backend
```powershell
cd server
npm start
# Server runs on http://localhost:5000
```

### Step 4 — Start Frontend
```powershell
cd frontend
npm run dev
# App runs on http://localhost:5173
```

## Demo Accounts
All accounts use password: **password**

| Role    | Email                    |
|---------|--------------------------|
| Admin   | admin@fitcore.com        |
| Trainer | usman.ahmed@email.com    |
| Trainer | aisha.malik@email.com    |
| Member  | ali.raza@email.com       |
| Member  | sara.khan@email.com      |

## Features
- 🔐 JWT-based login with role detection
- 🛡️ **Admin**: Stats overview, revenue chart, manage members/trainers/subscriptions/devices
- 🏋️ **Trainer**: Profile, create sessions, view workout & nutrition plans, member health overview
- 🧑 **Member**: Profile, log health metrics, view trend chart, subscriptions, devices, trainers
=======
# Database_Project_fitness-wellness
>>>>>>> c5757119e86bf322b55feed925f18a20816166d1
