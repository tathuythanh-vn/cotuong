import { PlayerColor, Room } from '../types';

interface PlayerInfoProps {
  room: Room;
  role: 'red' | 'black' | 'spectator' | null;
}

export function PlayerInfo({ room, role }: PlayerInfoProps) {
  return (
    <div className="rounded-lg bg-slate-800 p-4 text-white">
      <h3 className="mb-2 text-lg font-semibold">Players</h3>
      <p>Red: {room.redPlayer ?? 'waiting'}</p>
      <p>Black: {room.blackPlayer ?? 'waiting'}</p>
      <p>Spectators: {room.spectators.length}</p>
      <p className="mt-2">Your role: {role ?? '-'}</p>
      <p>Turn: {room.turn as PlayerColor}</p>
      <p>Status: {room.status}</p>
      {room.winner && (
        <p className="mt-2 font-bold text-emerald-400">Winner: {room.winner}</p>
      )}
    </div>
  );
}
