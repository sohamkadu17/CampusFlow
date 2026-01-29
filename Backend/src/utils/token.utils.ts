import jwt, { Secret } from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || '';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  // @ts-ignore - TS issue with jwt.sign overloads
  return jwt.sign({ userId }, secret as Secret, { expiresIn });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || '';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  // @ts-ignore - TS issue with jwt.sign overloads
  return jwt.sign({ userId }, secret as Secret, { expiresIn });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
};
