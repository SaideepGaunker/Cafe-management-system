import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import {
  generateOrderStatusEmailHtml,
  sendOrderStatusEmail,
  setTransporter,
  OrderEmailDetails,
} from '../services/mailService';

describe('Mail Notification Service', () => {
  const mockOrder: OrderEmailDetails = {
    id: '65f1a2b3c4d5e6f7a8b9c0d1',
    customerName: 'Alice Smith',
    customerEmail: 'alice@example.com',
    phone: '+15551234567',
    deliveryAddress: '123 Main St, Suite 4B, Metro City, 10001',
    orderType: 'DELIVERY',
    status: 'PENDING',
    totalAmount: 18.5,
    items: [
      {
        quantity: 2,
        unitPrice: 4.5,
        menuItem: { name: 'Artisan Latte', price: 4.5 },
      },
      {
        quantity: 1,
        unitPrice: 9.5,
        menuItem: { name: 'Avocado Toast & Egg', price: 9.5 },
      },
    ],
  };

  beforeEach(() => {
    setTransporter(null);
  });

  describe('generateOrderStatusEmailHtml', () => {
    it('should generate valid HTML template for OUT_FOR_DELIVERY status', () => {
      const html = generateOrderStatusEmailHtml(mockOrder, 'OUT_FOR_DELIVERY');

      expect(html).toContain('Out for Delivery');
      expect(html).toContain('Alice Smith');
      expect(html).toContain('123 Main St');
      expect(html).toContain('Artisan Latte');
      expect(html).toContain('$18.50');
    });

    it('should generate valid HTML template for READY status', () => {
      const html = generateOrderStatusEmailHtml(mockOrder, 'READY');

      expect(html).toContain('Your Order is Ready');
      expect(html).toContain('Alice Smith');
      expect(html).toContain('ready for pickup');
      expect(html).toContain('Avocado Toast & Egg');
      expect(html).toContain('$18.50');
    });
  });

  describe('sendOrderStatusEmail', () => {
    it('should send email using active nodemailer transporter', async () => {
      const sentMails: any[] = [];
      const mockTransporter = {
        sendMail: vi.fn().mockImplementation((mailOptions) => {
          sentMails.push(mailOptions);
          return Promise.resolve({ messageId: 'test-msg-123' });
        }),
      } as unknown as nodemailer.Transporter;

      setTransporter(mockTransporter);

      const res = await sendOrderStatusEmail(mockOrder, 'alice@example.com', 'OUT_FOR_DELIVERY');

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(sentMails.length).toBe(1);
      expect(sentMails[0].to).toBe('alice@example.com');
      expect(sentMails[0].subject).toContain('Out for Delivery');
      expect(res).toEqual({ messageId: 'test-msg-123' });
    });

    it('should send READY notification email', async () => {
      const sentMails: any[] = [];
      const mockTransporter = {
        sendMail: vi.fn().mockImplementation((mailOptions) => {
          sentMails.push(mailOptions);
          return Promise.resolve({ messageId: 'test-msg-456' });
        }),
      } as unknown as nodemailer.Transporter;

      setTransporter(mockTransporter);

      const res = await sendOrderStatusEmail(mockOrder, 'alice@example.com', 'READY');

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(sentMails[0].to).toBe('alice@example.com');
      expect(sentMails[0].subject).toContain('is Ready!');
      expect(res).toEqual({ messageId: 'test-msg-456' });
    });

    it('should handle errors gracefully without throwing', async () => {
      const failingTransporter = {
        sendMail: vi.fn().mockRejectedValue(new Error('SMTP Connection Failed')),
      } as unknown as nodemailer.Transporter;

      setTransporter(failingTransporter);

      const res = await sendOrderStatusEmail(mockOrder, 'alice@example.com', 'READY');

      expect(res).toBeNull();
    });
  });
});
