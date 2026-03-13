import { Server, Socket } from 'socket.io';
import {
  applyMove,
  createInitialBoard,
  getPieceColor,
} from '../game-engine/board.js';
import { isCheckmate } from '../game-engine/checkDetection.js';
import { getValidMoves, isValidMove } from '../game-engine/moveValidator.js';
import { MatchHistoryModel } from '../models/MatchHistory.js';
import {
  createRoom,
  enqueuePlayer,
  getAllRooms,
  getRoom,
  removeSocketFromQueue,
  serializeRoom,
  updateRoom,
} from '../roomStore.js';
import { Move, PlayerColor } from '../types.js';

function sanitizeUsername(username?: string): string | null {
  const trimmed = username?.trim();
  if (!trimmed || trimmed.length < 2) return null;
  return trimmed.slice(0, 20);
}

/** Assigns the connecting socket to a room role with spectator fallback. */
function assignPlayerRole(
  roomId: string,
  socket: Socket,
  username: string,
): 'red' | 'black' | 'spectator' | null {
  const room = getRoom(roomId);
  if (!room) return null;

  room.playerNames[socket.id] = username;

  if (!room.redPlayer) {
    room.redPlayer = socket.id;
    return 'red';
  }

  if (!room.blackPlayer && room.redPlayer !== socket.id) {
    room.blackPlayer = socket.id;
    room.status = 'playing';
    return 'black';
  }

  if (!room.spectators.includes(socket.id)) {
    room.spectators.push(socket.id);
  }

  return 'spectator';
}

/** Locates the room currently containing this socket as player or spectator. */
function findPlayerRoom(socketId: string): string | null {
  for (const room of getAllRooms()) {
    if (
      room.redPlayer === socketId ||
      room.blackPlayer === socketId ||
      room.spectators.includes(socketId)
    ) {
      return room.id;
    }
  }
  return null;
}

/** Registers all multiplayer room/game events for Xiangqi gameplay. */
export function registerGameSocket(io: Server): void {
  io.on('connection', (socket) => {
    socket.on('create_room', async (payload?: { username?: string }) => {
      const username = sanitizeUsername(payload?.username);
      if (!username) {
        socket.emit('error_message', {
          message: 'Username must be at least 2 characters',
        });
        return;
      }

      const room = await createRoom(socket.id, username);
      socket.join(room.id);

      socket.emit('room_created', {
        roomId: room.id,
        inviteLink: `/join/${room.id}`,
        room: serializeRoom(room),
      });
    });

    socket.on('quick_match', async (payload?: { username?: string }) => {
      const username = sanitizeUsername(payload?.username);
      if (!username) {
        socket.emit('error_message', {
          message: 'Username must be at least 2 characters',
        });
        return;
      }

      const matched = enqueuePlayer(socket.id, username);
      if (!matched) {
        socket.emit('queued', { message: 'Waiting for opponent...' });
        return;
      }

      const room = await createRoom(matched.socketId, matched.username);
      room.blackPlayer = socket.id;
      room.playerNames[socket.id] = username;
      room.status = 'playing';
      await updateRoom(room);

      io.sockets.sockets.get(matched.socketId)?.join(room.id);
      socket.join(room.id);

      io.to(room.id).emit('game_started', {
        room: serializeRoom(room),
      });
    });

    socket.on(
      'join_room',
      async (payload: { roomId: string; username?: string }) => {
        const username = sanitizeUsername(payload?.username);
        if (!username) {
          socket.emit('error_message', {
            message: 'Username must be at least 2 characters',
          });
          return;
        }

        const room = getRoom(payload.roomId);
        if (!room) {
          socket.emit('error_message', { message: 'Room not found' });
          return;
        }

        const role = assignPlayerRole(room.id, socket, username);
        if (!role) {
          socket.emit('error_message', { message: 'Unable to join room' });
          return;
        }

        socket.join(room.id);
        await updateRoom(room);

        socket.emit('room_joined', {
          room: serializeRoom(room),
          role,
        });

        socket.to(room.id).emit('player_joined', {
          socketId: socket.id,
          role,
          username,
        });

        if (room.redPlayer && room.blackPlayer && room.status === 'playing') {
          io.to(room.id).emit('game_started', {
            room: serializeRoom(room),
          });
        }
      },
    );

    socket.on('leave_room', async (payload: { roomId: string }) => {
      const room = getRoom(payload.roomId);
      if (!room) return;

      if (room.redPlayer === socket.id) room.redPlayer = null;
      if (room.blackPlayer === socket.id) room.blackPlayer = null;
      room.spectators = room.spectators.filter((id) => id !== socket.id);
      delete room.playerNames[socket.id];

      if (!room.redPlayer || !room.blackPlayer) {
        room.status = room.status === 'finished' ? 'finished' : 'waiting';
      }

      await updateRoom(room);
      socket.leave(room.id);

      io.to(room.id).emit('player_left', {
        socketId: socket.id,
        room: serializeRoom(room),
      });
    });

    socket.on('make_move', async (payload: { roomId: string; move: Move }) => {
      const room = getRoom(payload.roomId);
      if (!room || room.status !== 'playing') {
        socket.emit('error_message', {
          message: 'Room is not in playing state',
        });
        return;
      }

      const playerColor: PlayerColor | null =
        room.redPlayer === socket.id
          ? 'red'
          : room.blackPlayer === socket.id
            ? 'black'
            : null;

      if (!playerColor) {
        socket.emit('error_message', {
          message: 'Spectators cannot move pieces',
        });
        return;
      }

      if (room.turn !== playerColor) {
        socket.emit('error_message', { message: 'Not your turn' });
        return;
      }

      const validation = isValidMove(room.boardState, payload.move, room.turn);
      if (!validation.valid) {
        socket.emit('error_message', {
          message: validation.reason || 'Invalid move',
        });
        return;
      }

      const movingPiece =
        room.boardState[payload.move.from.y][payload.move.from.x];
      if (!movingPiece || getPieceColor(movingPiece) !== playerColor) {
        socket.emit('error_message', { message: 'Invalid piece ownership' });
        return;
      }

      const captured = room.boardState[payload.move.to.y][payload.move.to.x];
      room.boardState = applyMove(room.boardState, payload.move);
      room.turn = room.turn === 'red' ? 'black' : 'red';
      room.moveHistory.push({
        ...payload.move,
        piece: movingPiece,
        captured,
        by: socket.id,
        createdAt: new Date().toISOString(),
      });

      const nextPlayer = room.turn;
      if (isCheckmate(room.boardState, nextPlayer)) {
        room.status = 'finished';
        room.winner = nextPlayer === 'red' ? 'black' : 'red';

        if (room.redPlayer && room.blackPlayer) {
          await MatchHistoryModel.create({
            roomId: room.id,
            redPlayer: room.redPlayer,
            blackPlayer: room.blackPlayer,
            winner: room.winner,
            moves: room.moveHistory,
            startedAt: room.createdAt,
            endedAt: new Date(),
          });
        }

        await updateRoom(room);
        io.to(room.id).emit('move_made', {
          move: payload.move,
          room: serializeRoom(room),
        });
        io.to(room.id).emit('game_over', {
          winner: room.winner,
          room: serializeRoom(room),
        });
        return;
      }

      await updateRoom(room);
      io.to(room.id).emit('move_made', {
        move: payload.move,
        room: serializeRoom(room),
      });
    });

    socket.on(
      'get_valid_moves',
      (payload: { roomId: string; position: { x: number; y: number } }) => {
        const room = getRoom(payload.roomId);
        if (!room || room.status !== 'playing') {
          socket.emit('valid_moves', { moves: [] });
          return;
        }

        const piece = room.boardState[payload.position.y]?.[payload.position.x];
        if (!piece) {
          socket.emit('valid_moves', { moves: [] });
          return;
        }

        const color =
          room.redPlayer === socket.id
            ? 'red'
            : room.blackPlayer === socket.id
              ? 'black'
              : null;
        if (!color || getPieceColor(piece) !== color || room.turn !== color) {
          socket.emit('valid_moves', { moves: [] });
          return;
        }

        const moves = getValidMoves(room.boardState, piece, payload.position);
        socket.emit('valid_moves', { moves });
      },
    );

    socket.on('request_rematch', async (payload: { roomId: string }) => {
      const room = getRoom(payload.roomId);
      if (!room) return;

      room.boardState = createInitialBoard();
      room.turn = 'red';
      room.status = 'playing';
      room.winner = null;
      room.moveHistory = [];

      await updateRoom(room);
      io.to(room.id).emit('game_started', {
        room: serializeRoom(room),
      });
    });

    socket.on('disconnect', async () => {
      removeSocketFromQueue(socket.id);
      const roomId = findPlayerRoom(socket.id);
      if (!roomId) return;

      const room = getRoom(roomId);
      if (!room) return;

      if (room.redPlayer === socket.id) room.redPlayer = null;
      if (room.blackPlayer === socket.id) room.blackPlayer = null;
      room.spectators = room.spectators.filter((id) => id !== socket.id);
      delete room.playerNames[socket.id];

      if (!room.redPlayer || !room.blackPlayer) {
        room.status = room.status === 'finished' ? 'finished' : 'waiting';
      }

      await updateRoom(room);
      io.to(room.id).emit('player_left', {
        socketId: socket.id,
        room: serializeRoom(room),
      });
    });
  });
}
