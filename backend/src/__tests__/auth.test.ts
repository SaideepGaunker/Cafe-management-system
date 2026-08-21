import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../index';

const mockHashedPassword = bcrypt.hashSync('password123', 10);

vi.mock('../db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
        if (where.email === 'registered@cafe.com') {
          return {
            id: '65f1a2b3c4d5e6f7a8b9c0d1',
            name: 'Test Barista',
            email: 'registered@cafe.com',
            password: mockHashedPassword,
            phone: '+15551234567',
            role: 'STAFF',
            createdAt: new Date().toISOString(),
            addresses: [],
          };
        }
        if (where.id === '65f1a2b3c4d5e6f7a8b9c0d1') {
          return {
            id: '65f1a2b3c4d5e6f7a8b9c0d1',
            name: 'Test Barista',
            email: 'registered@cafe.com',
            role: 'STAFF',
            createdAt: new Date().toISOString(),
            addresses: [],
          };
        }
        return null;
      }),
      create: vi.fn().mockImplementation(async ({ data }: any) => ({
        id: '65f1a2b3c4d5e6f7a8b9c0d1',
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role || 'CUSTOMER',
        createdAt: new Date().toISOString(),
        addresses: [],
      })),
    },
  },
}));

describe('JWT Authentication Endpoints', () => {
  const newUser = {
    name: 'New Customer',
    email: 'newuser@cafe.com',
    password: 'password123',
  };

  let token = '';

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', newUser.email);
    expect(res.body.user).toHaveProperty('role', 'CUSTOMER');
  });

  it('should log in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'registered@cafe.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'registered@cafe.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should retrieve current profile with valid JWT token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', 'registered@cafe.com');
  });
});
