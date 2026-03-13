import { MoveRecord } from '../types';

interface MoveHistoryProps {
  moves: MoveRecord[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  return (
    <div className="h-[500px] overflow-y-auto rounded-lg bg-slate-800 p-4 text-white">
      <h3 className="mb-3 text-lg font-semibold">Move History</h3>
      <ul className="space-y-1 text-sm">
        {moves.map((move, index) => (
          <li
            key={`${move.createdAt}-${index}`}
            className="rounded bg-slate-700 px-2 py-1"
          >
            {index + 1}. {move.piece}: ({move.from.x},{move.from.y}) → (
            {move.to.x},{move.to.y})
          </li>
        ))}
      </ul>
    </div>
  );
}
