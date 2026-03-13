import { BOARD_HEIGHT, BOARD_WIDTH, getPieceColor, inBounds } from './board.js';
import { Board, PieceCode, PlayerColor, Position } from '../types.js';

function insidePalace(color: PlayerColor, position: Position): boolean {
  const inFiles = position.x >= 3 && position.x <= 5;
  if (!inFiles) return false;
  return color === 'red'
    ? position.y >= 7 && position.y <= 9
    : position.y >= 0 && position.y <= 2;
}

function crossedRiver(color: PlayerColor, y: number): boolean {
  return color === 'red' ? y <= 4 : y >= 5;
}

function sameColor(a: PieceCode, b: PieceCode): boolean {
  return getPieceColor(a) === getPieceColor(b);
}

function addIfValid(
  board: Board,
  piece: PieceCode,
  candidate: Position,
  moves: Position[],
): void {
  if (!inBounds(candidate)) return;
  const target = board[candidate.y][candidate.x];
  if (!target || !sameColor(piece, target)) {
    moves.push(candidate);
  }
}

function getRookMoves(
  board: Board,
  position: Position,
  piece: PieceCode,
): Position[] {
  const moves: Position[] = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  for (const dir of dirs) {
    let x = position.x + dir.x;
    let y = position.y + dir.y;
    while (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      const target = board[y][x];
      if (!target) {
        moves.push({ x, y });
      } else {
        if (!sameColor(piece, target)) {
          moves.push({ x, y });
        }
        break;
      }
      x += dir.x;
      y += dir.y;
    }
  }

  return moves;
}

function getHorseMoves(
  board: Board,
  position: Position,
  piece: PieceCode,
): Position[] {
  const moves: Position[] = [];
  const patterns = [
    {
      leg: { x: 0, y: -1 },
      ends: [
        { x: -1, y: -2 },
        { x: 1, y: -2 },
      ],
    },
    {
      leg: { x: 0, y: 1 },
      ends: [
        { x: -1, y: 2 },
        { x: 1, y: 2 },
      ],
    },
    {
      leg: { x: -1, y: 0 },
      ends: [
        { x: -2, y: -1 },
        { x: -2, y: 1 },
      ],
    },
    {
      leg: { x: 1, y: 0 },
      ends: [
        { x: 2, y: -1 },
        { x: 2, y: 1 },
      ],
    },
  ];

  for (const pattern of patterns) {
    const leg = {
      x: position.x + pattern.leg.x,
      y: position.y + pattern.leg.y,
    };
    if (!inBounds(leg) || board[leg.y][leg.x]) continue;

    for (const end of pattern.ends) {
      addIfValid(
        board,
        piece,
        { x: position.x + end.x, y: position.y + end.y },
        moves,
      );
    }
  }

  return moves;
}

function getElephantMoves(
  board: Board,
  position: Position,
  piece: PieceCode,
): Position[] {
  const color = getPieceColor(piece);
  const moves: Position[] = [];
  const dirs = [
    { x: 2, y: 2 },
    { x: -2, y: 2 },
    { x: 2, y: -2 },
    { x: -2, y: -2 },
  ];

  for (const dir of dirs) {
    const mid = { x: position.x + dir.x / 2, y: position.y + dir.y / 2 };
    const target = { x: position.x + dir.x, y: position.y + dir.y };

    if (!inBounds(target) || board[mid.y][mid.x]) continue;
    if (color === 'red' && target.y < 5) continue;
    if (color === 'black' && target.y > 4) continue;
    addIfValid(board, piece, target, moves);
  }

  return moves;
}

function getAdvisorMoves(
  board: Board,
  position: Position,
  piece: PieceCode,
): Position[] {
  const color = getPieceColor(piece);
  const moves: Position[] = [];
  const dirs = [
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
  ];

  for (const dir of dirs) {
    const target = { x: position.x + dir.x, y: position.y + dir.y };
    if (!insidePalace(color, target)) continue;
    addIfValid(board, piece, target, moves);
  }

  return moves;
}

function getGeneralMoves(
  board: Board,
  position: Position,
  piece: PieceCode,
): Position[] {
  const color = getPieceColor(piece);
  const moves: Position[] = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  for (const dir of dirs) {
    const target = { x: position.x + dir.x, y: position.y + dir.y };
    if (!insidePalace(color, target)) continue;
    addIfValid(board, piece, target, moves);
  }

  return moves;
}

function getCannonMoves(
  board: Board,
  position: Position,
  piece: PieceCode,
): Position[] {
  const moves: Position[] = [];
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  for (const dir of dirs) {
    let x = position.x + dir.x;
    let y = position.y + dir.y;
    let screenFound = false;

    while (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      const target = board[y][x];
      if (!screenFound) {
        if (!target) {
          moves.push({ x, y });
        } else {
          screenFound = true;
        }
      } else if (target) {
        if (!sameColor(piece, target)) {
          moves.push({ x, y });
        }
        break;
      }

      x += dir.x;
      y += dir.y;
    }
  }

  return moves;
}

function getSoldierMoves(
  board: Board,
  position: Position,
  piece: PieceCode,
): Position[] {
  const color = getPieceColor(piece);
  const moves: Position[] = [];
  const forward = color === 'red' ? -1 : 1;

  addIfValid(board, piece, { x: position.x, y: position.y + forward }, moves);

  if (crossedRiver(color, position.y)) {
    addIfValid(board, piece, { x: position.x + 1, y: position.y }, moves);
    addIfValid(board, piece, { x: position.x - 1, y: position.y }, moves);
  }

  return moves;
}

export function getPseudoLegalMoves(
  board: Board,
  position: Position,
): Position[] {
  const piece = board[position.y][position.x];
  if (!piece) return [];

  const normalized = piece.toUpperCase();
  switch (normalized) {
    case 'R':
      return getRookMoves(board, position, piece);
    case 'H':
      return getHorseMoves(board, position, piece);
    case 'E':
      return getElephantMoves(board, position, piece);
    case 'A':
      return getAdvisorMoves(board, position, piece);
    case 'G':
      return getGeneralMoves(board, position, piece);
    case 'C':
      return getCannonMoves(board, position, piece);
    case 'S':
      return getSoldierMoves(board, position, piece);
    default:
      return [];
  }
}
