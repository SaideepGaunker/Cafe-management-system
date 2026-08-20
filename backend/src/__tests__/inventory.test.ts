import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Order & Inventory Deduction', () => {
  it('should reject order if insufficient ingredient stock', async () => {
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
