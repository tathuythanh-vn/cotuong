import { useEffect, useState } from 'react';
import { CapturedPieces } from '../components/CapturedPieces';
import { InGameChat } from '../components/InGameChat';
import { MoveHistory } from '../components/MoveHistory';
import { PlayerInfo } from '../components/PlayerInfo';
import { XiangqiBoard } from '../components/XiangqiBoard';
import {
  ChatMessage,
  Move,
  Position,
  RematchVoteState,
  Room,
  SurrenderState,
} from '../types';

interface GamePageProps {
  room: Room;
  role: 'red' | 'black' | 'spectator' | null;
  canMove: boolean;
  legalMoves: Position[];
  lastMove: Move | null;
  onMove: (move: Move) => void;
  onSelect: (position: Position) => void;
  onLeaveRoom: () => void;
  onRequestRematch: () => void;
  onRequestSurrender: () => void;
  onRespondSurrender: (accept: boolean) => void;
  rematchVote: RematchVoteState | null;
  surrenderState: SurrenderState | null;
  isGamePaused: boolean;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string) => void;
  error: string;
}

export type BoardColorMode = 'classic' | 'jade' | 'night';
const BOARD_COLOR_STORAGE_KEY = 'co_tuong_board_color_mode';

const uiPalettes = {
  classic: {
    page: 'bg-amber-950/95 text-amber-100',
    topBar: 'border-amber-900/60 bg-amber-700/80 text-amber-950',
    controlWrap:
      'border-amber-900/70 bg-amber-800 text-xs font-semibold text-amber-100',
    controlField:
      'border-amber-900/70 bg-amber-900 text-amber-100 outline-none',
    neutralButton:
      'border-amber-900/70 bg-amber-800 text-amber-100 hover:bg-amber-900',
    actionButton:
      'border-amber-900/70 bg-amber-900 text-amber-100 hover:bg-amber-950',
    dangerButton: 'border-red-950/70 bg-red-800 text-red-100 hover:bg-red-900',
    notice: 'border-amber-900/60 bg-amber-600/70 text-amber-950',
    modalCard: 'border-amber-900/70 bg-amber-100 text-amber-950',
  },
  jade: {
    page: 'bg-emerald-950/95 text-emerald-100',
    topBar: 'border-emerald-900/60 bg-emerald-700/80 text-emerald-950',
    controlWrap:
      'border-emerald-900/70 bg-emerald-800 text-xs font-semibold text-emerald-100',
    controlField:
      'border-emerald-900/70 bg-emerald-900 text-emerald-100 outline-none',
    neutralButton:
      'border-emerald-900/70 bg-emerald-800 text-emerald-100 hover:bg-emerald-900',
    actionButton:
      'border-emerald-900/70 bg-emerald-900 text-emerald-100 hover:bg-emerald-950',
    dangerButton: 'border-red-950/70 bg-red-800 text-red-100 hover:bg-red-900',
    notice: 'border-emerald-900/60 bg-emerald-600/70 text-emerald-950',
    modalCard: 'border-emerald-900/70 bg-emerald-100 text-emerald-950',
  },
  night: {
    page: 'bg-slate-950 text-slate-100',
    topBar: 'border-slate-700/70 bg-slate-800/90 text-slate-100',
    controlWrap:
      'border-slate-600/80 bg-slate-700 text-xs font-semibold text-slate-100',
    controlField:
      'border-slate-500/80 bg-slate-900 text-slate-100 outline-none',
    neutralButton:
      'border-slate-600/80 bg-slate-700 text-slate-100 hover:bg-slate-600',
    actionButton:
      'border-slate-600/80 bg-slate-900 text-slate-100 hover:bg-slate-950',
    dangerButton: 'border-red-950/70 bg-red-800 text-red-100 hover:bg-red-900',
    notice: 'border-slate-600/80 bg-slate-700/80 text-slate-100',
    modalCard: 'border-slate-600/80 bg-slate-100 text-slate-900',
  },
} as const;

export function GamePage({
  room,
  role,
  canMove,
  legalMoves,
  lastMove,
  onMove,
  onSelect,
  onLeaveRoom,
  onRequestRematch,
  onRequestSurrender,
  onRespondSurrender,
  rematchVote,
  surrenderState,
  isGamePaused,
  chatMessages,
  onSendChatMessage,
  error,
}: GamePageProps) {
  const [spectatorFlipped, setSpectatorFlipped] = useState(false);
  const [boardColorMode, setBoardColorMode] =
    useState<BoardColorMode>('classic');

  useEffect(() => {
    const savedMode = window.localStorage.getItem(BOARD_COLOR_STORAGE_KEY);
    if (
      savedMode === 'classic' ||
      savedMode === 'jade' ||
      savedMode === 'night'
    ) {
      setBoardColorMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (role !== 'spectator') {
      setSpectatorFlipped(false);
    }
  }, [role]);

  function handleBoardColorModeChange(mode: BoardColorMode) {
    setBoardColorMode(mode);
    window.localStorage.setItem(BOARD_COLOR_STORAGE_KEY, mode);
  }

  const uiPalette = uiPalettes[boardColorMode];

  const winnerLabel =
    room.winner === 'red'
      ? 'Red wins!'
      : room.winner === 'black'
        ? 'Black wins!'
        : null;

  const showIncomingSurrenderPopup =
    !winnerLabel && surrenderState?.phase === 'incoming';
  const showOutgoingSurrenderOverlay =
    !winnerLabel && surrenderState?.phase === 'outgoing';

  return (
    <div
      className={[
        'min-h-screen transition-colors duration-300',
        uiPalette.page,
      ].join(' ')}
    >
      <div className="relative mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
        <div
          className={[
            'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3',
            uiPalette.topBar,
          ].join(' ')}
        >
          <h2 className="text-xl font-bold sm:text-2xl">Room #{room.id}</h2>
          <div className="flex items-center gap-2">
            <label
              className={[
                'flex items-center gap-2 rounded-lg border px-2 py-1',
                uiPalette.controlWrap,
              ].join(' ')}
            >
              <span>Board color</span>
              <select
                value={boardColorMode}
                onChange={(event) =>
                  handleBoardColorModeChange(
                    event.target.value as BoardColorMode,
                  )
                }
                className={[
                  'rounded-md border px-2 py-1 text-xs',
                  uiPalette.controlField,
                ].join(' ')}
              >
                <option value="classic">Classic</option>
                <option value="jade">Jade</option>
                <option value="night">Night</option>
              </select>
            </label>

            {role === 'spectator' && (
              <button
                onClick={() => setSpectatorFlipped((prev) => !prev)}
                className={[
                  'rounded-lg border px-3 py-1 text-xs font-semibold',
                  uiPalette.neutralButton,
                ].join(' ')}
              >
                Flip board
              </button>
            )}
            <button
              onClick={onLeaveRoom}
              className={[
                'rounded-lg border px-3 py-1 font-semibold',
                uiPalette.dangerButton,
              ].join(' ')}
            >
              Leave Room
            </button>
            <button
              onClick={onRequestRematch}
              className={[
                'rounded-lg border px-3 py-1 font-semibold',
                uiPalette.actionButton,
              ].join(' ')}
            >
              Rematch{' '}
              {rematchVote
                ? `(${rematchVote.votes}/${rematchVote.required})`
                : ''}
            </button>
            {role !== 'spectator' && !winnerLabel && (
              <button
                onClick={onRequestSurrender}
                className={[
                  'rounded-lg border px-3 py-1 font-semibold',
                  uiPalette.neutralButton,
                ].join(' ')}
              >
                Surrender
              </button>
            )}
          </div>
        </div>

        {rematchVote && (
          <p
            className={[
              'rounded-lg border px-3 py-2 text-sm font-semibold',
              uiPalette.notice,
            ].join(' ')}
          >
            Rematch vote: {rematchVote.votes}/{rematchVote.required}
            {rematchVote.requestedByName
              ? ` • Requested by ${rematchVote.requestedByName}`
              : ''}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <PlayerInfo room={room} role={role} colorMode={boardColorMode} />
            <InGameChat
              messages={chatMessages}
              onSendMessage={onSendChatMessage}
              colorMode={boardColorMode}
            />
          </div>

          <div className="space-y-4">
            <XiangqiBoard
              board={room.boardState}
              canMove={canMove && !room.winner && !isGamePaused}
              role={role}
              spectatorFlipped={spectatorFlipped}
              legalMoves={legalMoves}
              lastMove={lastMove}
              colorMode={boardColorMode}
              onMove={onMove}
              onSelect={onSelect}
            />

            {error && (
              <p className="rounded-lg border border-rose-700 bg-rose-900/80 px-3 py-2 text-rose-100">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <CapturedPieces
              moves={room.moveHistory}
              colorMode={boardColorMode}
            />
            <MoveHistory moves={room.moveHistory} colorMode={boardColorMode} />
          </div>
        </div>

        {winnerLabel && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55">
            <div
              className={[
                'w-full max-w-sm rounded-xl border p-5 shadow-2xl',
                uiPalette.modalCard,
              ].join(' ')}
            >
              <h3 className="text-xl font-bold">Game Over</h3>
              <p className="mt-2 text-base font-semibold">{winnerLabel}</p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={onLeaveRoom}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 font-semibold',
                    uiPalette.dangerButton,
                  ].join(' ')}
                >
                  Leave
                </button>
                <button
                  onClick={onRequestRematch}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 font-semibold',
                    uiPalette.actionButton,
                  ].join(' ')}
                >
                  Rematch
                </button>
              </div>
            </div>
          </div>
        )}

        {showOutgoingSurrenderOverlay && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
            <div
              className={[
                'w-full max-w-sm rounded-xl border p-5 shadow-2xl',
                uiPalette.modalCard,
              ].join(' ')}
            >
              <h3 className="text-lg font-bold">Surrender Requested</h3>
              <p className="mt-2 text-sm">
                Waiting for opponent to accept or decline.
              </p>
            </div>
          </div>
        )}

        {showIncomingSurrenderPopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55">
            <div
              className={[
                'w-full max-w-sm rounded-xl border p-5 shadow-2xl',
                uiPalette.modalCard,
              ].join(' ')}
            >
              <h3 className="text-xl font-bold">Surrender Request</h3>
              <p className="mt-2 text-base font-semibold">
                {surrenderState.requesterName} wants to surrender.
              </p>
              <p className="mt-1 text-sm">
                Accept to end game now, or decline to continue.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => onRespondSurrender(false)}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 font-semibold',
                    uiPalette.neutralButton,
                  ].join(' ')}
                >
                  Decline
                </button>
                <button
                  onClick={() => onRespondSurrender(true)}
                  className={[
                    'flex-1 rounded-lg border px-3 py-2 font-semibold',
                    uiPalette.dangerButton,
                  ].join(' ')}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
