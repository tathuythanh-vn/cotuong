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
    <div className="grid grid-cols-9 gap-1 rounded-lg bg-amber-900 p-3">
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
                'flex h-16 w-16 items-center justify-center rounded border text-2xl font-bold',
                cell ? 'cursor-pointer' : 'cursor-default',
                selectedCell
                  ? 'border-blue-400 bg-blue-100'
                  : 'border-amber-700 bg-amber-200',
                legal ? 'ring-2 ring-emerald-500' : '',
                isLastFrom || isLastTo ? 'ring-2 ring-yellow-500' : '',
              ].join(' ')}
            >
              {cell && (
                <div
                  draggable={canMove && ownPiece(cell)}
                  onDragStart={() => {
                    setSelected({ x, y });
                    onSelect({ x, y });
                  }}
                  className={
                    isRedPiece(cell) ? 'text-red-700' : 'text-slate-900'
                  }
                >
                  {pieceLabels[cell as PieceCode]}
                </div>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
