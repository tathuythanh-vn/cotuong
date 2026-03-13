import { Room } from '../types';

interface LobbyProps {
  rooms: Room[];
  loading: boolean;
  onRefresh: () => void;
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
}

export function Lobby({
  rooms,
  loading,
  onRefresh,
  onJoinRoom,
  onBack,
}: LobbyProps) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-xl bg-slate-800 p-6 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Lobby</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="rounded bg-slate-600 px-3 py-1 hover:bg-slate-500"
          >
            Refresh
          </button>
          <button
            onClick={onBack}
            className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600"
          >
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p>No waiting rooms available.</p>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded bg-slate-700 p-3"
            >
              <div>
                <p className="font-medium">Room #{room.id}</p>
                <p className="text-sm text-slate-300">Status: {room.status}</p>
              </div>
              <button
                onClick={() => onJoinRoom(room.id)}
                className="rounded bg-indigo-600 px-3 py-1 hover:bg-indigo-500"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
