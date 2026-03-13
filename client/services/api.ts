import { Room } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export async function fetchAvailableRooms(): Promise<Room[]> {
  const response = await fetch(`${SERVER_URL}/api/rooms/available`);
  if (!response.ok) {
    throw new Error('Failed to load rooms');
  }

  const data = await response.json();
  return data.rooms as Room[];
}
