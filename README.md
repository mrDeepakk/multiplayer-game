# Multiplayer Tic-Tac-Toe (Nakama)

This repository contains a production-ready blueprint for a server-authoritative multiplayer Tic-Tac-Toe game using Nakama as the backend, with a React + Vite + Tailwind frontend.

Folders:

- `backend/nakama` — Docker compose, Nakama config and `tictactoe.ts` match handler.
- `frontend` — Vite React app with Tailwind CSS UI components and Nakama client hook.
- `docs` — architecture and API notes.

Quick start (local):

1. Start Nakama and dependencies:

```bash
cd backend/nakama
# Option A: use provided images (quick start)
docker compose up -d

# Option B: build a custom Nakama image that includes the `modules/` folder (recommended for TypeScript/JS modules):
docker build -t nakama-local:custom -f Dockerfile .
docker compose up -d
```

2. Start frontend (in a separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to view the frontend.

See `docs/` for architecture and API details.
