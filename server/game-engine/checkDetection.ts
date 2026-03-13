import { applyMove, getPieceColor } from './board.js';
import { getPseudoLegalMoves } from './pieceRules.js';
import { Board, Move, PlayerColor, Position } from '../types.js';

function findGeneral(board: Board, color: PlayerColor): Position | null {
  const target = color === 'red' ? 'G' : 'g';
  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[y].length; x += 1) {
      if (board[y][x] === target) {
        return { x, y };
      }
    }
  }
  return null;
}

/** True when both generals face each other on the same file with no pieces between. */
export function isFlyingGeneral(board: Board): boolean {
  const redGeneral = findGeneral(board, 'red');
  const blackGeneral = findGeneral(board, 'black');
  if (!redGeneral || !blackGeneral) return false;
  if (redGeneral.x !== blackGeneral.x) return false;

  const file = redGeneral.x;
  const [start, end] =
    redGeneral.y < blackGeneral.y
      ? [redGeneral.y + 1, blackGeneral.y]
      : [blackGeneral.y + 1, redGeneral.y];

  for (let y = start; y < end; y += 1) {
    if (board[y][file]) return false;
  }

  return true;
}

/** True when player's general is under direct legal attack. */
export function isCheck(board: Board, player: PlayerColor): boolean {
  if (isFlyingGeneral(board)) {
    return true;
  }

  const generalPos = findGeneral(board, player);
  if (!generalPos) return false;

  const opponent: PlayerColor = player === 'red' ? 'black' : 'red';

  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[y].length; x += 1) {
      const piece = board[y][x];
      if (!piece || getPieceColor(piece) !== opponent) continue;

      const moves = getPseudoLegalMoves(board, { x, y });
      if (
        moves.some((move) => move.x === generalPos.x && move.y === generalPos.y)
      ) {
        return true;
      }
    }
  }

  return false;
}

/** True when player is in check and has no legal escape move. */
export function isCheckmate(board: Board, player: PlayerColor): boolean {
  if (!isCheck(board, player)) return false;

  for (let y = 0; y < board.length; y += 1) {
    for (let x = 0; x < board[y].length; x += 1) {
      const piece = board[y][x];
      if (!piece || getPieceColor(piece) !== player) continue;

      const candidateMoves = getPseudoLegalMoves(board, { x, y });
      for (const destination of candidateMoves) {
        const nextBoard = applyMove(board, {
          from: { x, y },
          to: destination,
        } as Move);

        if (!isCheck(nextBoard, player)) {
          return false;
        }
      }
    }
  }

  return true;
}
