import { MoveRecord } from '../types';

interface MoveHistoryProps {
  moves: MoveRecord[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  return (
    <div className="h-[500px] overflow-y-auto rounded-xl border border-amber-900/60 bg-amber-700/80 p-4 text-amber-950 shadow-lg">
      <h3 className="mb-3 text-lg font-bold">Move History</h3>
      <ul className="space-y-1 text-sm">
        {moves.map((move, index) => (
          <li
            key={`${move.createdAt}-${index}`}
            className="rounded border border-amber-900/40 bg-amber-100/75 px-2 py-1"
          >
            {index + 1}. {move.piece}: ({move.from.x},{move.from.y}) → (
            {move.to.x},{move.to.y})
          </li>
        ))}
      </ul>
    </div>
  );
}
