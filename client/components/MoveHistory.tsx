import { MoveRecord } from '../types';
import type { BoardColorMode } from '../pages/GamePage';

interface MoveHistoryProps {
  moves: MoveRecord[];
  colorMode: BoardColorMode;
}

const panelPalettes = {
  classic: {
    card: 'border-amber-900/60 bg-amber-700/80 text-amber-950',
    item: 'border-amber-900/40 bg-amber-100/75',
  },
  jade: {
    card: 'border-emerald-900/60 bg-emerald-700/80 text-emerald-950',
    item: 'border-emerald-900/40 bg-emerald-100/75',
  },
  night: {
    card: 'border-slate-700/70 bg-slate-800/90 text-slate-100',
    item: 'border-slate-600/70 bg-slate-700/80',
  },
} as const;

export function MoveHistory({ moves, colorMode }: MoveHistoryProps) {
  const palette = panelPalettes[colorMode];

  return (
    <div
      className={[
        'h-[500px] overflow-y-auto rounded-xl border p-4 shadow-lg transition-colors duration-300',
        palette.card,
      ].join(' ')}
    >
      <h3 className="mb-3 text-lg font-bold">Move History</h3>
      <ul className="space-y-1 text-sm">
        {moves.map((move, index) => (
          <li
            key={`${move.createdAt}-${index}`}
            className={['rounded border px-2 py-1', palette.item].join(' ')}
          >
            {index + 1}. {move.piece}: ({move.from.x},{move.from.y}) → (
            {move.to.x},{move.to.y})
          </li>
        ))}
      </ul>
    </div>
  );
}
