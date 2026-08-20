import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('JWT Authentication Endpoints', () => {
  const testUser = {
    name: 'Test Barista',
    email: `test_${Date.now()}@cafe.com`,
    password: 'password123',
    role: 'STAFF',
  };

  let token = '';

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).toHaveProperty('role', 'CUSTOMER');
  }, 15000);

  it('should log in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
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
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });
});
