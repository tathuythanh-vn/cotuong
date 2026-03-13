import { PlayerColor, Room } from '../types';
import type { BoardColorMode } from '../pages/GamePage';

interface PlayerInfoProps {
  room: Room;
  role: 'red' | 'black' | 'spectator' | null;
  colorMode: BoardColorMode;
}

const panelPalettes = {
  classic: {
    card: 'border-amber-900/60 bg-amber-700/80 text-amber-950',
    winner: 'text-emerald-900',
  },
  jade: {
    card: 'border-emerald-900/60 bg-emerald-700/80 text-emerald-950',
    winner: 'text-emerald-950',
  },
  night: {
    card: 'border-slate-700/70 bg-slate-800/90 text-slate-100',
    winner: 'text-emerald-300',
  },
} as const;

export function PlayerInfo({ room, role, colorMode }: PlayerInfoProps) {
  const palette = panelPalettes[colorMode];

  const getDisplayName = (socketId: string | null) => {
    if (!socketId) return 'waiting';
    return room.playerNames[socketId] ?? socketId;
  };

  return (
    <div
      className={[
        'rounded-xl border p-4 shadow-lg transition-colors duration-300',
        palette.card,
      ].join(' ')}
    >
      <h3 className="mb-3 text-lg font-bold">Players</h3>
      <div className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold">Red</span>
        <span className="truncate">{getDisplayName(room.redPlayer)}</span>

        <span className="font-semibold">Black</span>
        <span className="truncate">{getDisplayName(room.blackPlayer)}</span>

        <span className="font-semibold">Spectators</span>
        <span>{room.spectators.length}</span>

        <span className="font-semibold">Your role</span>
        <span>{role ?? '-'}</span>

        <span className="font-semibold">Turn</span>
        <span>{room.turn as PlayerColor}</span>

        <span className="font-semibold">Status</span>
        <span>{room.status}</span>
      </div>
      {room.winner && (
        <p className={['mt-2 font-bold', palette.winner].join(' ')}>
          Winner: {room.winner}
        </p>
      )}
    </div>
  );
}
