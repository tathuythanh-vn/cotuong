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
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-6 lg:grid-cols-[auto_320px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-2xl font-semibold">Room #{room.id}</h2>
          <div className="space-x-2">
            <button
              onClick={onLeaveRoom}
              className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600"
            >
              Leave Room
            </button>
            <button
              onClick={onRequestRematch}
              className="rounded bg-emerald-700 px-3 py-1 hover:bg-emerald-600"
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
          <p className="rounded bg-red-900 px-3 py-2 text-red-100">{error}</p>
        )}
      </div>

      <div className="space-y-4">
        <PlayerInfo room={room} role={role} />
        <MoveHistory moves={room.moveHistory} />
      </div>
    </div>
  );
}
