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
    <div className="mx-auto w-full max-w-3xl rounded-2xl border-2 border-amber-900/60 bg-amber-700/90 p-6 text-amber-950 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lobby</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="rounded-lg border border-amber-900/60 bg-amber-900 px-3 py-1 text-amber-100 hover:bg-amber-950"
          >
            Refresh
          </button>
          <button
            onClick={onBack}
            className="rounded-lg border border-amber-900/60 bg-red-800 px-3 py-1 text-amber-100 hover:bg-red-900"
          >
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p className="text-amber-900">No waiting rooms available.</p>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-lg border border-amber-900/40 bg-amber-100/75 p-3"
            >
              <div>
                <p className="font-medium">Room #{room.id}</p>
                <p className="text-sm text-amber-950/80">
                  Status: {room.status}
                </p>
              </div>
              <button
                onClick={() => onJoinRoom(room.id)}
                className="rounded-lg border border-amber-900/60 bg-amber-900 px-3 py-1 font-semibold text-amber-100 hover:bg-amber-950"
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
