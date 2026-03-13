import dotenv from 'dotenv';

dotenv.config();

const rawClientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientOrigins = rawClientOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/co_tuong',
  clientOrigins,
};
