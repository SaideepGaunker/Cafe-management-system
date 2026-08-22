import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from './types';
import { getJwtSecret } from './middleware/auth';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : '*';

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins === '*' || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        const isExplicitlyAllowed = allowedOrigins.includes(origin);
        const isVercelDomain = origin.endsWith('.vercel.app');
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

        if (isExplicitlyAllowed || isVercelDomain || isLocalhost) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
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
        const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
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

// Emit order creation: Broadcast to all clients so order queues & customer dashboards update live
export const emitOrderCreated = (order: any) => {
  if (io) {
    io.emit('orderCreated', order);
    io.to('staff_room').emit('orderCreated', order);
    if (order.userId) {
      io.to(`user:${order.userId}`).emit('orderCreated', order);
    }
    io.emit('dataUpdated');
  }
};

// Emit order status update: Broadcast to ALL connected clients so customer screen updates in real-time
export const emitOrderStatusUpdated = (order: any) => {
  if (io) {
    // Broadcast directly to all clients for instant re-render across UI
    io.emit('orderStatusUpdated', order);

    // Also send to targeted rooms
    io.to('staff_room').emit('orderStatusUpdated', order);
    io.to(`order:${order.id}`).emit('orderStatusUpdated', order);
    if (order.userId) {
      io.to(`user:${order.userId}`).emit('orderStatusUpdated', order);
    }

    // Broadcast data update signal
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
