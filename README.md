# 🎮 Tic Tac Toe Arena (Multiplayer)

A real-time multiplayer Tic Tac Toe game built using **Nakama (server-authoritative backend)** and **React + Tailwind CSS frontend**.

Play with friends using a match ID or invite link, or compete in real-time with automatic gameplay validation and turn-based logic.

---

<table>
  <tr>
    <td><img src="https://i.ibb.co/j9xvx8pC/Screenshot-2026-04-10-132454.png" width="100%"/></td>
    <td><img src="https://i.ibb.co/LztKYbJq/Screenshot-2026-04-10-132508.png" width="100%"/></td>
  </tr>
  <tr>
    <td><img src="https://i.ibb.co/q32wGwH7/Screenshot-2026-04-10-133711.png" width="100%"></td>
    <td><img src="https://i.ibb.co/JFzCDVpN/Screenshot-2026-04-10-132851.png" width="100%"/></td>
  </tr>
</table>

## 🚀 Live Demo

🌐 **Frontend:** https://multiplayer-game01.netlify.app/

⚙️ **Backend (Nakama):** https://multiplayer-game-gzds.onrender.com

👉 Open the frontend link → Create or Join a match → Start playing instantly.

---

## ✨ Features

### 🎯 Core Gameplay

- Real-time multiplayer Tic Tac Toe
- Turn-based system (X vs O)
- Server-authoritative game logic (no cheating possible)
- Automatic win/draw detection

### 🔗 Match System

- Create match and share match ID
- Join match using ID
- Invite system with shareable link
- Seamless two-player synchronization

### ⏱ Timer Mode (Bonus)

- 30-second timer per turn
- Automatic loss on timeout
- Real-time countdown UI

### 🏆 Game Result & Score

- Winner / Loser / Draw detection
- Points system:
- Match leaderboard (player vs opponent)

### 🎨 UI/UX

- Modern responsive UI (Tailwind CSS)
- Smooth game interactions
- Winner modal with scoreboard
- Clean and intuitive layout

---

## 🧰 Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Nakama (Heroic Labs)
- **Realtime Communication:** WebSockets
- **Deployment:** Docker, Render / Vercel

---

## ⚙️ Prerequisites

Make sure you have installed:

- Node.js (v16+)
- npm / yarn
- Docker & Docker Desktop
- Git

---

## 🖥️ Run Locally

### 🔹 1. Clone Repository

```bash
git clone https://github.com/mrDeepakk/multiplayer-game.git
cd multiplayer-game
```

---

### 🔹 2. Start Backend (Nakama)

```bash
cd backend/nakama
docker-compose up --build
```

👉 This will start:

- Nakama server
- PostgreSQL
- Redis

---

### 🔹 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

### 🔹 4. Open App (Browser)

👉 Visit:

```
http://localhost:5173
```

## 🧠 How It Works

- Players connect using Nakama WebSocket
- Server manages:
  - Game state
  - Player turns
  - Move validation

- Backend broadcasts updates to both clients in real-time
- Frontend renders synchronized game state instantly

---

## 📌 Where to Access Live App

👉 Open the deployed frontend:

```
https://multiplayer-game01.netlify.app/
```

- Click **Create Match** → Share match ID
- Or **Join Match** using ID
- Play in real-time 🎮

---

## 🙌 Acknowledgements

- Nakama by Heroic Labs
- React & Tailwind CSS

---

⭐ If you like this project, consider giving it a star!
