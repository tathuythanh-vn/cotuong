import mongoose, { Schema } from 'mongoose';

const moveSchema = new Schema(
  {
    from: { x: Number, y: Number },
    to: { x: Number, y: Number },
    piece: String,
    captured: String,
    by: String,
    createdAt: String,
  },
  { _id: false },
);

const matchHistorySchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    redPlayer: { type: String, required: true },
    blackPlayer: { type: String, required: true },
    winner: { type: String, enum: ['red', 'black', 'draw'], required: true },
    moves: { type: [moveSchema], default: [] },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const MatchHistoryModel = mongoose.model(
  'MatchHistory',
  matchHistorySchema,
);
