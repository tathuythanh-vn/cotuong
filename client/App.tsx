import { useEffect, useState } from 'react';
import { Lobby } from './components/Lobby';
import { useGameClient } from './hooks/useGameClient';
import { GamePage } from './pages/GamePage';
import { MainMenuPage } from './pages/MainMenuPage';
import { fetchAvailableRooms } from './services/api';
import { Room } from './types';

const USERNAME_STORAGE_KEY = 'co_tuong_username';

export default function App() {
  const {
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
    isGamePaused,
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
  } = useGameClient();

  const [screen, setScreen] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    const savedUsername = window.localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

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

  function handleUsernameChange(value: string) {
    setUsername(value);
    if (usernameError && value.trim().length >= 2) {
      setUsernameError('');
    }
  }

  function getValidatedUsername(): string | null {
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setUsernameError('Username must be at least 2 characters.');
      return null;
    }

    setUsernameError('');
    window.localStorage.setItem(USERNAME_STORAGE_KEY, trimmed);
    return trimmed;
  }

  if (screen === 'lobby') {
    return (
      <div className="min-h-screen bg-amber-950/95 p-4 sm:p-6">
        <Lobby
          rooms={rooms}
          loading={loadingRooms}
          onRefresh={loadRooms}
          onJoinRoom={(roomId) => {
            const validUsername = getValidatedUsername();
            if (!validUsername) return;
            joinRoom(roomId, validUsername);
          }}
          onBack={() => setScreen('menu')}
        />
      </div>
    );
  }

  if (room) {
    return (
      <div className="min-h-screen">
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
          onRequestSurrender={requestSurrender}
          onRespondSurrender={respondSurrender}
          rematchVote={rematchVote}
          surrenderState={surrenderState}
          isGamePaused={isGamePaused}
          chatMessages={chatMessages}
          onSendChatMessage={sendChatMessage}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-950/95">
      <MainMenuPage
        username={username}
        usernameError={usernameError}
        onUsernameChange={handleUsernameChange}
        onCreateRoom={() => {
          const validUsername = getValidatedUsername();
          if (!validUsername) return;
          createRoom(validUsername);
        }}
        onQuickMatch={() => {
          const validUsername = getValidatedUsername();
          if (!validUsername) return;
          quickMatch(validUsername);
        }}
        onFindRoom={async () => {
          const validUsername = getValidatedUsername();
          if (!validUsername) return;
          setScreen('lobby');
          await loadRooms();
        }}
      />
      {queued && (
        <p className="text-center text-amber-200">Searching opponent...</p>
      )}
      {error && <p className="text-center text-rose-300">{error}</p>}
    </div>
  );
}
