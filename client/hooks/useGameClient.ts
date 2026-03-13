import { useEffect, useMemo, useState } from 'react';
import { socket } from '../services/socket';
import {
  ChatMessage,
  Move,
  Position,
  RematchVoteState,
  Room,
  SurrenderState,
} from '../types';

export function useGameClient() {
  const [room, setRoom] = useState<Room | null>(null);
  const [role, setRole] = useState<'red' | 'black' | 'spectator' | null>(null);
  const [error, setError] = useState<string>('');
  const [queued, setQueued] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [rematchVote, setRematchVote] = useState<RematchVoteState | null>(null);
  const [surrenderState, setSurrenderState] = useState<SurrenderState | null>(
    null,
  );

  useEffect(() => {
    const handleRoomCreated = (payload: { room: Room }) => {
      setRoom(payload.room);
      setRole('red');
      setQueued(false);
      setChatMessages([]);
    };

    const handleRoomJoined = (payload: {
      room: Room;
      role: 'red' | 'black' | 'spectator';
    }) => {
      setRoom(payload.room);
      setRole(payload.role);
      setQueued(false);
      setChatMessages([]);
    };

    const handleGameStarted = (payload: { room: Room }) => {
      setRoom(payload.room);
      setError('');
      setLegalMoves([]);
      setLastMove(null);
      setRematchVote(null);
      setSurrenderState(null);
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
      setSurrenderState(null);
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

    const handleChatHistory = (payload: { messages: ChatMessage[] }) => {
      setChatMessages(payload.messages);
    };

    const handleChatMessage = (payload: { message: ChatMessage }) => {
      setChatMessages((prev) => [...prev, payload.message]);
    };

    const handleRoomExpired = (payload: { message?: string }) => {
      setRoom(null);
      setRole(null);
      setLastMove(null);
      setLegalMoves([]);
      setQueued(false);
      setChatMessages([]);
      setRematchVote(null);
      setSurrenderState(null);
      setError(payload.message ?? 'Room expired due to inactivity');
    };

    const handleRematchVoteUpdate = (payload: RematchVoteState) => {
      setRematchVote(payload);
    };

    const handleSurrenderStatus = (payload: {
      requesterSocketId: string;
      requesterName: string;
    }) => {
      const selfId = socket.id;
      if (!selfId) return;

      if (payload.requesterSocketId === selfId) {
        setSurrenderState({
          phase: 'outgoing',
          requesterSocketId: payload.requesterSocketId,
          requesterName: payload.requesterName,
        });
      }
    };

    const handleSurrenderRequest = (payload: {
      requesterSocketId: string;
      requesterName: string;
    }) => {
      setSurrenderState({
        phase: 'incoming',
        requesterSocketId: payload.requesterSocketId,
        requesterName: payload.requesterName,
      });
    };

    const handleSurrenderResolved = (payload: {
      accepted: boolean;
      requesterSocketId: string;
    }) => {
      const selfId = socket.id;
      if (!payload.accepted && payload.requesterSocketId === selfId) {
        setError('Opponent declined surrender request');
      }
      setSurrenderState(null);
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
    socket.on('chat_history', handleChatHistory);
    socket.on('chat_message', handleChatMessage);
    socket.on('room_expired', handleRoomExpired);
    socket.on('rematch_vote_update', handleRematchVoteUpdate);
    socket.on('surrender_status', handleSurrenderStatus);
    socket.on('surrender_request', handleSurrenderRequest);
    socket.on('surrender_resolved', handleSurrenderResolved);

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
      socket.off('chat_history', handleChatHistory);
      socket.off('chat_message', handleChatMessage);
      socket.off('room_expired', handleRoomExpired);
      socket.off('rematch_vote_update', handleRematchVoteUpdate);
      socket.off('surrender_status', handleSurrenderStatus);
      socket.off('surrender_request', handleSurrenderRequest);
      socket.off('surrender_resolved', handleSurrenderResolved);
    };
  }, []);

  const canMove = useMemo(() => {
    if (!room || !role || role === 'spectator') return false;
    return room.status === 'playing' && room.turn === role;
  }, [room, role]);

  function createRoom(username: string) {
    socket.emit('create_room', { username });
  }

  function quickMatch(username: string) {
    socket.emit('quick_match', { username });
  }

  function joinRoom(roomId: string, username: string) {
    socket.emit('join_room', { roomId, username });
  }

  function leaveRoom() {
    if (!room) return;
    socket.emit('leave_room', { roomId: room.id });
    setRoom(null);
    setRole(null);
    setLastMove(null);
    setLegalMoves([]);
    setQueued(false);
    setChatMessages([]);
    setRematchVote(null);
    setSurrenderState(null);
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

  function requestSurrender() {
    if (!room) return;
    socket.emit('request_surrender', { roomId: room.id });
  }

  function respondSurrender(accept: boolean) {
    if (!room) return;
    socket.emit('respond_surrender', { roomId: room.id, accept });
  }

  function sendChatMessage(message: string) {
    if (!room) return;
    socket.emit('send_chat_message', {
      roomId: room.id,
      message,
    });
  }

  return {
    room,
    role,
    error,
    queued,
    canMove,
    lastMove,
    legalMoves,
    chatMessages,
    rematchVote,
    surrenderState,
    isGamePaused: Boolean(surrenderState),
    createRoom,
    quickMatch,
    joinRoom,
    leaveRoom,
    makeMove,
    requestLegalMoves,
    requestRematch,
    requestSurrender,
    respondSurrender,
    sendChatMessage,
  };
}
