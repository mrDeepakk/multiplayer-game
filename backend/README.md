# Backend (Nakama)

This folder contains the Nakama server config and a TypeScript match handler implementing server-authoritative Tic-Tac-Toe logic.

Start locally:

```bash
cd backend/nakama
docker compose up
```

The Nakama HTTP API will be available at `http://localhost:7350` and socket at `ws://localhost:7351`.

Place the `tictactoe.ts` module under `modules/` and mount in Nakama runtime if customizing the Docker image.
