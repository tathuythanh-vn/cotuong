import { Board, Move, PieceCode, PlayerColor, Position } from '../types.js';

export const BOARD_WIDTH = 9;
export const BOARD_HEIGHT = 10;

/** Returns the standard Xiangqi opening setup on a 9x10 board. */
export function createInitialBoard(): Board {
  return [
    ['r', 'h', 'e', 'a', 'g', 'a', 'e', 'h', 'r'],
    [null, null, null, null, null, null, null, null, null],
    [null, 'c', null, null, null, null, null, 'c', null],
    ['s', null, 's', null, 's', null, 's', null, 's'],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    ['S', null, 'S', null, 'S', null, 'S', null, 'S'],
    [null, 'C', null, null, null, null, null, 'C', null],
    [null, null, null, null, null, null, null, null, null],
    ['R', 'H', 'E', 'A', 'G', 'A', 'E', 'H', 'R'],
  ];
}

/** Immutable clone utility for board simulations. */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function inBounds(position: Position): boolean {
  return (
    position.x >= 0 &&
    position.x < BOARD_WIDTH &&
    position.y >= 0 &&
    position.y < BOARD_HEIGHT
  );
}

export function getPieceColor(piece: PieceCode): PlayerColor {
  return piece === piece.toUpperCase() ? 'red' : 'black';
}

/** Applies a move and returns a new board state. */
export function applyMove(board: Board, move: Move): Board {
  const nextBoard = cloneBoard(board);
  const piece = nextBoard[move.from.y][move.from.x];
  nextBoard[move.from.y][move.from.x] = null;
  nextBoard[move.to.y][move.to.x] = piece;
  return nextBoard;
}
