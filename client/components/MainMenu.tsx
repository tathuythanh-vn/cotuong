interface MainMenuProps {
  username: string;
  usernameError?: string;
  onUsernameChange: (value: string) => void;
  onCreateRoom: () => void;
  onQuickMatch: () => void;
  onFindRoom: () => void;
}

export function MainMenu({
  username,
  usernameError,
  onUsernameChange,
  onCreateRoom,
  onQuickMatch,
  onFindRoom,
}: MainMenuProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border-2 border-amber-800 bg-amber-700/90 p-5 text-amber-950 shadow-2xl">
      <div className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-900/80">
          Chinese Chess
        </p>
        <h1 className="text-3xl font-bold">Xiangqi Multiplayer</h1>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="username"
          className="text-sm font-semibold text-amber-950"
        >
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="Enter your username"
          className="w-full rounded-lg border border-amber-900/50 bg-amber-100/90 px-3 py-2 text-amber-950 placeholder:text-amber-900/50 focus:border-amber-950 focus:outline-none"
          maxLength={20}
        />
        {usernameError && (
          <p className="text-xs text-rose-800">{usernameError}</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={onQuickMatch}
          className="rounded-lg border border-amber-900/60 bg-amber-900 px-4 py-2.5 font-semibold text-amber-100 transition hover:bg-amber-950"
        >
          Play (Quick Match)
        </button>
        <button
          onClick={onFindRoom}
          className="rounded-lg border border-amber-900/60 bg-amber-800 px-4 py-2.5 font-semibold text-amber-50 transition hover:bg-amber-900"
        >
          Find Room
        </button>
        <button
          onClick={onCreateRoom}
          className="rounded-lg border border-amber-900/60 bg-red-800 px-4 py-2.5 font-semibold text-amber-50 transition hover:bg-red-900"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}
