import { useMemo, useState } from 'react';
import { Board, Move, PieceCode, Position } from '../types';

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

interface XiangqiBoardProps {
  board: Board;
  canMove: boolean;
  role: 'red' | 'black' | 'spectator' | null;
  legalMoves: Position[];
  lastMove: Move | null;
  onMove: (move: Move) => void;
  onSelect: (position: Position) => void;
}

function isRedPiece(piece: string) {
  return piece === piece.toUpperCase();
}

export function XiangqiBoard({
  board,
  canMove,
  role,
  legalMoves,
  lastMove,
  onMove,
  onSelect,
}: XiangqiBoardProps) {
  const [selected, setSelected] = useState<Position | null>(null);
  const fileLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const legalSet = useMemo(() => {
    return new Set(legalMoves.map((m) => `${m.x}-${m.y}`));
  }, [legalMoves]);

  function ownPiece(piece: string): boolean {
    if (role === 'spectator' || !role) return false;
    if (role === 'red') return isRedPiece(piece);
    return !isRedPiece(piece);
  }

  function tryMove(to: Position) {
    if (!selected) return;
    if (!legalSet.has(`${to.x}-${to.y}`)) return;
    onMove({ from: selected, to });
    setSelected(null);
  }

  function onCellClick(x: number, y: number) {
    const piece = board[y][x];
    const target: Position = { x, y };

    if (!canMove) return;

    if (selected && legalSet.has(`${x}-${y}`)) {
      tryMove(target);
      return;
    }

    if (piece && ownPiece(piece)) {
      setSelected(target);
      onSelect(target);
      return;
    }

    if (selected) {
      tryMove(target);
    }
  }

  return (
    <div className="inline-flex flex-col gap-2 rounded-2xl border-2 border-amber-950/70 bg-amber-700 p-3 shadow-2xl">
      <div className="grid grid-cols-9 gap-1 px-1 text-center text-xs font-semibold text-amber-950/90">
        {fileLabels.map((label) => (
          <span key={`top-${label}`}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-9 gap-1 rounded-lg bg-amber-300 p-2">
        {board.map((row, y) =>
          row.map((cell, x) => {
            const key = `${x}-${y}`;
            const selectedCell = selected?.x === x && selected.y === y;
            const legal = legalSet.has(key);
            const isLastFrom = lastMove?.from.x === x && lastMove.from.y === y;
            const isLastTo = lastMove?.to.x === x && lastMove.to.y === y;

            return (
              <div
                key={key}
                onClick={() => onCellClick(x, y)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onCellClick(x, y)}
                className={[
                  'relative flex h-12 w-12 items-center justify-center border border-amber-900/70 bg-amber-200/80 sm:h-14 sm:w-14',
                  cell ? 'cursor-pointer' : 'cursor-default',
                  selectedCell ? 'ring-2 ring-indigo-700' : '',
                  legal ? 'ring-2 ring-emerald-700' : '',
                  isLastFrom || isLastTo ? 'ring-2 ring-yellow-600' : '',
                ].join(' ')}
              >
                {cell && (
                  <div
                    draggable={canMove && ownPiece(cell)}
                    onDragStart={() => {
                      setSelected({ x, y });
                      onSelect({ x, y });
                    }}
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-900 bg-amber-100 text-2xl font-bold shadow-sm sm:h-11 sm:w-11',
                      isRedPiece(cell) ? 'text-red-700' : 'text-slate-900',
                    ].join(' ')}
                  >
                    {pieceLabels[cell as PieceCode]}
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>

      <div className="grid grid-cols-9 gap-1 px-1 text-center text-xs font-semibold text-amber-950/90">
        {[...fileLabels].reverse().map((label) => (
          <span key={`bottom-${label}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}
