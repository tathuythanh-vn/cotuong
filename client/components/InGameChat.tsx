import { FormEvent, useEffect, useRef, useState } from 'react';
import type { BoardColorMode } from '../pages/GamePage';
import { ChatMessage } from '../types';

interface InGameChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  colorMode: BoardColorMode;
}

const panelPalettes = {
  classic: {
    card: 'border-amber-900/60 bg-amber-700/80 text-amber-950',
    list: 'border-amber-900/30 bg-amber-100/70',
    empty: 'text-amber-900/70',
    bubble: 'border-amber-900/20 bg-amber-50/80',
    sender: 'text-amber-950',
    time: 'text-amber-900/70',
    message: 'text-amber-950',
    input:
      'border-amber-900/50 bg-amber-100 text-amber-950 placeholder:text-amber-900/60 focus:border-amber-950',
    sendButton:
      'border-amber-900/70 bg-amber-900 text-amber-100 hover:bg-amber-950',
  },
  jade: {
    card: 'border-emerald-900/60 bg-emerald-700/80 text-emerald-950',
    list: 'border-emerald-900/30 bg-emerald-100/70',
    empty: 'text-emerald-900/70',
    bubble: 'border-emerald-900/20 bg-emerald-50/80',
    sender: 'text-emerald-950',
    time: 'text-emerald-900/70',
    message: 'text-emerald-950',
    input:
      'border-emerald-900/50 bg-emerald-100 text-emerald-950 placeholder:text-emerald-900/60 focus:border-emerald-950',
    sendButton:
      'border-emerald-900/70 bg-emerald-900 text-emerald-100 hover:bg-emerald-950',
  },
  night: {
    card: 'border-slate-700/70 bg-slate-800/90 text-slate-100',
    list: 'border-slate-600/70 bg-slate-700/80',
    empty: 'text-slate-300/75',
    bubble: 'border-slate-500/70 bg-slate-900/70',
    sender: 'text-slate-100',
    time: 'text-slate-300/80',
    message: 'text-slate-100',
    input:
      'border-slate-500/80 bg-slate-900 text-slate-100 placeholder:text-slate-400/70 focus:border-slate-300',
    sendButton:
      'border-slate-600/80 bg-slate-900 text-slate-100 hover:bg-slate-950',
  },
} as const;

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function InGameChat({
  messages,
  onSendMessage,
  colorMode,
}: InGameChatProps) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const palette = panelPalettes[colorMode];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
  }

  return (
    <div
      className={[
        'flex h-[320px] flex-col rounded-xl border p-3 shadow-lg transition-colors duration-300',
        palette.card,
      ].join(' ')}
    >
      <h3 className="mb-2 text-lg font-bold">Chat</h3>

      <div
        className={[
          'mb-3 flex-1 space-y-2 overflow-y-auto rounded-lg border p-2 text-sm',
          palette.list,
        ].join(' ')}
      >
        {messages.length === 0 ? (
          <p className={palette.empty}>No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={['rounded border px-2 py-1', palette.bubble].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={['font-semibold', palette.sender].join(' ')}>
                  {message.senderName}
                </span>
                <span className={['text-xs', palette.time].join(' ')}>
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <p className={['mt-1 break-words', palette.message].join(' ')}>
                {message.text}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={240}
          placeholder="Type a message..."
          className={[
            'flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none',
            palette.input,
          ].join(' ')}
        />
        <button
          type="submit"
          className={[
            'rounded-lg border px-3 py-2 text-sm font-semibold',
            palette.sendButton,
          ].join(' ')}
        >
          Send
        </button>
      </form>
    </div>
  );
}
