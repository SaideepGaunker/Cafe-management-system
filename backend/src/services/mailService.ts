import nodemailer from 'nodemailer';

interface OrderItemWithMenu {
  quantity: number;
  unitPrice: number;
  menuItem: {
    name: string;
    price: number;
  };
}

export interface OrderEmailDetails {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  phone?: string | null;
  deliveryAddress?: string | null;
  tableNumber?: string | null;
  orderType: string;
  status: string;
  totalAmount: number;
  items: OrderItemWithMenu[];
  user?: {
    name: string;
    email: string;
  } | null;
}

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Fallback transport for development / testing when SMTP credentials are not present
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

export function setTransporter(customTransporter: nodemailer.Transporter | null) {
  transporter = customTransporter;
}

export function generateOrderStatusEmailHtml(order: OrderEmailDetails, status: string): string {
  const shortId = order.id.slice(0, 8);

  let headerTitle = `Order Update (#${shortId})`;
  let headerBg = '#F59E0B';
  let messageText = `Your order status is now <strong>${status}</strong>.`;

  switch (status) {
    case 'CONFIRMATION':
    case 'PENDING':
      headerTitle = '🎉 Order Confirmation!';
      headerBg = '#3B82F6';
      messageText = 'Thank you for your order! It has been received and sent to our baristas.';
      break;
    case 'IN_PROGRESS':
      headerTitle = '🔥 Preparation Started!';
      headerBg = '#F59E0B';
      messageText = 'Great news! Our baristas & kitchen staff have started preparing your order.';
      break;
    case 'READY':
      headerTitle = '☕ Your Order is Ready!';
      headerBg = '#10B981';
      messageText = 'Your order has been freshly prepared and is now <strong>ready for pickup</strong>!';
      break;
    case 'OUT_FOR_DELIVERY':
      headerTitle = '🚗 Your Order is Out for Delivery!';
      headerBg = '#10B981';
      messageText = 'Great news! Your order is freshly prepared and now <strong>out for delivery</strong>. Our driver is on the way!';
      break;
    case 'COMPLETED':
      headerTitle = '✅ Order Completed!';
      headerBg = '#10B981';
      messageText = 'Your order has been completed. Thank you for ordering with BiiZnest!';
      break;
    case 'CANCELLED':
      headerTitle = '❌ Order Cancelled';
      headerBg = '#EF4444';
      messageText = 'Your order has been cancelled. If you have questions, please contact our support team.';
      break;
  }

  const itemsListHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #334155; color: #f8fafc;">
          ${item.menuItem?.name || 'Menu Item'} <span style="color: #94a3b8;">x${item.quantity}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #334155; color: #f59e0b; text-align: right; font-weight: bold;">
          $${(item.unitPrice * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 30px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
    <!-- Header -->
    <tr>
      <td style="background-color: ${headerBg}; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${headerTitle}</h1>
        <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Order #${shortId}</p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${order.customerName}</strong>,</p>
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">${messageText}</p>

        <!-- Details Box -->
        <div style="background-color: #0f172a; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #334155;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="color: #94a3b8; font-size: 13px; padding-bottom: 6px;">Order Type</td>
              <td style="color: #f8fafc; font-size: 14px; font-weight: bold; text-align: right; padding-bottom: 6px;">${order.orderType}</td>
            </tr>
            ${
              order.deliveryAddress
                ? `
            <tr>
              <td style="color: #94a3b8; font-size: 13px; padding-bottom: 6px;">Delivery Address</td>
              <td style="color: #f8fafc; font-size: 14px; text-align: right; padding-bottom: 6px;">${order.deliveryAddress}</td>
            </tr>`
                : ''
            }
            ${
              order.tableNumber
                ? `
            <tr>
              <td style="color: #94a3b8; font-size: 13px;">Location / Table</td>
              <td style="color: #f8fafc; font-size: 14px; text-align: right;">${order.tableNumber}</td>
            </tr>`
                : ''
            }
          </table>
        </div>

        <!-- Order Items Summary -->
        <h3 style="font-size: 16px; margin: 24px 0 12px 0; border-bottom: 1px solid #334155; padding-bottom: 8px;">Order Summary</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${itemsListHtml}
          <tr>
            <td style="padding-top: 14px; font-size: 16px; font-weight: bold; color: #f8fafc;">Total Amount</td>
            <td style="padding-top: 14px; font-size: 18px; font-weight: bold; color: #f59e0b; text-align: right;">$${order.totalAmount.toFixed(2)}</td>
          </tr>
        </table>

        <!-- Footer Callout -->
        <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #334155; padding-top: 20px;">
          Thank you for ordering with <strong>BiiZnest</strong>! ☕<br/>
          If you have any questions, feel free to contact us.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendOrderStatusEmail(
  order: OrderEmailDetails,
  recipientEmail: string,
  status: string
) {
  try {
    const activeTransporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"BiiZnest" <notifications@biiznest.com>';
    const subject =
      status === 'OUT_FOR_DELIVERY'
        ? `🚗 Your BiiZnest Order #${order.id.slice(0, 8)} is Out for Delivery!`
        : status === 'READY'
        ? `☕ Your BiiZnest Order #${order.id.slice(0, 8)} is Ready!`
        : status === 'IN_PROGRESS'
        ? `🔥 Your BiiZnest Order #${order.id.slice(0, 8)} is in Preparation!`
        : status === 'COMPLETED'
        ? `✅ Your BiiZnest Order #${order.id.slice(0, 8)} is Completed!`
        : status === 'CANCELLED'
        ? `❌ Your BiiZnest Order #${order.id.slice(0, 8)} has been Cancelled`
        : `🎉 Your BiiZnest Order #${order.id.slice(0, 8)} Confirmation`;

    const html = generateOrderStatusEmailHtml(order, status);
    const text = `Hi ${order.customerName}, your BiiZnest Order #${order.id.slice(0, 8)} status is currently: ${status}. Total: $${order.totalAmount.toFixed(2)}.`;

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      subject,
      text,
      html,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`✉️ Mail notification sent to ${recipientEmail} for status ${status}. MessageId: ${info.messageId || 'json-stream'}`);
    return info;
  } catch (error) {
    console.error(`⚠️ Failed to send order status email to ${recipientEmail}:`, error);
    return null;
  }
}
