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
  spectatorFlipped: boolean;
  colorMode: 'classic' | 'jade' | 'night';
  legalMoves: Position[];
  lastMove: Move | null;
  onMove: (move: Move) => void;
  onSelect: (position: Position) => void;
}

const boardPalettes = {
  classic: {
    frame: 'border-amber-950/80 bg-amber-800',
    labelText: 'text-amber-100/90',
    boardSurface: 'bg-amber-400',
    cellBase: 'border-amber-900/70 bg-amber-200/90',
    riverCell: 'bg-amber-300/90',
    lineColor: 'bg-amber-900/80',
    riverText: 'text-amber-900/80',
    palaceLine: 'bg-amber-900/80',
    pieceBase: 'border-amber-950 bg-amber-50',
    redPieceText: 'text-red-700',
    blackPieceText: 'text-slate-900',
    selectedRing: 'ring-amber-900',
    legalRing: 'ring-emerald-700',
    lastRing: 'ring-yellow-600',
  },
  jade: {
    frame: 'border-emerald-950/80 bg-emerald-800',
    labelText: 'text-emerald-100/90',
    boardSurface: 'bg-emerald-400',
    cellBase: 'border-emerald-900/70 bg-emerald-200/90',
    riverCell: 'bg-emerald-300/90',
    lineColor: 'bg-emerald-900/80',
    riverText: 'text-emerald-900/80',
    palaceLine: 'bg-emerald-900/80',
    pieceBase: 'border-emerald-950 bg-emerald-50',
    redPieceText: 'text-rose-700',
    blackPieceText: 'text-slate-900',
    selectedRing: 'ring-emerald-900',
    legalRing: 'ring-emerald-700',
    lastRing: 'ring-lime-600',
  },
  night: {
    frame: 'border-slate-950/90 bg-slate-900',
    labelText: 'text-slate-100/95',
    boardSurface: 'bg-slate-700',
    cellBase: 'border-slate-900/80 bg-slate-600/85',
    riverCell: 'bg-slate-700/85',
    lineColor: 'bg-slate-200/70',
    riverText: 'text-slate-900/85',
    palaceLine: 'bg-slate-200/65',
    pieceBase: 'border-slate-900 bg-slate-200',
    redPieceText: 'text-red-700',
    blackPieceText: 'text-slate-900',
    selectedRing: 'ring-sky-400',
    legalRing: 'ring-emerald-400',
    lastRing: 'ring-amber-300',
  },
} as const;

function isRedPiece(piece: string) {
  return piece === piece.toUpperCase();
}

function hasPalaceBackslash(x: number, y: number): boolean {
  return (
    (x === 3 && y === 0) ||
    (x === 4 && y === 1) ||
    (x === 5 && y === 2) ||
    (x === 3 && y === 7) ||
    (x === 4 && y === 8) ||
    (x === 5 && y === 9)
  );
}

function hasPalaceSlash(x: number, y: number): boolean {
  return (
    (x === 5 && y === 0) ||
    (x === 4 && y === 1) ||
    (x === 3 && y === 2) ||
    (x === 5 && y === 7) ||
    (x === 4 && y === 8) ||
    (x === 3 && y === 9)
  );
}

function hasPalaceVertical(x: number, y: number): boolean {
  return x === 4 && (y <= 2 || y >= 7);
}

function hasPalaceHorizontal(x: number, y: number): boolean {
  return (y === 1 || y === 8) && x >= 3 && x <= 5;
}

export function XiangqiBoard({
  board,
  canMove,
  role,
  spectatorFlipped,
  colorMode,
  legalMoves,
  lastMove,
  onMove,
  onSelect,
}: XiangqiBoardProps) {
  const [selected, setSelected] = useState<Position | null>(null);
  const fileLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const isFlipped =
    role === 'black' || (role === 'spectator' && spectatorFlipped);

  const legalSet = useMemo(() => {
    return new Set(legalMoves.map((m) => `${m.x}-${m.y}`));
  }, [legalMoves]);

  const topLabels = isFlipped ? [...fileLabels].reverse() : fileLabels;
  const bottomLabels = isFlipped ? fileLabels : [...fileLabels].reverse();
  const palette = boardPalettes[colorMode];

  function toBoardPosition(displayX: number, displayY: number): Position {
    if (!isFlipped) return { x: displayX, y: displayY };
    return {
      x: 8 - displayX,
      y: 9 - displayY,
    };
  }

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
    <div
      className={[
        'inline-flex flex-col gap-2 rounded-2xl border-2 p-3 shadow-2xl',
        palette.frame,
      ].join(' ')}
    >
      <div
        className={[
          'grid grid-cols-9 gap-1 px-1 text-center text-xs font-semibold',
          palette.labelText,
        ].join(' ')}
      >
        {topLabels.map((label) => (
          <span key={`top-${label}`}>{label}</span>
        ))}
      </div>

      <div
        className={[
          'grid grid-cols-9 gap-1 rounded-lg p-2',
          palette.boardSurface,
        ].join(' ')}
      >
        {Array.from({ length: 10 }, (_, displayY) =>
          Array.from({ length: 9 }, (_, displayX) => {
            const boardPos = toBoardPosition(displayX, displayY);
            const key = `${boardPos.x}-${boardPos.y}`;
            const cell = board[boardPos.y][boardPos.x];
            const selectedCell =
              selected?.x === boardPos.x && selected.y === boardPos.y;
            const legal = legalSet.has(key);
            const isLastFrom =
              lastMove?.from.x === boardPos.x && lastMove.from.y === boardPos.y;
            const isLastTo =
              lastMove?.to.x === boardPos.x && lastMove.to.y === boardPos.y;
            const isRiverCell = boardPos.y === 4 || boardPos.y === 5;
            const isRiverTop = boardPos.y === 4;

            const riverCharsTop: Record<number, string> = {
              1: '楚',
              2: '河',
              6: '漢',
              7: '界',
            };
            const riverCharsBottom: Record<number, string> = {
              1: '漢',
              2: '界',
              6: '楚',
              7: '河',
            };

            const riverChar = isRiverTop
              ? riverCharsTop[boardPos.x]
              : boardPos.y === 5
                ? riverCharsBottom[boardPos.x]
                : undefined;

            const drawPalaceBackslash = hasPalaceBackslash(
              boardPos.x,
              boardPos.y,
            );
            const drawPalaceSlash = hasPalaceSlash(boardPos.x, boardPos.y);
            const drawPalaceVertical = hasPalaceVertical(
              boardPos.x,
              boardPos.y,
            );
            const drawPalaceHorizontal = hasPalaceHorizontal(
              boardPos.x,
              boardPos.y,
            );

            return (
              <div
                key={key}
                onClick={() => onCellClick(boardPos.x, boardPos.y)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onCellClick(boardPos.x, boardPos.y)}
                className={[
                  'relative flex h-12 w-12 items-center justify-center border sm:h-14 sm:w-14',
                  palette.cellBase,
                  isRiverCell ? palette.riverCell : '',
                  cell ? 'cursor-pointer' : 'cursor-default',
                  selectedCell ? `ring-2 ${palette.selectedRing}` : '',
                  legal ? `ring-2 ${palette.legalRing}` : '',
                  isLastFrom || isLastTo ? `ring-2 ${palette.lastRing}` : '',
                ].join(' ')}
              >
                {isRiverTop && (
                  <span
                    className={[
                      'pointer-events-none absolute -bottom-[1px] left-0 h-[2px] w-full',
                      palette.lineColor,
                    ].join(' ')}
                  />
                )}

                {boardPos.y === 5 && (
                  <span
                    className={[
                      'pointer-events-none absolute -top-[1px] left-0 h-[2px] w-full',
                      palette.lineColor,
                    ].join(' ')}
                  />
                )}

                {riverChar && !cell && (
                  <span
                    className={[
                      'pointer-events-none absolute text-lg font-bold sm:text-xl',
                      palette.riverText,
                    ].join(' ')}
                  >
                    {riverChar}
                  </span>
                )}

                {drawPalaceBackslash && (
                  <span className="pointer-events-none absolute inset-0 z-[1]">
                    <span
                      className={[
                        'absolute left-[-15%] top-1/2 h-[1.5px] w-[130%] -translate-y-1/2 rotate-45',
                        palette.palaceLine,
                      ].join(' ')}
                    />
                  </span>
                )}

                {drawPalaceSlash && (
                  <span className="pointer-events-none absolute inset-0 z-[1]">
                    <span
                      className={[
                        'absolute left-[-15%] top-1/2 h-[1.5px] w-[130%] -translate-y-1/2 -rotate-45',
                        palette.palaceLine,
                      ].join(' ')}
                    />
                  </span>
                )}

                {drawPalaceVertical && (
                  <span className="pointer-events-none absolute inset-0 z-[1]">
                    <span
                      className={[
                        'absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2',
                        palette.palaceLine,
                      ].join(' ')}
                    />
                  </span>
                )}

                {drawPalaceHorizontal && (
                  <span className="pointer-events-none absolute inset-0 z-[1]">
                    <span
                      className={[
                        'absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2',
                        palette.palaceLine,
                      ].join(' ')}
                    />
                  </span>
                )}

                {cell && (
                  <div
                    draggable={canMove && ownPiece(cell)}
                    onDragStart={() => {
                      setSelected(boardPos);
                      onSelect(boardPos);
                    }}
                    className={[
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-2xl font-bold shadow-sm sm:h-11 sm:w-11',
                      palette.pieceBase,
                      isRedPiece(cell)
                        ? palette.redPieceText
                        : palette.blackPieceText,
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

      <div
        className={[
          'grid grid-cols-9 gap-1 px-1 text-center text-xs font-semibold',
          palette.labelText,
        ].join(' ')}
      >
        {bottomLabels.map((label) => (
          <span key={`bottom-${label}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}
