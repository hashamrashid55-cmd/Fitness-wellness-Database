
# FitCore — Fitness Management System

A comprehensive Fitness & Wellness Database Management System designed to help users manage fitness activities, workout plans, wellness tracking, nutrition records, and user progress efficiently. This project demonstrates the implementation of database concepts in a real-world health and fitness application.

# 📌 Project Overview

The Fitness & Wellness Database project is developed to organize and manage information related to fitness and wellness services. The system allows users to maintain records of members, trainers, workout plans, diet plans, memberships, and health progress in a structured database environment.

The project focuses on:

Efficient database design
Data management and organization
CRUD operations (Create, Read, Update, Delete)
Relationship handling between multiple entities
Real-world fitness management workflows

This system can be used by:

Gyms and fitness centers
Personal trainers
Wellness clinics
Health tracking applications
Fitness management systems
# 🚀 Features
### 👤 User Management
Store and manage member information <br>
Register new users <br>
Update member profiles <br>
Track user fitness progress 
### 🏋️ Workout Management 
Create workout plans <br>
Assign workouts to users <br>
Track workout schedules <br>
Manage exercise details 
### 🥗 Nutrition & Wellness 
Maintain diet plans <br>
Store nutrition information <br>
Track wellness goals <br>
Monitor health-related activities 
### 👨‍🏫 Trainer Management
Manage trainer information <br>
Assign trainers to members <br>
Track trainer schedules <br>
### 💳 Membership Management
Store membership details <br>
Track membership duration <br>
Manage subscription records 
### 📊 Database Operations 
Insert, update, delete, and retrieve records <br>
Structured relational database design <br>
Entity relationships and normalization <br>
Efficient query handling
### 🛠️ Technologies Used

Depending on your implementation, this project include:

Database: MySQL / SQL <br>
Backend: Java / Python / Node.js / PHP <br>
Frontend: HTML, CSS, JavaScript <br>
Database Tools: MySQL Workbench <br>
Version Control: Git & GitHub 
##  🗂️ Database Entities

The database includes the following entities:

Members
Trainers
Workouts
Exercises
Diet Plans
Memberships
Progress Tracking
Wellness Records

These entities are connected using relational database concepts such as:

Primary Keys
Foreign Keys
One-to-Many Relationships
Many-to-Many Relationships
Normalization

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

