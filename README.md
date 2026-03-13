# Multiplayer Xiangqi (Co Tuong)

Production-ready full-stack Chinese Chess web app.

## Stack

- Frontend: React + TypeScript + TailwindCSS + Socket.IO Client
- Backend: Node.js + Express + Socket.IO + TypeScript
- Database: MongoDB (rooms snapshot + match history)
- Engine: Full Xiangqi server-side validation

## Features

- Multiplayer rooms (2 players + spectators)
- Quick match queue
- Create/join/leave room
- Real-time game sync
- Full move legality checks on server
- Check and checkmate detection
- Move history
- Rematch

## Run

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

App URLs (local dev):

- Client: `http://localhost:5173`
- Server: `http://localhost:4000`

## Run With Docker

From project root:

```bash
docker compose up --build
```

App URLs (Docker):

- Client: `http://localhost:5173`
- Server API: `http://localhost:4000/api/health`
- MongoDB: `mongodb://localhost:27017`

Stop containers:

```bash
docker compose down
```

Stop and remove DB volume:

```bash
docker compose down -v
```

## Socket Events

### Client -> Server

- `create_room`
- `join_room`
- `leave_room`
- `make_move`
- `request_rematch`
- `quick_match`
- `get_valid_moves`

### Server -> Client

- `room_created`
- `room_joined`
- `player_joined`
- `game_started`
- `move_made`
- `game_over`
- `player_left`
- `valid_moves`
- `queued`

## Project Structure

```text
/server
  /controllers
  /models
  /sockets
  /game-engine
  server.ts

/client
  /components
  /pages
  /hooks
  /services
  App.tsx
```
