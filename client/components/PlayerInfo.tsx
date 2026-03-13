import { PlayerColor, Room } from '../types';

interface PlayerInfoProps {
  room: Room;
  role: 'red' | 'black' | 'spectator' | null;
}

export function PlayerInfo({ room, role }: PlayerInfoProps) {
  const getDisplayName = (socketId: string | null) => {
    if (!socketId) return 'waiting';
    return room.playerNames[socketId] ?? socketId;
  };

  return (
    <div className="rounded-xl border border-amber-900/60 bg-amber-700/80 p-4 text-amber-950 shadow-lg">
      <h3 className="mb-3 text-lg font-bold">Players</h3>
      <p>
        <span className="font-semibold">Red:</span>{' '}
        {getDisplayName(room.redPlayer)}
      </p>
      <p>
        <span className="font-semibold">Black:</span>{' '}
        {getDisplayName(room.blackPlayer)}
      </p>
      <p>
        <span className="font-semibold">Spectators:</span>{' '}
        {room.spectators.length}
      </p>
      <p className="mt-2">
        <span className="font-semibold">Your role:</span> {role ?? '-'}
      </p>
      <p>
        <span className="font-semibold">Turn:</span> {room.turn as PlayerColor}
      </p>
      <p>
        <span className="font-semibold">Status:</span> {room.status}
      </p>
      {room.winner && (
        <p className="mt-2 font-bold text-emerald-900">Winner: {room.winner}</p>
      )}
    </div>
  );
}
