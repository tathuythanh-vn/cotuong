import { MoveRecord, PieceCode } from '../types';
import type { BoardColorMode } from '../pages/GamePage';

interface CapturedPiecesProps {
  moves: MoveRecord[];
  colorMode: BoardColorMode;
}

const pieceLabels: Record<PieceCode, string> = {
  R: '俥',
  H: '傌',
  E: '相',
  A: '仕',
  G: '帥',
  C: '炮',
  S: '兵',
  r: '車',
  h: '馬',
  e: '象',
  a: '士',
  g: '將',
  c: '砲',
  s: '卒',
};

const redPieceOrder: PieceCode[] = ['R', 'H', 'E', 'A', 'G', 'C', 'S'];
const blackPieceOrder: PieceCode[] = ['r', 'h', 'e', 'a', 'g', 'c', 's'];

function isRedPiece(piece: PieceCode): boolean {
  return piece === piece.toUpperCase();
}

const panelPalettes = {
  classic: {
    card: 'border-amber-900/60 bg-amber-700/80 text-amber-950',
    muted: 'text-amber-900/80',
    box: 'border-amber-900/30 bg-amber-100/70',
    chip: 'border-amber-900/40 bg-amber-50',
    blackPiece: 'text-slate-900',
  },
  jade: {
    card: 'border-emerald-900/60 bg-emerald-700/80 text-emerald-950',
    muted: 'text-emerald-900/80',
    box: 'border-emerald-900/30 bg-emerald-100/70',
    chip: 'border-emerald-900/40 bg-emerald-50',
    blackPiece: 'text-slate-900',
  },
  night: {
    card: 'border-slate-700/70 bg-slate-800/90 text-slate-100',
    muted: 'text-slate-300/85',
    box: 'border-slate-600/70 bg-slate-700/80',
    chip: 'border-slate-500/70 bg-slate-900/80',
    blackPiece: 'text-slate-100',
  },
} as const;

export function CapturedPieces({ moves, colorMode }: CapturedPiecesProps) {
  const palette = panelPalettes[colorMode];

  const redLost = new Map<PieceCode, number>();
  const blackLost = new Map<PieceCode, number>();

  for (const move of moves) {
    const captured = move.captured;
    if (!captured) continue;

    if (isRedPiece(captured)) {
      redLost.set(captured, (redLost.get(captured) ?? 0) + 1);
    } else {
      blackLost.set(captured, (blackLost.get(captured) ?? 0) + 1);
    }
  }

  const hasAnyCaptured = redLost.size > 0 || blackLost.size > 0;

  return (
    <div
      className={[
        'rounded-xl border p-4 shadow-lg transition-colors duration-300',
        palette.card,
      ].join(' ')}
    >
      <h3 className="mb-3 text-lg font-bold">Captured Pieces</h3>

      {!hasAnyCaptured && (
        <p className={['text-sm', palette.muted].join(' ')}>
          No captured pieces yet.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-sm font-semibold">Red lost</p>
          <div
            className={[
              'flex min-h-10 flex-wrap gap-2 rounded-lg border p-2',
              palette.box,
            ].join(' ')}
          >
            {redPieceOrder
              .filter((piece) => (redLost.get(piece) ?? 0) > 0)
              .map((piece) => {
                const count = redLost.get(piece) ?? 0;
                return (
                  <span
                    key={`red-${piece}`}
                    className={[
                      'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm',
                      palette.chip,
                    ].join(' ')}
                  >
                    <span className="text-lg font-bold text-red-700">
                      {pieceLabels[piece]}
                    </span>
                    <span className="text-xs font-semibold">×{count}</span>
                  </span>
                );
              })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Black lost</p>
          <div
            className={[
              'flex min-h-10 flex-wrap gap-2 rounded-lg border p-2',
              palette.box,
            ].join(' ')}
          >
            {blackPieceOrder
              .filter((piece) => (blackLost.get(piece) ?? 0) > 0)
              .map((piece) => {
                const count = blackLost.get(piece) ?? 0;
                return (
                  <span
                    key={`black-${piece}`}
                    className={[
                      'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm',
                      palette.chip,
                    ].join(' ')}
                  >
                    <span
                      className={['text-lg font-bold', palette.blackPiece].join(
                        ' ',
                      )}
                    >
                      {pieceLabels[piece]}
                    </span>
                    <span className="text-xs font-semibold">×{count}</span>
                  </span>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
