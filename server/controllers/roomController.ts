import { Request, Response } from 'express';
import { getAllRooms, serializeRoom } from '../roomStore.js';

export function listRooms(_req: Request, res: Response): void {
  const rooms = getAllRooms().map((room) => serializeRoom(room));
  res.json({ rooms });
}

export function listAvailableRooms(_req: Request, res: Response): void {
  const rooms = getAllRooms()
    .filter((room) => room.status === 'waiting')
    .map((room) => serializeRoom(room));

  res.json({ rooms });
}
