import { applyMove, getPieceColor } from './board.js';
import { isCheck, isFlyingGeneral } from './checkDetection.js';
import { getPseudoLegalMoves } from './pieceRules.js';
import { Board, Move, PlayerColor, Position } from '../types.js';

/**
 * Returns legal destinations for a piece after filtering pseudo moves by
 * king safety and flying-general constraints.
 */
export function getValidMoves(
  board: Board,
  piece: string,
  position: Position,
): Position[] {
  if (!piece) return [];

  const pieceOnBoard = board[position.y][position.x];
  if (!pieceOnBoard || pieceOnBoard !== piece) return [];

  const color = getPieceColor(pieceOnBoard);
  const pseudoMoves = getPseudoLegalMoves(board, position);

  return pseudoMoves.filter((target) => {
    const simulated = applyMove(board, {
      from: position,
      to: target,
    });

    if (isFlyingGeneral(simulated)) {
      const ownGeneralInCheck = isCheck(simulated, color);
      if (ownGeneralInCheck) return false;
    }

    return !isCheck(simulated, color);
  });
}

/** Validates one attempted move for turn order, ownership and legal geometry. */
export function isValidMove(
  board: Board,
  move: Move,
  currentTurn: PlayerColor,
): { valid: boolean; reason?: string } {
  const piece = board[move.from.y]?.[move.from.x];
  if (!piece) {
    return { valid: false, reason: 'No piece at source position' };
  }

  if (getPieceColor(piece) !== currentTurn) {
    return { valid: false, reason: 'Cannot move opponent piece' };
  }

  const legalMoves = getValidMoves(board, piece, move.from);
  const legal = legalMoves.some((m) => m.x === move.to.x && m.y === move.to.y);

  if (!legal) {
    return { valid: false, reason: 'Illegal move' };
  }

  return { valid: true };
}
