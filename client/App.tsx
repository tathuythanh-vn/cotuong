import { useEffect, useState } from 'react';
import { Lobby } from './components/Lobby';
import { useGameClient } from './hooks/useGameClient';
import { GamePage } from './pages/GamePage';
import { MainMenuPage } from './pages/MainMenuPage';
import { fetchAvailableRooms } from './services/api';
import { Room } from './types';

export default function App() {
  const {
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
  } = useGameClient();

  const [screen, setScreen] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (room) {
      setScreen('game');
    } else if (screen === 'game') {
      setScreen('menu');
    }
  }, [room, screen]);

  async function loadRooms() {
    setLoadingRooms(true);
    try {
      setRooms(await fetchAvailableRooms());
    } finally {
      setLoadingRooms(false);
    }
  }

  if (screen === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <Lobby
          rooms={rooms}
          loading={loadingRooms}
          onRefresh={loadRooms}
          onJoinRoom={joinRoom}
          onBack={() => setScreen('menu')}
        />
      </div>
    );
  }

  if (room) {
    return (
      <div className="min-h-screen bg-slate-900">
        <GamePage
          room={room}
          role={role}
          canMove={canMove}
          legalMoves={legalMoves}
          lastMove={lastMove}
          onMove={makeMove}
          onSelect={requestLegalMoves}
          onLeaveRoom={leaveRoom}
          onRequestRematch={requestRematch}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <MainMenuPage
        onCreateRoom={createRoom}
        onQuickMatch={quickMatch}
        onFindRoom={async () => {
          setScreen('lobby');
          await loadRooms();
        }}
      />
      {queued && (
        <p className="text-center text-amber-300">Searching opponent...</p>
      )}
      {error && <p className="text-center text-red-300">{error}</p>}
    </div>
  );
}
