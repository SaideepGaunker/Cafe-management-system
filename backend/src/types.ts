import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
