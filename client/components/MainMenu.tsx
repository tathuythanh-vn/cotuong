interface MainMenuProps {
  onCreateRoom: () => void;
  onQuickMatch: () => void;
  onFindRoom: () => void;
}

export function MainMenu({
  onCreateRoom,
  onQuickMatch,
  onFindRoom,
}: MainMenuProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 rounded-xl bg-slate-800 p-6 shadow-lg">
      <h1 className="text-3xl font-bold text-white">Xiangqi Multiplayer</h1>
      <button
        onClick={onQuickMatch}
        className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
      >
        Play (Quick Match)
      </button>
      <button
        onClick={onFindRoom}
        className="rounded-md bg-slate-600 px-4 py-2 font-semibold text-white hover:bg-slate-500"
      >
        Find Room
      </button>
      <button
        onClick={onCreateRoom}
        className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500"
      >
        Create Room
      </button>
    </div>
  );
}
