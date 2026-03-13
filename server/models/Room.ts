import mongoose, { Schema } from 'mongoose';

const roomSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    hostPlayer: { type: String, required: true },
    redPlayer: { type: String, default: null },
    blackPlayer: { type: String, default: null },
    spectators: { type: [String], default: [] },
    boardState: { type: [[String]], default: [] },
    turn: { type: String, enum: ['red', 'black'], default: 'red' },
    status: {
      type: String,
      enum: ['waiting', 'playing', 'finished'],
      default: 'waiting',
    },
    winner: { type: String, enum: ['red', 'black', null], default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const RoomModel = mongoose.model('Room', roomSchema);
