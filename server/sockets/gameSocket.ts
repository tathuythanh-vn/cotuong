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
  deleteRoom,
  enqueuePlayer,
  getAllRooms,
  getRoom,
  markRoomActivity,
  removeSocketFromQueue,
  serializeRoom,
  updateRoom,
} from '../roomStore.js';
import { Move, PlayerColor } from '../types.js';

interface ChatMessage {
  id: string;
  roomId: string;
  senderSocketId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface SurrenderRequestState {
  requesterSocketId: string;
  targetSocketId: string;
}

const roomChatHistory = new Map<string, ChatMessage[]>();
const roomRematchVotes = new Map<string, Set<string>>();
const roomSurrenderRequests = new Map<string, SurrenderRequestState>();
const ROOM_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ROOM_CLEANUP_INTERVAL_MS = 60 * 1000;
let roomCleanupInterval: NodeJS.Timeout | null = null;

function ensureRoomCleanup(io: Server): void {
  if (roomCleanupInterval) return;

  roomCleanupInterval = setInterval(() => {
    void (async () => {
      const now = Date.now();
      const expiredRooms = getAllRooms().filter(
        (room) => now - room.lastActivityAt.getTime() >= ROOM_IDLE_TIMEOUT_MS,
      );

      for (const room of expiredRooms) {
        io.to(room.id).emit('room_expired', {
          roomId: room.id,
          message: 'Room expired after 15 minutes of inactivity',
        });

        const participants = [
          room.redPlayer,
          room.blackPlayer,
          ...room.spectators,
        ].filter((socketId): socketId is string => Boolean(socketId));

        for (const socketId of participants) {
          io.sockets.sockets.get(socketId)?.leave(room.id);
        }

        roomChatHistory.delete(room.id);
        clearRoomTransientState(room.id);
        await deleteRoom(room.id);
      }
    })();
  }, ROOM_CLEANUP_INTERVAL_MS);
}

function sanitizeUsername(username?: string): string | null {
  const trimmed = username?.trim();
  if (!trimmed || trimmed.length < 2) return null;
  return trimmed.slice(0, 20);
}

function getOpponentSocketId(roomId: string, socketId: string): string | null {
  const room = getRoom(roomId);
  if (!room) return null;

  if (room.redPlayer === socketId) return room.blackPlayer;
  if (room.blackPlayer === socketId) return room.redPlayer;
  return null;
}

function isPlayerSocket(roomId: string, socketId: string): boolean {
  const room = getRoom(roomId);
  if (!room) return false;
  return room.redPlayer === socketId || room.blackPlayer === socketId;
}

function clearRoomTransientState(roomId: string): void {
  roomRematchVotes.delete(roomId);
  roomSurrenderRequests.delete(roomId);
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
  ensureRoomCleanup(io);

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
      roomChatHistory.set(room.id, []);
      clearRoomTransientState(room.id);
      markRoomActivity(room.id);

      socket.emit('room_created', {
        roomId: room.id,
        inviteLink: `/join/${room.id}`,
        room: serializeRoom(room),
      });
      socket.emit('chat_history', { messages: [] });
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
      markRoomActivity(room.id);

      io.sockets.sockets.get(matched.socketId)?.join(room.id);
      socket.join(room.id);

      const history = roomChatHistory.get(room.id) ?? [];
      io.sockets.sockets
        .get(matched.socketId)
        ?.emit('chat_history', { messages: history });
      socket.emit('chat_history', { messages: history });

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
        markRoomActivity(room.id);

        socket.emit('room_joined', {
          room: serializeRoom(room),
          role,
        });
        socket.emit('chat_history', {
          messages: roomChatHistory.get(room.id) ?? [],
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

    socket.on(
      'send_chat_message',
      (payload: { roomId: string; message: string }) => {
        const room = getRoom(payload.roomId);
        if (!room) {
          socket.emit('error_message', { message: 'Room not found' });
          return;
        }

        const text = payload.message?.trim();
        if (!text) return;

        const senderName = room.playerNames[socket.id] ?? socket.id.slice(0, 8);
        const chatMessage: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          roomId: room.id,
          senderSocketId: socket.id,
          senderName,
          text: text.slice(0, 240),
          createdAt: new Date().toISOString(),
        };

        const history = roomChatHistory.get(room.id) ?? [];
        history.push(chatMessage);
        if (history.length > 100) {
          history.splice(0, history.length - 100);
        }
        roomChatHistory.set(room.id, history);
        markRoomActivity(room.id);

        io.to(room.id).emit('chat_message', { message: chatMessage });
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

      roomRematchVotes.delete(room.id);

      const surrenderState = roomSurrenderRequests.get(room.id);
      if (
        surrenderState &&
        (surrenderState.requesterSocketId === socket.id ||
          surrenderState.targetSocketId === socket.id)
      ) {
        roomSurrenderRequests.delete(room.id);
        io.to(room.id).emit('surrender_resolved', {
          accepted: false,
          requesterSocketId: surrenderState.requesterSocketId,
        });
      }

      await updateRoom(room);
      markRoomActivity(room.id);
      socket.leave(room.id);

      io.to(room.id).emit('player_left', {
        socketId: socket.id,
        room: serializeRoom(room),
      });

      const hasParticipants =
        room.redPlayer || room.blackPlayer || room.spectators.length > 0;
      if (!hasParticipants) {
        roomChatHistory.delete(room.id);
        clearRoomTransientState(room.id);
      }
    });

    socket.on('make_move', async (payload: { roomId: string; move: Move }) => {
      const room = getRoom(payload.roomId);
      if (!room || room.status !== 'playing') {
        socket.emit('error_message', {
          message: 'Room is not in playing state',
        });
        return;
      }

      if (roomSurrenderRequests.has(room.id)) {
        socket.emit('error_message', {
          message: 'Game is paused for surrender confirmation',
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
      roomRematchVotes.delete(room.id);
      markRoomActivity(room.id);

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
        clearRoomTransientState(room.id);
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

        if (roomSurrenderRequests.has(room.id)) {
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
        markRoomActivity(room.id);
        socket.emit('valid_moves', { moves });
      },
    );

    socket.on('request_rematch', async (payload: { roomId: string }) => {
      const room = getRoom(payload.roomId);
      if (!room) return;

      if (!isPlayerSocket(room.id, socket.id)) {
        socket.emit('error_message', {
          message: 'Only players can request rematch',
        });
        return;
      }

      if (room.status !== 'finished') {
        socket.emit('error_message', {
          message: 'Rematch is available only after game over',
        });
        return;
      }

      if (roomSurrenderRequests.has(room.id)) {
        socket.emit('error_message', {
          message: 'Cannot rematch while surrender request is pending',
        });
        return;
      }

      if (!room.redPlayer || !room.blackPlayer) {
        socket.emit('error_message', {
          message: 'Both players must be present for rematch',
        });
        return;
      }

      const votes = roomRematchVotes.get(room.id) ?? new Set<string>();
      votes.add(socket.id);
      roomRematchVotes.set(room.id, votes);

      io.to(room.id).emit('rematch_vote_update', {
        votes: votes.size,
        required: 2,
        requestedByName: room.playerNames[socket.id] ?? 'Player',
      });

      if (votes.size < 2) {
        markRoomActivity(room.id);
        return;
      }

      room.boardState = createInitialBoard();
      room.turn = 'red';
      room.status = 'playing';
      room.winner = null;
      room.moveHistory = [];

      await updateRoom(room);
      clearRoomTransientState(room.id);
      markRoomActivity(room.id);
      io.to(room.id).emit('game_started', {
        room: serializeRoom(room),
      });
    });

    socket.on('request_surrender', async (payload: { roomId: string }) => {
      const room = getRoom(payload.roomId);
      if (!room) return;

      if (!isPlayerSocket(room.id, socket.id)) {
        socket.emit('error_message', {
          message: 'Only players can request surrender',
        });
        return;
      }

      if (room.status !== 'playing') {
        socket.emit('error_message', {
          message: 'Surrender is only available during a game',
        });
        return;
      }

      if (roomSurrenderRequests.has(room.id)) {
        socket.emit('error_message', {
          message: 'A surrender request is already pending',
        });
        return;
      }

      const targetSocketId = getOpponentSocketId(room.id, socket.id);
      if (!targetSocketId) {
        socket.emit('error_message', {
          message: 'No opponent available for surrender request',
        });
        return;
      }

      roomSurrenderRequests.set(room.id, {
        requesterSocketId: socket.id,
        targetSocketId,
      });

      markRoomActivity(room.id);
      const requesterName = room.playerNames[socket.id] ?? 'Player';

      io.to(room.id).emit('surrender_status', {
        requesterSocketId: socket.id,
        requesterName,
      });

      io.sockets.sockets.get(targetSocketId)?.emit('surrender_request', {
        roomId: room.id,
        requesterSocketId: socket.id,
        requesterName,
      });
    });

    socket.on(
      'respond_surrender',
      async (payload: { roomId: string; accept: boolean }) => {
        const room = getRoom(payload.roomId);
        if (!room) return;

        const surrenderState = roomSurrenderRequests.get(room.id);
        if (!surrenderState) return;

        if (surrenderState.targetSocketId !== socket.id) {
          socket.emit('error_message', {
            message: 'Only opponent can respond to surrender request',
          });
          return;
        }

        markRoomActivity(room.id);

        if (!payload.accept) {
          roomSurrenderRequests.delete(room.id);
          io.to(room.id).emit('surrender_resolved', {
            accepted: false,
            requesterSocketId: surrenderState.requesterSocketId,
          });
          return;
        }

        room.status = 'finished';
        room.winner =
          room.redPlayer === surrenderState.requesterSocketId ? 'black' : 'red';

        await updateRoom(room);
        clearRoomTransientState(room.id);

        io.to(room.id).emit('surrender_resolved', {
          accepted: true,
          requesterSocketId: surrenderState.requesterSocketId,
          winner: room.winner,
        });

        io.to(room.id).emit('game_over', {
          winner: room.winner,
          room: serializeRoom(room),
        });
      },
    );

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

      roomRematchVotes.delete(room.id);

      const surrenderState = roomSurrenderRequests.get(room.id);
      if (
        surrenderState &&
        (surrenderState.requesterSocketId === socket.id ||
          surrenderState.targetSocketId === socket.id)
      ) {
        roomSurrenderRequests.delete(room.id);
        io.to(room.id).emit('surrender_resolved', {
          accepted: false,
          requesterSocketId: surrenderState.requesterSocketId,
        });
      }

      await updateRoom(room);
      io.to(room.id).emit('player_left', {
        socketId: socket.id,
        room: serializeRoom(room),
      });

      const hasParticipants =
        room.redPlayer || room.blackPlayer || room.spectators.length > 0;
      if (!hasParticipants) {
        roomChatHistory.delete(room.id);
        clearRoomTransientState(room.id);
      }
    });
  });
}
