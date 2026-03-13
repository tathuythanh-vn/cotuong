import { MoveHistory } from '../components/MoveHistory';
import { PlayerInfo } from '../components/PlayerInfo';
import { XiangqiBoard } from '../components/XiangqiBoard';
import { Move, Position, Room } from '../types';

interface GamePageProps {
  room: Room;
  role: 'red' | 'black' | 'spectator' | null;
  canMove: boolean;
  legalMoves: Position[];
  lastMove: Move | null;
  onMove: (move: Move) => void;
  onSelect: (position: Position) => void;
  onLeaveRoom: () => void;
  onRequestRematch: () => void;
  error: string;
}

export function GamePage({
  room,
  role,
  canMove,
  legalMoves,
  lastMove,
  onMove,
  onSelect,
  onLeaveRoom,
  onRequestRematch,
  error,
}: GamePageProps) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[auto_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-900/60 bg-amber-700/80 p-3 text-amber-950">
          <h2 className="text-xl font-bold sm:text-2xl">Room #{room.id}</h2>
          <div className="space-x-2">
            <button
              onClick={onLeaveRoom}
              className="rounded-lg border border-amber-900/70 bg-red-800 px-3 py-1 font-semibold text-amber-100 hover:bg-red-900"
            >
              Leave Room
            </button>
            <button
              onClick={onRequestRematch}
              className="rounded-lg border border-amber-900/70 bg-amber-900 px-3 py-1 font-semibold text-amber-100 hover:bg-amber-950"
            >
              Rematch
            </button>
          </div>
        </div>

        <XiangqiBoard
          board={room.boardState}
          canMove={canMove}
          role={role}
          legalMoves={legalMoves}
          lastMove={lastMove}
          onMove={onMove}
          onSelect={onSelect}
        />

        {error && (
          <p className="rounded-lg border border-rose-700 bg-rose-900/80 px-3 py-2 text-rose-100">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <PlayerInfo room={room} role={role} />
        <MoveHistory moves={room.moveHistory} />
      </div>
    </div>
  );
}
