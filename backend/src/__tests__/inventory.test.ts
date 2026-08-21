import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index';

vi.mock('../db', () => ({
  prisma: {
    menuItem: {
      findMany: vi.fn().mockImplementation(async () => []),
      findUnique: vi.fn().mockImplementation(async () => null),
    },
    order: {
      create: vi.fn(),
    },
  },
}));

describe('Order & Inventory Deduction', () => {
  it('should reject order if menu item is not found', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Test Customer',
        orderType: 'TAKEAWAY',
        items: [
          {
            menuItemId: '507f1f77bcf86cd799439011',
            quantity: 1000,
          },
        ],
      });

    expect(res.status).toBe(404);
  });
});
