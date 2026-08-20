import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'cafe_artisan_secret_key_2026_super_secure';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string);

    if (token && typeof token === 'string') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        (socket as any).user = decoded;
      } catch (err) {
        // Invalid or expired token: proceed as guest
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload | undefined;

    if (user) {
      // Join user-specific room for targeted customer notifications
      socket.join(`user:${user.userId}`);

      // If user is STAFF or ADMIN, join the privileged staff_room
      if (user.role === 'STAFF' || user.role === 'ADMIN') {
        socket.join('staff_room');
        console.log(`⚡ Socket ${socket.id} (${user.role}: ${user.email}) joined staff_room & user:${user.userId}`);
      } else {
        console.log(`⚡ Socket ${socket.id} (CUSTOMER: ${user.email}) joined user:${user.userId}`);
      }
    } else {
      console.log(`⚡ Guest Socket connected: ${socket.id}`);
    }

    // Allow joining room for public order tracking
    socket.on('joinOrderTrack', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined tracking room: order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit data updated signal to all connected clients (triggers background refetch of menu, stock, and orders)
export const emitDataUpdated = () => {
  if (io) {
    io.emit('dataUpdated');
  }
};

// Emit order creation: Send to staff_room (and customer room if applicable), and notify all clients to update stock data
export const emitOrderCreated = (order: any) => {
  if (io) {
    // Notify staff & admins
    io.to('staff_room').emit('orderCreated', order);

    // Notify individual customer if order is linked to user
    if (order.userId) {
      io.to(`user:${order.userId}`).emit('orderCreated', order);
    }

    // Broadcast data update so all client screens refresh menu stock & order queue automatically
    io.emit('dataUpdated');
  }
};

// Emit order status update: Send to staff_room, order tracking room, customer room, and notify all clients
export const emitOrderStatusUpdated = (order: any) => {
  if (io) {
    // Notify kitchen & staff
    io.to('staff_room').emit('orderStatusUpdated', order);

    // Notify public tracking room
    io.to(`order:${order.id}`).emit('orderStatusUpdated', order);

    // Notify individual customer
    if (order.userId) {
      io.to(`user:${order.userId}`).emit('orderStatusUpdated', order);
    }

    // Broadcast data update so all client screens refresh live status & inventory
    io.emit('dataUpdated');
  }
};

// Emit low stock alert: EXCLUSIVELY sent to staff_room (Staff & Admin only)
export const emitLowStockAlert = (alertData: { id: string; name: string; currentStock: number; threshold: number }) => {
  if (io) {
    io.to('staff_room').emit('lowStockAlert', alertData);
    console.log(`📢 Low stock alert emitted to staff_room: ${alertData.name} (${alertData.currentStock} left)`);
  }
};
