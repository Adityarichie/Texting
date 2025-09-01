Temp Chat App (No Database)
==========================

What this is
------------
A simple temporary chat app where messages live in server memory only (no persistent DB).
When the server restarts or you refresh/leave, messages are gone.

How to run locally
------------------
1. Backend:
   cd backend
   npm install
   npm start
   (Server runs on port 3001 by default)

2. Frontend:
   cd frontend
   npm install
   npm run dev
   (Vite dev server runs on port 5173 by default)

Config
------
If backend isn't on localhost:3001, set VITE_SERVER_URL in frontend .env:
VITE_SERVER_URL=http://your-server:3001

Notes
-----
- This is intentionally simple so you can extend features.
- No message persistence, no auth (just nicknames).
