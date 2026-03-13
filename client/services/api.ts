import { Room } from '../types';
import { getServerUrl } from './serverUrl';

const SERVER_URL = getServerUrl();

export async function fetchAvailableRooms(): Promise<Room[]> {
  const response = await fetch(`${SERVER_URL}/api/rooms/available`);
  if (!response.ok) {
    throw new Error('Failed to load rooms');
  }

  const data = await response.json();
  return data.rooms as Room[];
}
