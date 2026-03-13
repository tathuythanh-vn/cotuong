import { nanoid } from 'nanoid';
import { createInitialBoard } from './game-engine/board.js';
import { RoomModel } from './models/Room.js';
import { MatchmakingEntry, RoomRuntime } from './types.js';

const rooms = new Map<string, RoomRuntime>();
const matchmakingQueue: MatchmakingEntry[] = [];

export function serializeRoom(room: RoomRuntime) {
  return {
    id: room.id,
    hostPlayer: room.hostPlayer,
    redPlayer: room.redPlayer,
    blackPlayer: room.blackPlayer,
    spectators: room.spectators,
    playerNames: room.playerNames,
    boardState: room.boardState,
    turn: room.turn,
    status: room.status,
    moveHistory: room.moveHistory,
    winner: room.winner,
    createdAt: room.createdAt,
  };
}

export async function createRoom(
  hostSocketId: string,
  hostUsername: string,
): Promise<RoomRuntime> {
  const id = nanoid(10);
  const room: RoomRuntime = {
    id,
    hostPlayer: hostSocketId,
    redPlayer: hostSocketId,
    blackPlayer: null,
    spectators: [],
    playerNames: {
      [hostSocketId]: hostUsername,
    },
    boardState: createInitialBoard(),
    turn: 'red',
    status: 'waiting',
    moveHistory: [],
    winner: null,
    createdAt: new Date(),
  };

  rooms.set(id, room);

  await RoomModel.findOneAndUpdate(
    { id: room.id },
    {
      id: room.id,
      hostPlayer: room.hostPlayer,
      redPlayer: room.redPlayer,
      blackPlayer: room.blackPlayer,
      spectators: room.spectators,
      playerNames: room.playerNames,
      boardState: room.boardState,
      turn: room.turn,
      status: room.status,
      winner: room.winner,
    },
    { upsert: true, new: true },
  );

  return room;
}

export function getRoom(roomId: string): RoomRuntime | undefined {
  return rooms.get(roomId);
}

export function getAvailableRooms(): RoomRuntime[] {
  return [...rooms.values()].filter((room) => room.status === 'waiting');
}

export function getAllRooms(): RoomRuntime[] {
  return [...rooms.values()];
}

export async function updateRoom(room: RoomRuntime): Promise<void> {
  rooms.set(room.id, room);
  await RoomModel.findOneAndUpdate(
    { id: room.id },
    {
      hostPlayer: room.hostPlayer,
      redPlayer: room.redPlayer,
      blackPlayer: room.blackPlayer,
      spectators: room.spectators,
      playerNames: room.playerNames,
      boardState: room.boardState,
      turn: room.turn,
      status: room.status,
      winner: room.winner,
    },
    { new: true },
  );
}

export function removeSocketFromQueue(socketId: string): void {
  const index = matchmakingQueue.findIndex(
    (entry) => entry.socketId === socketId,
  );
  if (index >= 0) matchmakingQueue.splice(index, 1);
}

export function enqueuePlayer(
  socketId: string,
  username: string,
): MatchmakingEntry | null {
  if (matchmakingQueue.some((entry) => entry.socketId === socketId)) {
    return null;
  }

  if (matchmakingQueue.length > 0) {
    const opponent = matchmakingQueue.shift()!;
    return opponent;
  }

  matchmakingQueue.push({ socketId, username });
  return null;
}
