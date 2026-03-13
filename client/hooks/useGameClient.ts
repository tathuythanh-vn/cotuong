import { useEffect, useMemo, useState } from 'react';
import { socket } from '../services/socket';
import { Move, Position, Room } from '../types';

export function useGameClient() {
  const [room, setRoom] = useState<Room | null>(null);
  const [role, setRole] = useState<'red' | 'black' | 'spectator' | null>(null);
  const [error, setError] = useState<string>('');
  const [queued, setQueued] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);

  useEffect(() => {
    const handleRoomCreated = (payload: { room: Room }) => {
      setRoom(payload.room);
      setRole('red');
      setQueued(false);
    };

    const handleRoomJoined = (payload: {
      room: Room;
      role: 'red' | 'black' | 'spectator';
    }) => {
      setRoom(payload.room);
      setRole(payload.role);
      setQueued(false);
    };

    const handleGameStarted = (payload: { room: Room }) => {
      setRoom(payload.room);
      setError('');
      setLegalMoves([]);
      setLastMove(null);
    };

    const handleMoveMade = (payload: { move: Move; room: Room }) => {
      setRoom(payload.room);
      setLastMove(payload.move);
      setLegalMoves([]);
      setError('');
    };

    const handlePlayerLeft = (payload: { room: Room }) => {
      setRoom(payload.room);
    };

    const handleGameOver = (payload: { room: Room }) => {
      setRoom(payload.room);
    };

    const handleError = (payload: { message: string }) => {
      setError(payload.message);
    };

    const handleQueued = () => {
      setQueued(true);
      setError('');
    };

    const handleValidMoves = (payload: { moves: Position[] }) => {
      setLegalMoves(payload.moves);
    };

    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined', handleRoomJoined);
    socket.on('game_started', handleGameStarted);
    socket.on('move_made', handleMoveMade);
    socket.on('player_left', handlePlayerLeft);
    socket.on('game_over', handleGameOver);
    socket.on('error_message', handleError);
    socket.on('queued', handleQueued);
    socket.on('valid_moves', handleValidMoves);

    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('room_joined', handleRoomJoined);
      socket.off('game_started', handleGameStarted);
      socket.off('move_made', handleMoveMade);
      socket.off('player_left', handlePlayerLeft);
      socket.off('game_over', handleGameOver);
      socket.off('error_message', handleError);
      socket.off('queued', handleQueued);
      socket.off('valid_moves', handleValidMoves);
    };
  }, []);

  const canMove = useMemo(() => {
    if (!room || !role || role === 'spectator') return false;
    return room.status === 'playing' && room.turn === role;
  }, [room, role]);

  function createRoom() {
    socket.emit('create_room');
  }

  function quickMatch() {
    socket.emit('quick_match');
  }

  function joinRoom(roomId: string) {
    socket.emit('join_room', { roomId });
  }

  function leaveRoom() {
    if (!room) return;
    socket.emit('leave_room', { roomId: room.id });
    setRoom(null);
    setRole(null);
    setLastMove(null);
    setLegalMoves([]);
    setQueued(false);
  }

  function makeMove(move: Move) {
    if (!room) return;
    socket.emit('make_move', { roomId: room.id, move });
  }

  function requestLegalMoves(position: Position) {
    if (!room) return;
    socket.emit('get_valid_moves', { roomId: room.id, position });
  }

  function requestRematch() {
    if (!room) return;
    socket.emit('request_rematch', { roomId: room.id });
  }

  return {
    room,
    role,
    error,
    queued,
    canMove,
    lastMove,
    legalMoves,
    createRoom,
    quickMatch,
    joinRoom,
    leaveRoom,
    makeMove,
    requestLegalMoves,
    requestRematch,
  };
}
