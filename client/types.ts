export type PlayerColor = 'red' | 'black';
export type RoomStatus = 'waiting' | 'playing' | 'finished';

export type PieceCode =
  | 'R'
  | 'H'
  | 'E'
  | 'A'
  | 'G'
  | 'C'
  | 'S'
  | 'r'
  | 'h'
  | 'e'
  | 'a'
  | 'g'
  | 'c'
  | 's';

export type Cell = PieceCode | null;
export type Board = Cell[][];

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  from: Position;
  to: Position;
}

export interface MoveRecord extends Move {
  piece: PieceCode;
  captured?: PieceCode | null;
  by: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderSocketId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface RematchVoteState {
  votes: number;
  required: number;
  requestedByName?: string;
}

export interface SurrenderState {
  phase: 'incoming' | 'outgoing';
  requesterSocketId: string;
  requesterName: string;
}

export interface Room {
  id: string;
  hostPlayer: string;
  redPlayer: string | null;
  blackPlayer: string | null;
  spectators: string[];
  playerNames: Record<string, string>;
  boardState: Board;
  turn: PlayerColor;
  status: RoomStatus;
  moveHistory: MoveRecord[];
  winner: PlayerColor | null;
  createdAt: string;
}
